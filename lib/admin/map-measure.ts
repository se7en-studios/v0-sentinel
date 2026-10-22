import area from "@turf/area";
import length from "@turf/length";
import { lineString, polygon } from "@turf/helpers";

/** data-attribute on the map container: set while the measure tool owns map clicks */
export const MEASURING_ATTR = "measuring";

export type LngLat = [number, number];

export interface Measure {
  km: number;
  /** hectares, only when the ring is closed with at least 3 distinct points */
  ha: number | null;
}

const key = (p: LngLat) => `${p[0]},${p[1]}`;

/** Drops consecutive duplicate clicks (a double click adds the same point twice). */
export const dedupe = (pts: LngLat[]): LngLat[] =>
  pts.filter((p, i) => i === 0 || key(p) !== key(pts[i - 1]));

/**
 * Distance of the polyline; when `closed`, the perimeter is included and the
 * enclosed area is returned too.
 */
export function measure(points: LngLat[], closed: boolean): Measure {
  const pts = dedupe(points);
  if (pts.length < 2) return { km: 0, ha: null };
  const ring = closed && pts.length >= 3 ? [...pts, pts[0]] : null;
  const km = length(lineString(ring ?? pts), { units: "kilometers" });
  return {
    km,
    ha: ring ? area(polygon([ring])) / 10_000 : null,
  };
}
