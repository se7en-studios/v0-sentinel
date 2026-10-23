/** "Is this normal for the date?": today's 10-day window against the same dates of earlier years. Pure. */

export const WINDOW_DAYS = 10;
/** Ratio (current / past average) below this reads "below normal", above HIGH reads "above normal". */
export const LOW_RATIO = 0.7;
export const HIGH_RATIO = 1.4;
/** Under this average of fires per 10-day window the ratio is noise (2 vs 1 is "2x"): no verdict. */
export const MIN_AVG_TOTAL = 30;

export type Verdict = "low" | "normal" | "high" | "unknown";

export interface YearCounts {
  year: number;
  /** one count per day of the window (oldest first), or null when FIRMS had no data for that year */
  counts: number[] | null;
}

export interface Comparison {
  /** past years that actually had data */
  used: number;
  /** past years asked for */
  asked: number;
  /** per day of the window: min / mean / max across the used years */
  band: { min: number; mean: number; max: number }[];
  currentTotal: number | null;
  avgTotal: number | null;
  minTotal: number | null;
  maxTotal: number | null;
  /** current / average of past windows; null when there is nothing solid to divide by */
  ratio: number | null;
  verdict: Verdict;
}

const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const DAY = 86_400_000;

/**
 * The `n` UTC dates ending at `endIso`, moved to `year`. The window is aligned by calendar day, so
 * Feb 29 in a leap end date maps to Feb 28 of a common year (never rolling into March).
 */
export function windowDates(endIso: string, year: number, n = WINDOW_DAYS) {
  const [, m, d] = endIso.split("-").map(Number);
  let end = Date.UTC(year, m - 1, d);
  if (new Date(end).getUTCMonth() !== m - 1) end = Date.UTC(year, m - 1, d - 1);
  return Array.from({ length: n }, (_, i) => iso(end - (n - 1 - i) * DAY));
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const valid = (c: number[] | null, n: number): c is number[] =>
  Array.isArray(c) && c.length === n && c.every((v) => Number.isFinite(v) && v >= 0);

export function compareSeason(
  current: number[] | null,
  past: YearCounts[],
  n = WINDOW_DAYS,
): Comparison {
  const series = past.map((p) => p.counts).filter((c): c is number[] => valid(c, n));
  const totals = series.map(sum);
  const band = Array.from({ length: n }, (_, i) => {
    const v = series.map((s) => s[i]);
    return v.length
      ? { min: Math.min(...v), mean: sum(v) / v.length, max: Math.max(...v) }
      : { min: 0, mean: 0, max: 0 };
  });
  const currentTotal = valid(current, n) ? sum(current) : null;
  const avgTotal = totals.length ? sum(totals) / totals.length : null;
  const solid = currentTotal !== null && avgTotal !== null && avgTotal >= MIN_AVG_TOTAL;
  const ratio = solid ? currentTotal / avgTotal : null;
  const verdict: Verdict =
    ratio === null ? "unknown" : ratio < LOW_RATIO ? "low" : ratio > HIGH_RATIO ? "high" : "normal";
  return {
    used: series.length,
    asked: past.length,
    band,
    currentTotal,
    avgTotal,
    minTotal: totals.length ? Math.min(...totals) : null,
    maxTotal: totals.length ? Math.max(...totals) : null,
    ratio,
    verdict,
  };
}

/** Untrusted /api/admin/history body to the shape the card draws, or null. */
export interface HistoryView {
  end: string;
  current: number[] | null;
  past: YearCounts[];
}

export function parseHistory(raw: unknown, n = WINDOW_DAYS): HistoryView | null {
  const o = raw as { end?: unknown; years?: unknown } | null;
  if (!o || typeof o.end !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(o.end)) return null;
  if (!Array.isArray(o.years) || o.years.length === 0) return null;
  const years: YearCounts[] = [];
  for (const y of o.years as { year?: unknown; counts?: unknown }[]) {
    if (!y || typeof y.year !== "number") return null;
    years.push({ year: y.year, counts: valid(y.counts as number[] | null, n) ? (y.counts as number[]) : null });
  }
  const [first, ...past] = years;
  return { end: o.end, current: first.counts, past };
}
