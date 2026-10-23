import { describe, expect, it } from "vitest";
import { FAILURES_FOR_BANNER, healthOf, INITIAL_CONNECTION, nextConnection } from "./connection";

describe("connection state", () => {
  it("shows a banner only after several failures in a row, and a good call clears it", () => {
    let s = INITIAL_CONNECTION;
    s = nextConnection(s, { type: "fail" });
    expect(healthOf(s, true)).toBe("ok");
    for (let i = 1; i < FAILURES_FOR_BANNER; i++) s = nextConnection(s, { type: "fail" });
    expect(healthOf(s, true)).toBe("degraded");
    s = nextConnection(s, { type: "ok", at: 99 });
    expect(healthOf(s, true)).toBe("ok");
    expect(s.lastOkAt).toBe(99);
  });
  it("offline wins over failures, expired session wins over offline, and keeps the last good time", () => {
    const s = nextConnection({ failures: 0, lastOkAt: 5, authExpired: false }, { type: "auth" });
    expect(healthOf(s, false)).toBe("auth");
    expect(s.lastOkAt).toBe(5);
    expect(healthOf(INITIAL_CONNECTION, false)).toBe("offline");
  });
});
