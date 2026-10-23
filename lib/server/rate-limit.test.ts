import { describe, expect, test } from "vitest";
import { clientIp, createLimiter, limitResponse } from "./rate-limit";

describe("createLimiter", () => {
  test("refuses past the limit and reports when to retry", () => {
    const l = createLimiter(2, 10_000);
    expect(l.hit("a", 0).ok).toBe(true);
    expect(l.hit("a", 1000).ok).toBe(true);
    const r = l.hit("a", 4000);
    expect(r.ok).toBe(false);
    expect(r.retryAfterSec).toBe(6);
  });

  test("window slides: old hits stop counting", () => {
    const l = createLimiter(1, 1000);
    expect(l.hit("a", 0).ok).toBe(true);
    expect(l.hit("a", 500).ok).toBe(false);
    expect(l.hit("a", 1001).ok).toBe(true);
  });

  test("keys are independent", () => {
    const l = createLimiter(1, 1000);
    expect(l.hit("a", 0).ok).toBe(true);
    expect(l.hit("b", 0).ok).toBe(true);
  });

  test("refused hits do not extend the block", () => {
    const l = createLimiter(1, 1000);
    l.hit("a", 0);
    l.hit("a", 900);
    expect(l.hit("a", 1001).ok).toBe(true);
  });
});

describe("limitResponse / clientIp", () => {
  test("429 carries Retry-After", async () => {
    const l = createLimiter(1, 5000);
    expect(limitResponse(l, "k", 0)).toBeNull();
    const res = limitResponse(l, "k", 1000)!;
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("4");
  });

  test("prefers x-real-ip, then first x-forwarded-for", () => {
    const h = (o: Record<string, string>) =>
      new Request("http://x", { headers: o });
    expect(
      clientIp(h({ "x-real-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2" })),
    ).toBe("1.1.1.1");
    expect(clientIp(h({ "x-forwarded-for": "2.2.2.2, 3.3.3.3" }))).toBe(
      "2.2.2.2",
    );
    expect(clientIp(h({}))).toBe("unknown");
  });
});

describe("clientIp cap", () => {
  test("a giant spoofed header cannot become a giant map key", () => {
    const r = new Request("http://x", { headers: { "x-real-ip": "9".repeat(5000) } });
    expect(clientIp(r).length).toBe(64);
  });
});
