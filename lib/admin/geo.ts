import area from "@turf/area";
import length from "@turf/length";
import along from "@turf/along";
import buffer from "@turf/buffer";
import centroid from "@turf/centroid";
import bbox from "@turf/bbox";
import inside from "@turf/boolean-point-in-polygon";
import { feature, point } from "@turf/helpers";
import type { Feat, FirePoint } from "./types";

type Poly = GeoJSON.Polygon | GeoJSON.MultiPolygon;
const asFeature = (f: Feat) =>
  feature(f.geometry as unknown as GeoJSON.Geometry);

export const areaHa = (f: Feat) => area(asFeature(f)) / 10_000;
export const lengthKm = (f: Feat) =>
  length(asFeature(f), { units: "kilometers" });
export const centerOf = (f: Feat): [number, number] =>
  centroid(asFeature(f)).geometry.coordinates as [number, number];

export function fmtArea(ha: number, units: "ha" | "km2") {
  if (units === "km2")
    return `${(ha / 100).toLocaleString("es-AR", { maximumFractionDigits: 2 })} km²`;
  return `${ha.toLocaleString("es-AR", { maximumFractionDigits: ha < 100 ? 1 : 0 })} ha`;
}

export const fmtKm = (km: number) =>
  km < 1
    ? `${Math.round(km * 1000)} m`
    : `${km.toLocaleString("es-AR", { maximumFractionDigits: 2 })} km`;

/** Fires inside a zone, optionally widened by bufferKm. */
export function firesInZone(
  zone: Feat,
  pts: FirePoint[],
  bufferKm: number,
): FirePoint[] {
  if (zone.geometry.type !== "Polygon" && zone.geometry.type !== "MultiPolygon")
    return [];
  let poly = asFeature(zone) as GeoJSON.Feature<Poly>;
  if (bufferKm > 0) {
    const b = buffer(poly, bufferKm, { units: "kilometers" });
    if (b) poly = b as GeoJSON.Feature<Poly>;
  }
  const [w, s, e, n] = bbox(poly);
  return pts.filter(
    (p) =>
      p[1] >= w &&
      p[1] <= e &&
      p[0] >= s &&
      p[0] <= n &&
      inside(point([p[1], p[0]]), poly),
  );
}

/** Position + heading along a route, ping-pong looping. */
export function alongRoute(f: Feat, distKm: number) {
  const line = feature(f.geometry as unknown as GeoJSON.LineString);
  const total = length(line, { units: "kilometers" });
  if (total <= 0) return null;
  const m = distKm % (2 * total);
  const fwd = m <= total;
  const d = fwd ? m : 2 * total - m;
  const p = along(line, d, { units: "kilometers" }).geometry.coordinates;
  const q = along(line, Math.min(total, d + 0.02), { units: "kilometers" })
    .geometry.coordinates;
  const s = fwd ? 1 : -1;
  const heading =
    (Math.atan2((q[0] - p[0]) * s, (q[1] - p[1]) * s) * 180) / Math.PI;
  return {
    pos: p as [number, number],
    heading: (heading + 360) % 360,
    total,
    progress: d / total,
  };
}

export const distKm = (a: [number, number], b: [number, number]) => {
  const r = Math.PI / 180;
  const dLat = (b[1] - a[1]) * r;
  const dLng = (b[0] - a[0]) * r;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};

/** Closed ring around a zone, offset outward by offsetM. */
export function patrolRing(zone: Feat, offsetM: number): [number, number][] | null {
  const b = buffer(asFeature(zone) as GeoJSON.Feature<Poly>, offsetM / 1000, { units: "kilometers" });
  if (!b || b.geometry.type !== "Polygon") return null;
  return b.geometry.coordinates[0] as [number, number][];
}

/**
 * Boustrophedon sweep over a zone: east-west passes spaced spacingM apart,
 * clipped by sampling. Exact for convex zones; concave ones may cross gaps.
 */
export function sweepPath(zone: Feat, spacingM: number): [number, number][] {
  if (zone.geometry.type !== "Polygon") return [];
  const poly = asFeature(zone) as GeoJSON.Feature<Poly>;
  const [w, s, e, n] = bbox(poly);
  const midLat = (s + n) / 2;
  const dLat = spacingM / 111_000;
  const dLng = 80 / (111_320 * Math.cos((midLat * Math.PI) / 180));
  const path: [number, number][] = [];
  let leftToRight = true;
  for (let y = s + dLat / 2; y < n; y += dLat) {
    let first: number | null = null;
    let last: number | null = null;
    for (let x = w; x <= e; x += dLng) {
      if (inside(point([x, y]), poly)) {
        if (first === null) first = x;
        last = x;
      }
    }
    if (first === null || last === null) continue;
    path.push(leftToRight ? [first, y] : [last, y], leftToRight ? [last, y] : [first, y]);
    leftToRight = !leftToRight;
  }
  return path;
}
