import { describe, expect, it } from "vitest";
import { isEarlyPayload, isFiresPayload } from "./payload-guard";

const ok = { updated: "x", days: ["2026-10-01"], points: [[-40, -71, 3, 1, 0, 1830, 0]], clusters: [] };

describe("payload guards", () => {
  it("accepts a well formed fires payload, with or without the optional satellite code", () => {
    expect(isFiresPayload(ok)).toBe(true);
    expect(isFiresPayload({ ...ok, points: [[-40, -71, 3, 1, 0, 1830, 0, 2]] })).toBe(true);
  });
  it("rejects shapes that used to crash the panel", () => {
    for (const bad of [
      null,
      [],
      { ...ok, days: null },
      { ...ok, points: [[1, 2]] },
      { ...ok, points: [[-40, -71, 3, 1, 5, 1830, 0]] },
      { ...ok, clusters: [{}] },
      { ...ok, sources: [{}] },
      { ...ok, sources: [{ id: "x", label: "X", ok: true }] }, // no `count`: crashed Métricas
    ])
      expect(isFiresPayload(bad)).toBe(false);
  });
  it("checks early detections", () => {
    const e = { lat: 1, lng: 2, frp: 3, scans: 1, firstAt: 1, lastAt: 2, sources: [] };
    expect(isEarlyPayload({ early: [e], sources: [] })).toBe(true);
    expect(isEarlyPayload({ early: [{ lat: 1 }] })).toBe(false);
    expect(isEarlyPayload({})).toBe(false);
  });
});
