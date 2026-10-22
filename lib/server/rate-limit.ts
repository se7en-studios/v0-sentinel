/**
 * Sliding-window rate limiter, in memory.
 * ponytail: the ceiling is per server instance. On serverless each warm container has its own map,
 * so N containers allow up to N x limit. For a hard guarantee swap `hit` for Upstash/Redis
 * (@upstash/ratelimit) or add a Vercel Firewall rule; callers would not change.
 */
export interface Limiter {
  /** Registers one hit for `key`; `retryAfterSec` is set only when it was refused. */
  hit(key: string, now?: number): { ok: boolean; retryAfterSec: number };
}

const MAX_KEYS = 5000;

export function createLimiter(limit: number, windowMs: number): Limiter {
  const hits = new Map<string, number[]>();
  return {
    hit(key, now = Date.now()) {
      const recent = (hits.get(key) ?? []).filter((t) => t > now - windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return {
          ok: false,
          retryAfterSec: Math.max(
            1,
            Math.ceil((recent[0] + windowMs - now) / 1000),
          ),
        };
      }
      hits.delete(key); // re-insert last: Map order doubles as recency for eviction
      hits.set(key, [...recent, now]);
      if (hits.size > MAX_KEYS) hits.delete(hits.keys().next().value!);
      return { ok: true, retryAfterSec: 0 };
    },
  };
}

/** Client address as seen behind Vercel/proxies; "unknown" shares one bucket (stricter, never open). */
export const clientIp = (req: Request) =>
  req.headers.get("x-real-ip")?.trim() ||
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  "unknown";

/** 429 with Retry-After when `key` is over the limit, otherwise null. */
export function limitResponse(
  limiter: Limiter,
  key: string,
  now?: number,
): Response | null {
  const r = limiter.hit(key, now);
  if (r.ok) return null;
  return Response.json(
    { error: "Demasiados pedidos. Probá de nuevo en un rato." },
    { status: 429, headers: { "Retry-After": String(r.retryAfterSec) } },
  );
}
