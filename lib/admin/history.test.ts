import { expect, test } from "vitest";
import { BURNED_HISTORY, HA_PER_DETECTION } from "./history";

test("burned history has sorted years, positive hectares and https sources", () => {
  expect(BURNED_HISTORY.length).toBeGreaterThan(0);
  const years = BURNED_HISTORY.map((h) => h.year);
  expect(years).toEqual([...years].sort((a, b) => a - b));
  for (const h of BURNED_HISTORY) {
    expect(h.ha).toBeGreaterThan(0);
    expect(h.url).toMatch(/^https:\/\//);
    expect(h.source).not.toBe("");
  }
  expect(HA_PER_DETECTION).toBeCloseTo(14, 0);
});
