import { describe, expect, it, vi } from "vitest";
import { backoffMs, HttpError, parseRetryAfter, retryDelay, withRetry } from "./retry";

const fixed = (v: number) => () => v;

describe("backoffMs", () => {
  it("grows exponentially, is capped and jitters between 50% and 100%", () => {
    expect(backoffMs(0, 1000, 30_000, fixed(1))).toBe(1000);
    expect(backoffMs(0, 1000, 30_000, fixed(0))).toBe(500);
    expect(backoffMs(3, 1000, 30_000, fixed(1))).toBe(8000);
    expect(backoffMs(10, 1000, 30_000, fixed(1))).toBe(30_000);
  });
});

describe("parseRetryAfter", () => {
  it("reads seconds and dates, ignores junk", () => {
    expect(parseRetryAfter("7", 0)).toBe(7000);
    expect(parseRetryAfter(new Date(5000).toUTCString(), 2000)).toBe(3000);
    expect(parseRetryAfter("mañana", 0)).toBeUndefined();
    expect(parseRetryAfter(null, 0)).toBeUndefined();
  });
});

describe("retryDelay", () => {
  const o = { random: fixed(1), baseMs: 1000 };
  it("never retries 401/403 or other 4xx", () => {
    for (const s of [400, 401, 403, 404]) expect(retryDelay(new HttpError("x", s), 0, o)).toBeNull();
  });
  it("retries 5xx and network errors with backoff", () => {
    expect(retryDelay(new HttpError("x", 503), 1, o)).toBe(2000);
    expect(retryDelay(new TypeError("Failed to fetch"), 0, o)).toBe(1000);
  });
  it("429 only waits for Retry-After, and not beyond the cap", () => {
    expect(retryDelay(new HttpError("x", 429), 0, o)).toBeNull();
    expect(retryDelay(new HttpError("x", 429, 5000), 0, o)).toBe(5000);
    expect(retryDelay(new HttpError("x", 429, 600_000), 0, o)).toBeNull();
  });
  it("stops at the retry cap and when offline", () => {
    expect(retryDelay(new HttpError("x", 500), 3, o)).toBeNull();
    expect(retryDelay(new HttpError("x", 500), 0, { ...o, isOnline: () => false })).toBeNull();
  });
});

describe("withRetry", () => {
  it("recovers after failures, sleeping the backoff each time (simulated clock)", async () => {
    let clock = 0;
    const sleep = vi.fn(async (ms: number) => void (clock += ms));
    const fn = vi.fn(async (n: number) => {
      if (n < 2) throw new HttpError("down", 500);
      return "ok";
    });
    await expect(withRetry(fn, { sleep, random: fixed(1), baseMs: 1000 })).resolves.toBe("ok");
    expect(sleep.mock.calls.map((c) => c[0])).toEqual([1000, 2000]);
    expect(clock).toBe(3000);
  });
  it("gives up after the retry cap with the last error", async () => {
    const fn = vi.fn(async () => {
      throw new HttpError("down", 500);
    });
    await expect(withRetry(fn, { sleep: async () => {}, retries: 2 })).rejects.toThrow("down");
    expect(fn).toHaveBeenCalledTimes(3);
  });
  it("does not retry a 401", async () => {
    const fn = vi.fn(async () => {
      throw new HttpError("sesión", 401);
    });
    await expect(withRetry(fn, { sleep: async () => {} })).rejects.toThrow("sesión");
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it("waits for the tab to be visible before the next attempt", async () => {
    const order: string[] = [];
    const fn = vi.fn(async (n: number) => {
      order.push(`try${n}`);
      if (n === 0) throw new HttpError("x", 500);
      return 1;
    });
    await withRetry(fn, {
      sleep: async () => void order.push("sleep"),
      waitVisible: async () => void order.push("visible"),
    });
    expect(order).toEqual(["try0", "sleep", "visible", "try1"]);
  });
});
