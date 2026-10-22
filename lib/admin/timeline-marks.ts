import type { EarlyView } from "./early";

/** Argentina is UTC-3 all year (no daylight saving). */
export const ART_OFFSET_MS = -3 * 3600_000;
export const HOUR_MS = 3600_000;

/** Instants inside the range that fall on a multiple of `stepMs` of Argentine local time (24 h = midnights). */
export function artTicks(t0: number, t1: number, stepMs: number): number[] {
  const out: number[] = [];
  let t = Math.ceil((t0 + ART_OFFSET_MS) / stepMs) * stepMs - ART_OFFSET_MS;
  for (; t <= t1; t += stepMs) out.push(t);
  return out;
}

export interface EarlyMark {
  id: string;
  t: number;
  kind: "first" | "confirmed";
  at: [number, number];
}

/** First sighting and polar confirmation of every non-industrial early alert, inside the range, oldest first. */
export function earlyMarks(
  early: EarlyView[],
  t0: number,
  t1: number,
): EarlyMark[] {
  const out: EarlyMark[] = [];
  early.forEach((e, i) => {
    if (e.status === "noise") return;
    const at: [number, number] = [e.lng, e.lat];
    const id = `${i}-${e.firstAt}`;
    if (e.firstAt >= t0 && e.firstAt <= t1)
      out.push({ id: `${id}-f`, t: e.firstAt, kind: "first", at });
    if (e.confirmedAt && e.confirmedAt >= t0 && e.confirmedAt <= t1)
      out.push({ id: `${id}-c`, t: e.confirmedAt, kind: "confirmed", at });
  });
  return out.sort((a, b) => a.t - b.t);
}
