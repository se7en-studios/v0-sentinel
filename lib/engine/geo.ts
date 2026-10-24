// Planar helpers for fire-scale geometry (tens of km): a local equirectangular
// projection in metres is accurate to well under 1% at that size.

export type XY = [number, number];
export type LngLat = [number, number];

const M_PER_DEG_LAT = 110_574;
const M_PER_DEG_LNG = 111_320;

export interface Projection {
  toXY(p: LngLat): XY;
  toLngLat(p: XY): LngLat;
}

export function localProjection(lat0: number, lng0: number): Projection {
  const kx = M_PER_DEG_LNG * Math.cos((lat0 * Math.PI) / 180);
  return {
    toXY: ([lng, lat]) => [(lng - lng0) * kx, (lat - lat0) * M_PER_DEG_LAT],
    toLngLat: ([x, y]) => [lng0 + x / kx, lat0 + y / M_PER_DEG_LAT],
  };
}

/** Approximate ground distance in metres between two points. */
export function distM(aLat: number, aLng: number, bLat: number, bLng: number) {
  const kx = M_PER_DEG_LNG * Math.cos((((aLat + bLat) / 2) * Math.PI) / 180);
  const dx = (bLng - aLng) * kx;
  const dy = (bLat - aLat) * M_PER_DEG_LAT;
  return Math.hypot(dx, dy);
}

/** Compass bearing in degrees (0 = N, 90 = E) from a to b in a planar frame. */
export function bearingXY(a: XY, b: XY) {
  return ((Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI + 360) % 360;
}

export const DIRECTIONS_8 = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"] as const;
export type Direction8 = (typeof DIRECTIONS_8)[number];

export const toDirection8 = (deg: number): Direction8 =>
  DIRECTIONS_8[Math.round(deg / 45) % 8];

/** Closest point on segment ab to p, and its distance. */
export function nearestOnSegment(p: XY, a: XY, b: XY): { q: XY; d: number } {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const t =
    len2 === 0
      ? 0
      : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
  const q: XY = [a[0] + t * dx, a[1] + t * dy];
  return { q, d: Math.hypot(p[0] - q[0], p[1] - q[1]) };
}

/** Ray-casting point-in-ring test (ring may or may not repeat its first vertex). */
export function inRing(p: XY, ring: XY[]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

/** Point-in-polygon for polygon = [outer, ...holes]. */
export function inPolygon(p: XY, poly: XY[][]) {
  if (!inRing(p, poly[0])) return false;
  for (let h = 1; h < poly.length; h++) if (inRing(p, poly[h])) return false;
  return true;
}

/** Signed area of a ring in m² (positive = counter-clockwise). */
export function ringArea(ring: XY[]) {
  let s = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++)
    s += (ring[j][0] - ring[i][0]) * (ring[j][1] + ring[i][1]);
  return s / 2;
}

/**
 * Bucket index for "everything within r metres" queries over lat/lng points.
 * Cells are r wide, so a query only scans the 3x3 neighbourhood.
 */
export class GridIndex<T extends { lat: number; lng: number }> {
  private cells = new Map<string, T[]>();
  private readonly dLat: number;
  private readonly dLng: number;
  readonly r: number;

  constructor(r: number, refLat: number) {
    this.r = r;
    this.dLat = r / M_PER_DEG_LAT;
    this.dLng = r / (M_PER_DEG_LNG * Math.cos((refLat * Math.PI) / 180));
  }

  private key(i: number, j: number) {
    return `${i}:${j}`;
  }

  add(item: T) {
    const k = this.key(Math.floor(item.lat / this.dLat), Math.floor(item.lng / this.dLng));
    const list = this.cells.get(k);
    if (list) list.push(item);
    else this.cells.set(k, [item]);
  }

  /** Items within r metres of (lat, lng). */
  near(lat: number, lng: number, r = this.r): T[] {
    const ci = Math.floor(lat / this.dLat);
    const cj = Math.floor(lng / this.dLng);
    const span = Math.ceil(r / this.r);
    const out: T[] = [];
    for (let di = -span; di <= span; di++)
      for (let dj = -span; dj <= span; dj++)
        for (const it of this.cells.get(this.key(ci + di, cj + dj)) ?? [])
          if (distM(lat, lng, it.lat, it.lng) <= r) out.push(it);
    return out;
  }

  any(lat: number, lng: number, r = this.r, pred?: (it: T) => boolean): boolean {
    const ci = Math.floor(lat / this.dLat);
    const cj = Math.floor(lng / this.dLng);
    const span = Math.ceil(r / this.r);
    for (let di = -span; di <= span; di++)
      for (let dj = -span; dj <= span; dj++)
        for (const it of this.cells.get(this.key(ci + di, cj + dj)) ?? [])
          if ((!pred || pred(it)) && distM(lat, lng, it.lat, it.lng) <= r) return true;
    return false;
  }
}

/** Douglas-Peucker simplification of a closed ring (keeps it closed, >= 4 points). */
export function simplifyRing(ring: XY[], tolM: number): XY[] {
  if (ring.length <= 5) return ring;
  const keep = new Uint8Array(ring.length);
  keep[0] = keep[ring.length - 1] = 1;
  const stack: [number, number][] = [[0, ring.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    let worst = -1;
    let worstD = tolM;
    for (let i = a + 1; i < b; i++) {
      const d = nearestOnSegment(ring[i], ring[a], ring[b]).d;
      if (d > worstD) [worst, worstD] = [i, d];
    }
    if (worst !== -1) {
      keep[worst] = 1;
      stack.push([a, worst], [worst, b]);
    }
  }
  const out = ring.filter((_, i) => keep[i]);
  return out.length >= 4 ? out : ring;
}
