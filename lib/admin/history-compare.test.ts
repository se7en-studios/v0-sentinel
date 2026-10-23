import { describe, expect, test } from "vitest";
import { compareSeason, parseHistory, windowDates } from "./history-compare";

const flat = (v: number) => Array(10).fill(v);

describe("windowDates", () => {
  test("ten consecutive days ending on the date, moved to the year", () => {
    const d = windowDates("2026-10-22", 2024);
    expect(d[0]).toBe("2024-10-13");
    expect(d[9]).toBe("2024-10-22");
  });
  test("29 Feb maps to 28 Feb in a common year, keeps 29 in a leap year", () => {
    expect(windowDates("2024-02-29", 2023)[9]).toBe("2023-02-28");
    expect(windowDates("2024-02-29", 2020)[9]).toBe("2020-02-29");
  });
  test("a window crossing a leap day has 10 distinct days", () => {
    expect(new Set(windowDates("2024-03-03", 2024)).size).toBe(10);
  });
});

describe("compareSeason", () => {
  test("above normal with a clear ratio", () => {
    const c = compareSeason(flat(23), [
      { year: 2025, counts: flat(10) },
      { year: 2024, counts: flat(10) },
    ]);
    expect(c.ratio).toBeCloseTo(2.3);
    expect(c.verdict).toBe("high");
    expect(c.used).toBe(2);
  });
  test("normal and low", () => {
    const past = [{ year: 2025, counts: flat(10) }];
    expect(compareSeason(flat(10), past).verdict).toBe("normal");
    expect(compareSeason(flat(5), past).verdict).toBe("low");
  });
  test("years without data are skipped and counted, never zero", () => {
    const c = compareSeason(flat(10), [
      { year: 2025, counts: flat(10) },
      { year: 2024, counts: null },
      { year: 2023, counts: null },
    ]);
    expect(c.used).toBe(1);
    expect(c.asked).toBe(3);
    expect(c.avgTotal).toBe(100);
  });
  test("no past data at all: unknown, no ratio", () => {
    const c = compareSeason(flat(10), [{ year: 2025, counts: null }]);
    expect(c.verdict).toBe("unknown");
    expect(c.ratio).toBeNull();
  });
  test("average zero or tiny gives no absurd ratio", () => {
    expect(compareSeason(flat(5), [{ year: 2025, counts: flat(0) }]).ratio).toBeNull();
    expect(compareSeason(flat(5), [{ year: 2025, counts: flat(1) }]).verdict).toBe("unknown");
  });
  test("current without data: unknown", () => {
    expect(compareSeason(null, [{ year: 2025, counts: flat(10) }]).verdict).toBe("unknown");
  });
  test("band is min/mean/max per day", () => {
    const c = compareSeason(flat(1), [
      { year: 2025, counts: flat(10) },
      { year: 2024, counts: flat(30) },
    ]);
    expect(c.band[0]).toEqual({ min: 10, mean: 20, max: 30 });
  });
  test("malformed series is treated as missing", () => {
    expect(compareSeason(flat(10), [{ year: 2025, counts: [1, 2] }]).used).toBe(0);
  });
});

describe("parseHistory", () => {
  test("accepts a good body, nulls bad years", () => {
    const v = parseHistory({
      end: "2026-10-22",
      years: [
        { year: 2026, counts: flat(3) },
        { year: 2025, counts: null },
        { year: 2024, counts: [1] },
      ],
    });
    expect(v?.current).toEqual(flat(3));
    expect(v?.past.map((p) => p.counts)).toEqual([null, null]);
  });
  test("rejects junk", () => {
    expect(parseHistory(null)).toBeNull();
    expect(parseHistory({ end: "x", years: [] })).toBeNull();
  });
});
