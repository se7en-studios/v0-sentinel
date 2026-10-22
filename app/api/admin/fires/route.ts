import { NextResponse } from "next/server";
import { clusterDetections } from "@/lib/admin/cluster";
import { FIRE_SATS } from "@/lib/admin/fire-sources";
import {
  dropModisDuplicates,
  packPoints,
  parseFireRows,
  type FireRow,
} from "@/lib/admin/fires-parse";
import type { FiresPayload, SourceStatus } from "@/lib/admin/types";
import {
  FIRMS_LABEL,
  FIRMS_MODIS,
  fetchFirmsCsv,
  fetchFirmsSource,
} from "@/lib/firms";
import { allowed } from "@/lib/server/admin-guard";
import { AR_BBOX, inArgentina } from "@/lib/server/argentina";

const MAX_CLUSTERS = 8;
const MS_DAY = 86_400_000;
const NL = String.fromCharCode(10);

/** Two FIRMS windows (it caps a request at 5 days) as one CSV: the recent header plus the older rows. */
const joinWindows = (recent: string, prior: string | null) =>
  [recent.trim(), ...(prior ? prior.trim().split(NL).slice(1) : [])].join(NL);

/** Per-satellite feed status: what each pass contributed and how fresh its newest acquisition is. */
function sourceStatuses(
  rows: FireRow[],
  viirsOk: boolean,
  modisOk: boolean,
): SourceStatus[] {
  return FIRE_SATS.filter((s) => s.id !== "N").map((s) => {
    const mine = rows.filter((r) => r.sat === s.code);
    return {
      id: s.id.toLowerCase(),
      label: `${s.label} · ${s.sensor}`,
      ok: s.sensor === "VIIRS" ? viirsOk : modisOk,
      count: mine.length,
      ...(mine.length && { newestAt: Math.max(...mine.map((r) => r.at)) }),
    };
  });
}

export async function GET(req: Request) {
  if (!(await allowed(req)))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const key = process.env.NASA_FIRMS_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Falta NASA_FIRMS_KEY en el servidor" },
      { status: 503 },
    );
  }
  try {
    const fetchedAt = Date.now();
    // FIRMS caps a request at 5 days: fetch today-4..today and today-9..today-5.
    const older = new Date(fetchedAt - 9 * MS_DAY).toISOString().slice(0, 10);
    const windows = ["", `/${older}`];
    const url = (date: string) => (source: string) =>
      `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${source}/${AR_BBOX}/5${date}`;
    const init = { next: { revalidate: 1800 } };
    const [[recent, prior], [modisRecent, modisPrior]] = await Promise.all([
      Promise.all(windows.map((d) => fetchFirmsCsv(url(d), init))),
      Promise.all(
        windows.map((d) => fetchFirmsSource(FIRMS_MODIS, url(d), init)),
      ),
    ]);
    if (recent === null) {
      return NextResponse.json(
        { error: `${FIRMS_LABEL}: NASA FIRMS no respondió datos válidos` },
        { status: 502 },
      );
    }
    const inAr = (r: FireRow) => inArgentina(r.lat, r.lng);
    const viirs = parseFireRows(joinWindows(recent, prior), "viirs").filter(
      inAr,
    );
    // a MODIS outage must not cost the VIIRS data: it only drops its own rows
    const modis = modisRecent
      ? dropModisDuplicates(
          parseFireRows(joinWindows(modisRecent, modisPrior), "modis").filter(
            inAr,
          ),
          viirs,
        )
      : [];
    const rows = [...viirs, ...modis];
    const { days, points, newestAt } = packPoints(rows);
    const body: FiresPayload = {
      updated: new Date(fetchedAt).toISOString(),
      days,
      points,
      // single-link clusters (<= 3 km); low-confidence detections do not seed fires
      clusters: clusterDetections(
        points.filter((p) => p[3] > 0),
        { limit: MAX_CLUSTERS },
      ),
      // latency instrumentation: when the server pulled FIRMS and how fresh the newest detection was
      fetchedAt,
      ...(newestAt > 0 && { newestDetectionAt: newestAt }),
      sources: sourceStatuses(rows, true, modisRecent !== null),
    };
    return NextResponse.json(body, {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo contactar a NASA FIRMS" },
      { status: 502 },
    );
  }
}
