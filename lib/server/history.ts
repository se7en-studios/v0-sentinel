import { parseFireRows } from "@/lib/admin/fires-parse";
import {
  WINDOW_DAYS,
  windowDates,
  type YearCounts,
} from "@/lib/admin/history-compare";
import { AR_BBOX, inArgentina } from "@/lib/server/argentina";

/**
 * Daily VIIRS fire counts inside Argentina for the last 10 days and the same dates of the 3 years before.
 * One satellite on purpose: NOAA-20 flies since 2018 in every year compared (NOAA-21 only since 2023), so
 * adding it would make this year look "above normal" just from having more eyes. Nominal+high confidence only.
 * Past years come from the standard archive (`_SP`), the current one from near-real-time (`_NRT`).
 * Cost: 2 FIRMS requests per year (5 days each) = 8 per refresh, at most one refresh per CACHE_MS per instance.
 */
export const YEARS_BACK = 3;
const FIRST_YEAR = 2018;
const CHUNK_DAYS = 5;
const CHUNKS = WINDOW_DAYS / CHUNK_DAYS;
const CONCURRENCY = 4;
const REQUEST_MS = 15_000;
export const TOTAL_MS = 30_000;
const CACHE_MS = 30 * 60_000;
const REVALIDATE_PAST = 86_400;
const REVALIDATE_NOW = 1_800;

export interface HistoryBody {
  updated: string;
  end: string;
  window: number;
  satellite: string;
  /** current year first, then the previous ones; counts null = no data from FIRMS (not zero) */
  years: (YearCounts & { source: "NRT" | "SP" })[];
}

type Cache = { at: number; end: string; body: HistoryBody };
let cache: Cache | null = null;
let inflight: Promise<HistoryBody> | null = null;

export const resetHistoryCache = () => {
  cache = null;
  inflight = null;
};

async function fetchChunk(
  key: string,
  source: string,
  start: string,
  revalidate: number,
  signal: AbortSignal,
): Promise<string | null> {
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${source}/${AR_BBOX}/${CHUNK_DAYS}/${start}`;
  try {
    const r = await fetch(url, {
      next: { revalidate },
      signal: AbortSignal.any([signal, AbortSignal.timeout(REQUEST_MS)]),
    });
    const text = r.ok ? await r.text() : "";
    return text.startsWith("latitude") ? text : null;
  } catch {
    return null;
  }
}

/** Counts per date of the window, or null if any chunk failed (a partial year would read as "few fires"). */
function countDays(
  chunks: (string | null)[],
  dates: string[],
): number[] | null {
  if (chunks.some((c) => c === null)) return null;
  const counts = new Map(dates.map((d) => [d, 0]));
  for (const csv of chunks) {
    for (const r of parseFireRows(csv as string, "viirs")) {
      if (r.conf >= 1 && counts.has(r.date) && inArgentina(r.lat, r.lng))
        counts.set(r.date, (counts.get(r.date) ?? 0) + 1);
    }
  }
  return dates.map((d) => counts.get(d) ?? 0);
}

/** Runs the jobs with at most `limit` in flight. */
async function pool<T>(
  jobs: (() => Promise<T>)[],
  limit: number,
): Promise<T[]> {
  const out: T[] = new Array(jobs.length);
  let next = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const i = next++;
      out[i] = await jobs[i]();
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, jobs.length) }, worker),
  );
  return out;
}

async function build(key: string, now: number): Promise<HistoryBody> {
  const end = new Date(now).toISOString().slice(0, 10);
  const thisYear = Number(end.slice(0, 4));
  const signal = AbortSignal.timeout(TOTAL_MS);
  const plan = Array.from({ length: YEARS_BACK + 1 }, (_, k) => {
    const year = thisYear - k;
    return {
      year,
      dates: windowDates(end, year),
      current: k === 0,
      ok: year >= FIRST_YEAR,
    };
  });
  const jobs = plan.flatMap((p) =>
    p.ok
      ? Array.from(
          { length: CHUNKS },
          (_, c) => () =>
            fetchChunk(
              key,
              p.current ? "VIIRS_NOAA20_NRT" : "VIIRS_NOAA20_SP",
              p.dates[c * CHUNK_DAYS],
              p.current ? REVALIDATE_NOW : REVALIDATE_PAST,
              signal,
            ),
        )
      : [],
  );
  const chunks = await pool(jobs, CONCURRENCY);
  let at = 0;
  const years = plan.map((p) => {
    const mine = p.ok ? chunks.slice(at, (at += CHUNKS)) : [];
    return {
      year: p.year,
      source: p.current ? ("NRT" as const) : ("SP" as const),
      counts: p.ok ? countDays(mine, p.dates) : null,
    };
  });
  return {
    updated: new Date(now).toISOString(),
    end,
    window: WINDOW_DAYS,
    satellite: "VIIRS NOAA-20",
    years,
  };
}

/** Whole answer cached per instance; concurrent callers share one run. A run where nothing answered is not kept. */
export async function loadHistory(
  key: string,
  now = Date.now(),
): Promise<HistoryBody> {
  const end = new Date(now).toISOString().slice(0, 10);
  if (cache && cache.end === end && now - cache.at < CACHE_MS)
    return cache.body;
  inflight ??= build(key, now)
    .then((body) => {
      if (body.years.some((y) => y.counts)) cache = { at: now, end, body };
      return body;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}
