import { describe, expect, test } from "vitest";
import {
  BURNED_HISTORY,
  HA_PER_DETECTION,
  HA_PER_MODIS_DETECTION,
  detectionHectares,
} from "./history";
import type { FirePoint } from "./types";

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

describe("detectionHectares", () => {
  const pt = (lat: number, lng: number, sat?: number): FirePoint => [
    lat,
    lng,
    10,
    2,
    0,
    1800,
    0,
    sat,
  ];

  test("VIIRS pixels (or no satellite code) count 14 ha each, deduplicated by cell", () => {
    expect(detectionHectares([])).toBe(0);
    expect(
      detectionHectares([pt(-38, -68), pt(-38, -68, 0), pt(-38.1, -68)]),
    ).toBeCloseTo(2 * HA_PER_DETECTION, 5);
  });

  test("a MODIS pixel counts ~100 ha", () => {
    expect(detectionHectares([pt(-38, -68, 2)])).toBe(HA_PER_MODIS_DETECTION);
    expect(detectionHectares([pt(-38, -68, 3), pt(-38.5, -68, 2)])).toBe(
      2 * HA_PER_MODIS_DETECTION,
    );
  });

  test("a MODIS pixel over ground VIIRS already saw is not counted twice", () => {
    expect(
      detectionHectares([pt(-38, -68, 2), pt(-38.001, -68.001, 1)]),
    ).toBeCloseTo(HA_PER_DETECTION, 5);
  });
});
