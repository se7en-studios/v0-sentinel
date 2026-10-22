import { describe, expect, it } from "vitest";
import type { EarlyView } from "./early";
import type { FirePoint } from "./types";
import { freshness, goesLeads, median, satCounts24 } from "./metrics";

const early = (p: Partial<EarlyView>): EarlyView => ({
  lat: -40,
  lng: -70,
  frp: 10,
  scans: 2,
  firstAt: 0,
  lastAt: 0,
  sources: [],
  status: "open",
  ...p,
});

describe("median", () => {
  it("handles empty, odd and even lists", () => {
    expect(median([])).toBeNull();
    expect(median([5, 1, 3])).toBe(3);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });
});

describe("goesLeads", () => {
  it("keeps only confirmed detections and measures the minutes gained", () => {
    const leads = goesLeads([
      early({ status: "confirmed", firstAt: 0, confirmedAt: 90 * 60_000 }),
      early({ status: "confirmed", firstAt: 0, confirmedAt: 30 * 60_000 }),
      early({ status: "open", firstAt: 0 }),
      early({ status: "noise", firstAt: 0 }),
    ]);
    expect(leads.map((l) => l.minutes)).toEqual([90, 30]);
  });
});

describe("satCounts24", () => {
  const now = Date.parse("2026-10-20T12:00:00Z");
  const at = (hours: number) => now - hours * 3_600_000;
  const fire = (sat?: number): FirePoint => [0, 0, 5, 1, 0, 0, 0, sat];
  it("counts only the last 24 h and groups by satellite", () => {
    const times = new Map<FirePoint, number>();
    const mk = (h: number, sat?: number) => {
      const p = fire(sat);
      times.set(p, at(h));
      return p;
    };
    const fires = [mk(1, 0), mk(2, 0), mk(3, 1), mk(30, 0), mk(4)];
    const out = satCounts24(fires, (p) => times.get(p)!, now);
    expect(out).toEqual([
      { code: 0, count: 2 },
      { code: 1, count: 1 },
      { code: undefined, count: 1 },
    ]);
  });
});

describe("freshness", () => {
  const now = Date.parse("2026-10-20T12:00:00Z");
  it("uses tight limits for GOES and loose ones for polar satellites", () => {
    expect(freshness("goes19", now - 20 * 60_000, now)).toBe("ok");
    expect(freshness("goes19", now - 60 * 60_000, now)).toBe("late");
    expect(freshness("goes19", now - 3 * 3_600_000, now)).toBe("stale");
    expect(freshness("N20", now - 10 * 3_600_000, now)).toBe("ok");
    expect(freshness("N20", now - 30 * 3_600_000, now)).toBe("stale");
    expect(freshness("N20", undefined, now)).toBe("none");
  });
});
