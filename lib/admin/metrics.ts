import type { EarlyView } from "./early";
import type { FirePoint } from "./types";

const MIN_MS = 60_000;
const DAY_MS = 86_400_000;

export interface GoesLead {
  lat: number;
  lng: number;
  firstAt: number;
  confirmedAt: number;
  /** minutes between GOES first seeing it and the polar confirmation (can be 0 or negative) */
  minutes: number;
}

export const median = (nums: number[]): number | null => {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

/** Minutes GOES-19 gained on every early detection a polar satellite later confirmed, newest first. */
export function goesLeads(early: EarlyView[]): GoesLead[] {
  return early
    .flatMap((e) =>
      e.status === "confirmed" && e.confirmedAt !== undefined
        ? [
            {
              lat: e.lat,
              lng: e.lng,
              firstAt: e.firstAt,
              confirmedAt: e.confirmedAt,
              minutes: Math.round((e.confirmedAt - e.firstAt) / MIN_MS),
            },
          ]
        : [],
    )
    .sort((a, b) => b.confirmedAt - a.confirmedAt);
}

/** Detections of the last 24 h per satellite code (undefined = the feed did not say), biggest first. */
export function satCounts24(
  fires: FirePoint[],
  tsOf: (p: FirePoint) => number,
  now: number,
): { code: number | undefined; count: number }[] {
  const tally = new Map<number | undefined, number>();
  for (const p of fires) {
    const t = tsOf(p);
    if (!Number.isFinite(t) || t > now || now - t > DAY_MS) continue;
    tally.set(p[7], (tally.get(p[7]) ?? 0) + 1);
  }
  return [...tally]
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count);
}

export type Freshness = "ok" | "late" | "stale" | "none";

/**
 * How current a feed's newest acquisition is. Our own criterion (not NASA's): GOES-19 scans every
 * 10 minutes, so 30 min is on time and 2 h is late; each polar satellite crosses Argentina about
 * twice a day, plus FIRMS processing delay, so 12 h is on time and 24 h is late.
 */
export function freshness(
  sourceId: string,
  newestAt: number | undefined,
  now: number,
): Freshness {
  if (!newestAt) return "none";
  const hours = Math.max(0, now - newestAt) / (60 * MIN_MS);
  const [ok, late] = sourceId.startsWith("goes") ? [0.5, 2] : [12, 24];
  return hours <= ok ? "ok" : hours <= late ? "late" : "stale";
}
