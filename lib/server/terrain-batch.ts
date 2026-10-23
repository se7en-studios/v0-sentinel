import type { TerrainInfo } from "@/lib/admin/terrain";

export const BATCH_MAX = 25;
const CONCURRENCY = 5;
const BUDGET_MS = 20_000;

// Argentina's bounding box (see AR_BBOX): the rasters are read per point, so keep the scope tight.
const LAT = [-56, -21] as const;
const LNG = [-74, -52] as const;

export const inArgentina = (lat: number, lng: number) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= LAT[0] &&
  lat <= LAT[1] &&
  lng >= LNG[0] &&
  lng <= LNG[1];

export interface BatchPoint {
  lat: number;
  lng: number;
}

/** Validates the request body; null when it is not 1..BATCH_MAX points inside Argentina. */
export function parseBatch(body: unknown): BatchPoint[] | null {
  const pts = (body as { points?: unknown } | null)?.points;
  if (!Array.isArray(pts) || pts.length < 1 || pts.length > BATCH_MAX)
    return null;
  const out: BatchPoint[] = [];
  for (const p of pts) {
    const { lat, lng } = (p ?? {}) as Record<string, unknown>;
    if (typeof lat !== "number" || typeof lng !== "number") return null;
    if (!inArgentina(lat, lng)) return null;
    out.push({ lat, lng });
  }
  return out;
}

/**
 * Reads every point with at most `concurrency` lookups in flight and one shared time budget.
 * Result order matches `points`; a point that failed or did not start in time is null.
 */
export async function readBatch(
  points: BatchPoint[],
  read: (lat: number, lng: number) => Promise<TerrainInfo>,
  concurrency = CONCURRENCY,
  budgetMs = BUDGET_MS,
): Promise<(TerrainInfo | null)[]> {
  const out: (TerrainInfo | null)[] = points.map(() => null);
  const end = Date.now() + budgetMs;
  let next = 0;
  const worker = async () => {
    while (next < points.length) {
      const i = next++;
      const left = end - Date.now();
      if (left <= 0) return;
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        out[i] = await Promise.race([
          read(points[i].lat, points[i].lng),
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error("timeout")), left);
          }),
        ]);
      } catch {
        out[i] = null;
      } finally {
        clearTimeout(timer);
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(concurrency, points.length) }, worker),
  );
  return out;
}
