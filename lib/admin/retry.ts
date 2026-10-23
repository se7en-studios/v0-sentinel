/** Pure retry policy: exponential backoff with jitter. Time, randomness and visibility are injectable so tests use fake clocks. */

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** parsed Retry-After, in ms */
    readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export interface RetryOptions {
  /** retries after the first attempt */
  retries?: number;
  baseMs?: number;
  maxMs?: number;
  /** a 429 is only retried when the server says when, and that is not longer than this */
  maxRetryAfterMs?: number;
  random?: () => number;
  sleep?: (ms: number) => Promise<void>;
  /** resolves once the tab is visible again (immediately if it already is) */
  waitVisible?: () => Promise<void>;
  isOnline?: () => boolean;
}

const DEFAULTS = { retries: 3, baseMs: 2000, maxMs: 30_000, maxRetryAfterMs: 60_000 };

/** Exponential delay capped at maxMs, with 50-100% jitter so a fleet of tabs does not retry in lockstep. */
export function backoffMs(attempt: number, baseMs: number, maxMs: number, random: () => number): number {
  const cap = Math.min(maxMs, baseMs * 2 ** attempt);
  return Math.round(cap / 2 + (random() * cap) / 2);
}

/** Retry-After is either seconds or an HTTP date. */
export function parseRetryAfter(value: string | null | undefined, nowMs: number): number | undefined {
  if (!value) return undefined;
  const secs = Number(value);
  if (Number.isFinite(secs)) return secs >= 0 ? Math.round(secs * 1000) : undefined;
  const at = Date.parse(value);
  return Number.isNaN(at) ? undefined : Math.max(0, at - nowMs);
}

/** ms to wait before retry number `attempt` (0-based), or null when this failure must not be retried. */
export function retryDelay(err: unknown, attempt: number, o: RetryOptions = {}): number | null {
  const { retries, baseMs, maxMs, maxRetryAfterMs } = { ...DEFAULTS, ...o };
  if (attempt >= retries) return null;
  if (o.isOnline && !o.isOnline()) return null; // the `online` event triggers a fresh load instead
  if (err instanceof DOMException && err.name === "AbortError") return null;
  if (err instanceof HttpError) {
    if (err.status === 429)
      return err.retryAfterMs !== undefined && err.retryAfterMs <= maxRetryAfterMs ? err.retryAfterMs : null;
    if (err.status < 500) return null; // 401/403 (session) and other 4xx will not fix themselves
  }
  return backoffMs(attempt, baseMs, maxMs, o.random ?? Math.random);
}

const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function waitUntilVisible(): Promise<void> {
  if (typeof document === "undefined" || !document.hidden) return Promise.resolve();
  return new Promise((resolve) => {
    const on = () => {
      if (document.hidden) return;
      document.removeEventListener("visibilitychange", on);
      resolve();
    };
    document.addEventListener("visibilitychange", on);
  });
}

/** Runs fn, retrying per retryDelay. Pauses (without burning attempts) while the tab is hidden. */
export async function withRetry<T>(fn: (attempt: number) => Promise<T>, o: RetryOptions = {}): Promise<T> {
  const sleep = o.sleep ?? realSleep;
  const waitVisible = o.waitVisible ?? waitUntilVisible;
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn(attempt);
    } catch (e) {
      const wait = retryDelay(e, attempt, o);
      if (wait === null) throw e;
      await sleep(wait);
      await waitVisible();
    }
  }
}
