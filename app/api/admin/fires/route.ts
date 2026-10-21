import { NextResponse } from "next/server";
import inside from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import countries from "@/data/latam-countries.json";
import { isAuthed } from "@/lib/admin/auth";
import { firebaseEnabled } from "@/lib/admin/firebase";
import { verifyFirebaseToken } from "@/lib/admin/firebase-verify";
import { nearestPlace } from "@/lib/admin/places";
import type { FireCluster, FirePoint, FiresPayload } from "@/lib/admin/types";
import { fetchFirmsCsv } from "@/lib/firms";

// west,south,east,north around Argentina; the country polygon filters the rest.
const AR_BBOX = "-74,-56,-52,-21";
const CONF: Record<string, number> = { l: 0, n: 1, h: 2 };
const CELL = 0.15;

const argentina = (countries as GeoJSON.FeatureCollection).features.find(
  (f) => (f.properties as { name?: string } | null)?.name === "Argentina",
);

function parse(csv: string): FiresPayload {
  const [head, ...rows] = csv.trim().split("\n");
  const cols = head.split(",");
  const ix = (n: string) => cols.indexOf(n);
  const [iLat, iLng, iDate, iTime, iConf, iFrp, iDn] = [
    "latitude",
    "longitude",
    "acq_date",
    "acq_time",
    "confidence",
    "frp",
    "daynight",
  ].map(ix);
  const days = [...new Set(rows.map((r) => r.split(",")[iDate]))].sort();
  const points: FirePoint[] = [];
  for (const row of rows) {
    const c = row.split(",");
    const lat = parseFloat(c[iLat]);
    const lng = parseFloat(c[iLng]);
    if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
    if (
      argentina &&
      !inside(
        point([lng, lat]),
        argentina as GeoJSON.Feature<GeoJSON.MultiPolygon>,
      )
    )
      continue;
    points.push([
      Math.round(lat * 1e4) / 1e4,
      Math.round(lng * 1e4) / 1e4,
      parseFloat(c[iFrp]) || 0,
      CONF[c[iConf]] ?? 1,
      days.indexOf(c[iDate]),
      parseInt(c[iTime], 10) || 0,
      c[iDn] === "N" ? 1 : 0,
    ]);
  }
  return {
    updated: new Date().toISOString(),
    days,
    points,
    clusters: clusterize(points),
  };
}

function clusterize(points: FirePoint[]): FireCluster[] {
  const cells = new Map<
    string,
    { lat: number; lng: number; n: number; frp: number }
  >();
  for (const p of points) {
    if (p[3] === 0) continue;
    const k = `${Math.floor(p[0] / CELL)}:${Math.floor(p[1] / CELL)}`;
    const c = cells.get(k) ?? { lat: 0, lng: 0, n: 0, frp: 0 };
    c.lat += p[0];
    c.lng += p[1];
    c.n += 1;
    c.frp += p[2];
    cells.set(k, c);
  }
  return [...cells.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, 8)
    .map((c) => {
      const lat = c.lat / c.n;
      const lng = c.lng / c.n;
      return {
        lat,
        lng,
        count: c.n,
        frp: Math.round(c.frp),
        ...nearestPlace(lat, lng),
      };
    });
}

async function allowed(req: Request) {
  if (firebaseEnabled) {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    return token ? verifyFirebaseToken(token) : false;
  }
  return isAuthed();
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
    // FIRMS caps a request at 5 days: fetch today-4..today and today-9..today-5.
    const older = new Date(Date.now() - 9 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const [recent, prior] = await Promise.all(
      ["", `/${older}`].map((date) =>
        fetchFirmsCsv(
          (source) =>
            `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${source}/${AR_BBOX}/5${date}`,
          { next: { revalidate: 1800 } },
        ),
      ),
    );
    if (recent === null) {
      return NextResponse.json(
        { error: "NASA FIRMS no respondió datos válidos" },
        { status: 502 },
      );
    }
    const priorRows = prior
      ? prior.trim().split(String.fromCharCode(10)).slice(1)
      : [];
    const csv = [recent.trim(), ...priorRows].join(String.fromCharCode(10));
    return NextResponse.json(parse(csv), {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo contactar a NASA FIRMS" },
      { status: 502 },
    );
  }
}
