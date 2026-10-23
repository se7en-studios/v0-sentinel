import type { EarlyPayload, FiresPayload } from "./types";

/** Shape checks for what /api/admin/* returns: a malformed body must become an error message, never a render crash. */
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const nums = (a: unknown, n: number) => Array.isArray(a) && a.length >= n && a.slice(0, n).every((x) => Number.isFinite(x));
const sourcesOk = (v: unknown) =>
  v === undefined ||
  (Array.isArray(v) && v.every((s) => isObj(s) && typeof s.id === "string" && typeof s.label === "string" && Number.isFinite(s.count)));

export function isFiresPayload(j: unknown): j is FiresPayload {
  if (!isObj(j)) return false;
  const { days, points, clusters } = j;
  return (
    Array.isArray(days) &&
    days.every((d) => typeof d === "string") &&
    Array.isArray(points) &&
    points.every((p) => nums(p, 7) && (p as number[])[4] < days.length) &&
    Array.isArray(clusters) &&
    clusters.every((c) => isObj(c) && nums([c.lat, c.lng, c.count, c.frp], 4)) &&
    sourcesOk(j.sources)
  );
}

export function isEarlyPayload(j: unknown): j is EarlyPayload {
  if (!isObj(j) || !Array.isArray(j.early) || !sourcesOk(j.sources)) return false;
  return j.early.every(
    (e) => isObj(e) && nums([e.lat, e.lng, e.frp, e.scans, e.firstAt, e.lastAt], 6) && Array.isArray(e.sources),
  );
}
