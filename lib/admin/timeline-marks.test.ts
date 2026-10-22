import { describe, expect, it } from "vitest";
import { ART_OFFSET_MS, HOUR_MS, artTicks, earlyMarks } from "./timeline-marks";
import type { EarlyView } from "./early";

describe("artTicks", () => {
  it("aligns day ticks to Argentine midnight (03:00 UTC)", () => {
    const t0 = Date.UTC(2026, 9, 20, 10);
    const ticks = artTicks(t0, t0 + 3 * 24 * HOUR_MS, 24 * HOUR_MS);
    expect(ticks).toHaveLength(3);
    for (const t of ticks) expect(new Date(t).getUTCHours()).toBe(3);
  });
  it("keeps every tick inside the range", () => {
    const t0 = 1_000_000_000_000;
    const t1 = t0 + 50 * HOUR_MS;
    for (const t of artTicks(t0, t1, 6 * HOUR_MS)) {
      expect(t).toBeGreaterThanOrEqual(t0);
      expect(t).toBeLessThanOrEqual(t1);
      expect((t + ART_OFFSET_MS) % (6 * HOUR_MS)).toBe(0);
    }
  });
});

describe("earlyMarks", () => {
  const e = (over: Partial<EarlyView>): EarlyView =>
    ({
      lat: -41,
      lng: -71,
      firstAt: 100,
      lastAt: 200,
      scans: 3,
      frp: 1,
      sources: ["FIRMS"],
      status: "open",
      ...over,
    }) as EarlyView;
  it("emits first sighting and confirmation, skips noise and out-of-range", () => {
    const marks = earlyMarks(
      [
        e({ status: "confirmed", confirmedAt: 150 }),
        e({ status: "noise" }),
        e({ firstAt: 5000 }),
      ],
      0,
      1000,
    );
    expect(marks.map((m) => m.kind)).toEqual(["first", "confirmed"]);
  });
});
