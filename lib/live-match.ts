// Finds which tracked fire an outline drawn elsewhere refers to, e.g. one of
// Sentinel's "Incidentes" (detections grouped at 3 km, convex outline).
// Pure and dependency-light, so it runs in the browser.

import { distM, inRing, type LngLat } from "./engine/geo";
import type { LiveBundle } from "./incident";

export interface FireQuery {
  /** centre of the outline */
  at: LngLat;
  /** outline as [lng, lat] vertices, open or closed */
  ring: LngLat[];
}

const NEAR_M = 15_000;

/**
 * The tracked fire with the most detections inside the outline (a merged
 * fire's detections count for the fire it merged into). Failing that, the
 * fire whose centre is nearest the outline's, if within 15 km; else null.
 */
export function matchFire(live: LiveBundle, q: FireQuery): number | null {
  const listed = new Set(live.live.meta.map((m) => m.id));
  const into = new Map(live.fires.map((f) => [f.id, f.mergedInto]));
  const resolve = (id: number) => {
    for (let k: number | undefined = id, hops = 0; k !== undefined && hops < 64; k = into.get(k), hops++)
      if (listed.has(k)) return k;
    return null;
  };

  const xs = q.ring.map((p) => p[0]);
  const ys = q.ring.map((p) => p[1]);
  const [w, e, s, n] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const count = new Map<number, number>();
  for (const p of live.pixels) {
    if (p[0] < w || p[0] > e || p[1] < s || p[1] > n || !inRing([p[0], p[1]], q.ring)) continue;
    const id = resolve(p[7]);
    if (id !== null) count.set(id, (count.get(id) ?? 0) + 1);
  }
  let best: number | null = null;
  for (const [id, c] of count) if (best === null || c > count.get(best)!) best = id;
  if (best !== null) return best;

  let near = NEAR_M;
  for (const m of live.live.meta) {
    const d = distM(q.at[1], q.at[0], m.center[1], m.center[0]);
    if (d <= near) {
      near = d;
      best = m.id;
    }
  }
  return best;
}
