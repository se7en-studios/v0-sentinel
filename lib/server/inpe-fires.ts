import { parseInpePolar } from "@/lib/admin/inpe-fires";
import type { FireRow } from "@/lib/admin/fires-parse";

const BASE =
  "https://dataserver-coids.inpe.br/queimadas/queimadas/focos/csv/diario/America_Sul";
const MS_DAY = 86_400_000;
const TIMEOUT_MS = 15_000;
const TTL_MS = 10 * 60_000;
/** Backup window: the last 48 h (today and yesterday in UTC, filtered by acquisition time). */
const WINDOW_MS = 2 * MS_DAY;

const day = (ms: number) =>
  new Date(ms).toISOString().slice(0, 10).replaceAll("-", "");

// ponytail: a daily file is ~1.5-5 MB, above Next's 2 MB fetch-cache limit, so cache the parsed
// rows here instead (per instance). Fine for a fallback path; move to a cron + DB if it gets hot.
let cached: { at: number; rows: FireRow[] } | null = null;

async function fetchDay(ymd: string): Promise<string> {
  try {
    const res = await fetch(`${BASE}/focos_diario_${ymd}.csv`, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return res.ok ? await res.text() : "";
  } catch {
    return "";
  }
}

/** Polar detections (South America, last 48 h) from INPE, or null when neither day answered. */
export async function fetchInpePolar(now: number): Promise<FireRow[] | null> {
  if (cached && now - cached.at < TTL_MS) return cached.rows;
  const texts = await Promise.all([
    fetchDay(day(now)),
    fetchDay(day(now - MS_DAY)),
  ]);
  const valid = texts.filter(
    (t) => t.startsWith("id,lat") || t.startsWith("lat"),
  );
  if (valid.length === 0) return null;
  const rows = valid
    .flatMap(parseInpePolar)
    .filter((r) => r.at >= now - WINDOW_MS && r.at <= now + 3_600_000);
  cached = { at: now, rows };
  return rows;
}

/** Test hook: forget the cache. */
export const resetInpeCache = () => {
  cached = null;
};
