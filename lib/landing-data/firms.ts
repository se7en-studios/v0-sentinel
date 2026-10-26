import { geoContains } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import countriesGeoJson from "@/data/latam-countries.json";

export interface FirePoint {
  lat: number;
  lng: number;
  confidence: string;
  acqDate: string;
  acqTime: string;
  frp: number;
}

/** Parses a FIRMS CSV. Rows with unusable coordinates are dropped. */
export function parseFirmsCsv(csv: string): FirePoint[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => h.trim());
  const col = (n: string) => header.indexOf(n);
  const [latI, lngI, confI, dateI, timeI, frpI] = [
    "latitude",
    "longitude",
    "confidence",
    "acq_date",
    "acq_time",
    "frp",
  ].map(col);
  if (latI === -1 || lngI === -1) return [];

  const out: FirePoint[] = [];
  for (const line of lines.slice(1)) {
    const c = line.split(",");
    const lat = parseFloat(c[latI]);
    const lng = parseFloat(c[lngI]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const frp = frpI !== -1 ? parseFloat(c[frpI]) : 0;
    out.push({
      lat,
      lng,
      confidence: confI !== -1 ? (c[confI] ?? "").trim() : "",
      acqDate: dateI !== -1 ? (c[dateI] ?? "").trim() : "",
      acqTime: timeI !== -1 ? (c[timeI] ?? "").trim() : "",
      frp: Number.isFinite(frp) ? frp : 0,
    });
  }
  return out;
}

/** Low-confidence VIIRS detections ("l") are excluded everywhere. */
export const isReliable = (p: FirePoint) => p.confidence.toLowerCase() !== "l";

/** Acquisition instant (UTC) of a point, or NaN when date/time are missing. */
export function acqTimestamp(p: FirePoint): number {
  if (!p.acqDate) return NaN;
  const t = p.acqTime.padStart(4, "0");
  return Date.parse(`${p.acqDate}T${t.slice(0, 2)}:${t.slice(2)}:00Z`);
}

/** Keeps points acquired in the rolling window [now - hours, now]. */
export function withinHours(
  points: FirePoint[],
  hours: number,
  now: number,
): FirePoint[] {
  const from = now - hours * 3_600_000;
  return points.filter((p) => {
    const t = acqTimestamp(p);
    return t >= from && t <= now + 600_000; // 10 min of clock skew
  });
}

const argentina = (
  countriesGeoJson as FeatureCollection<Geometry, { name: string }>
).features.find((f) => f.properties.name === "Argentina") as Feature<Geometry>;

// ponytail: simplified country polygon (data/latam-countries.json), so points
// within a few km of the border can be misclassified. Results are cached per
// 0.05 deg cell (~5 km) to keep ~100k-row counts cheap; upgrade to a
// full-resolution border only if exact border counts ever matter.
const cellCache = new Map<string, boolean>();
export function isInArgentina(lat: number, lng: number): boolean {
  const k = `${Math.round(lat * 20)}|${Math.round(lng * 20)}`;
  let v = cellCache.get(k);
  if (v === undefined) {
    v = geoContains(argentina, [lng, lat]);
    cellCache.set(k, v);
  }
  return v;
}

/** Highest-intensity points first, at most n. Does not mutate the input. */
export const topByFrp = (points: FirePoint[], n: number): FirePoint[] =>
  [...points].sort((a, b) => b.frp - a.frp).slice(0, n);
