import { NextResponse } from "next/server";
import { clusterDetections } from "@/lib/admin/cluster";
import { FIRE_SATS } from "@/lib/admin/fire-sources";
import {
  dropModisDuplicates,
  packPoints,
  parseFireRows,
  type FireRow,
} from "@/lib/admin/fires-parse";
import { inpeStatuses } from "@/lib/admin/inpe-fires";
import type { FiresPayload, SourceStatus } from "@/lib/admin/types";
import {
  FIRMS_LABEL,
  FIRMS_MODIS,
  fetchFirmsCsv,
  fetchFirmsSource,
} from "@/lib/firms";
import { guardAdmin } from "@/lib/server/admin-guard";
import { createLimiter } from "@/lib/server/rate-limit";
import { AR_BBOX, inArgentina } from "@/lib/server/argentina";
import { fetchInpePolar } from "@/lib/server/inpe-fires";

// Vercel function ceiling: slow upstreams must not be cut at the 10 s default
// FIRMS (12 s) plus the INPE backup (15 s) must fit inside this, or the backup never answers
export const maxDuration = 40;

const firesLimiter = createLimiter(30, 60_000);

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

const FIRMS_TIMEOUT_MS = 12_000;
const CACHE = { "Cache-Control": "private, max-age=300" };

/** Rows to the panel payload: packed points plus single-link clusters (<= 3 km, no low-confidence seeds). */
function buildPayload(
  rows: FireRow[],
  fetchedAt: number,
  sources: SourceStatus[],
  fallback?: string,
): FiresPayload {
  const { days, points, newestAt } = packPoints(rows);
  return {
    updated: new Date(fetchedAt).toISOString(),
    days,
    points,
    clusters: clusterDetections(
      points.filter((p) => p[3] > 0),
      { limit: MAX_CLUSTERS },
    ),
    // latency instrumentation: when the server pulled the feed and how fresh the newest detection was
    fetchedAt,
    ...(newestAt > 0 && { newestDetectionAt: newestAt }),
    sources,
    ...(fallback && { fallback }),
  };
}

/** FIRMS is down: polar detections from INPE, with the outage and the backup spelled out in `sources`. */
async function inpeBackup(fetchedAt: number): Promise<Response | null> {
  const all = await fetchInpePolar(fetchedAt);
  if (all === null) return null;
  const rows = all.filter((r) => inArgentina(r.lat, r.lng));
  const firmsDown: SourceStatus = {
    id: "firms-polar",
    label: `${FIRMS_LABEL} · NASA FIRMS`,
    ok: false,
    count: 0,
    error: "NASA FIRMS no respondió: se muestran focos de respaldo de INPE",
  };
  return NextResponse.json(
    buildPayload(
      rows,
      fetchedAt,
      [firmsDown, ...inpeStatuses(rows, true)],
      "INPE",
    ),
    { headers: CACHE },
  );
}

export async function GET(req: Request) {
  const denied = await guardAdmin(req, firesLimiter);
  if (denied) return denied;
  const key = process.env.NASA_FIRMS_KEY;
  const fetchedAt = Date.now();
  const backup = async (error: string, status: number) =>
    (await inpeBackup(fetchedAt)) ?? NextResponse.json({ error }, { status });
  if (!key) return backup("Falta NASA_FIRMS_KEY en el servidor", 503);
  try {
    // FIRMS caps a request at 5 days: fetch today-4..today and today-9..today-5.
    const older = new Date(fetchedAt - 9 * MS_DAY).toISOString().slice(0, 10);
    const windows = ["", `/${older}`];
    const url = (date: string) => (source: string) =>
      `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${source}/${AR_BBOX}/5${date}`;
    const init = {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(FIRMS_TIMEOUT_MS),
    };
    const [[recent, prior], [modisRecent, modisPrior]] = await Promise.all([
      Promise.all(windows.map((d) => fetchFirmsCsv(url(d), init))),
      Promise.all(
        windows.map((d) => fetchFirmsSource(FIRMS_MODIS, url(d), init)),
      ),
    ]);
    if (recent === null)
      return backup(
        `${FIRMS_LABEL}: NASA FIRMS no respondió datos válidos`,
        502,
      );
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
    return NextResponse.json(
      buildPayload(
        rows,
        fetchedAt,
        sourceStatuses(rows, true, modisRecent !== null),
      ),
      { headers: CACHE },
    );
  } catch {
    return backup("No se pudo contactar a NASA FIRMS", 502);
  }
}
