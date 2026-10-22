import { describe, expect, test } from "vitest";
import { dedupe, measure, type LngLat } from "./map-measure";
import { createTileErrorTracker } from "./map-tile-errors";
import { clusterTargetZoom, CLUSTER_MAX_ZOOM } from "./map-cluster";

describe("measure", () => {
  test("returns zero with fewer than two distinct points", () => {
    expect(measure([], false)).toEqual({ km: 0, ha: null });
    expect(
      measure(
        [
          [0, 0],
          [0, 0],
        ],
        false,
      ),
    ).toEqual({ km: 0, ha: null });
  });

  test("one degree of latitude is about 111 km and has no area while open", () => {
    const m = measure(
      [
        [-60, -30],
        [-60, -29],
      ],
      false,
    );
    expect(m.km).toBeGreaterThan(110);
    expect(m.km).toBeLessThan(112);
    expect(m.ha).toBeNull();
  });

  test("a closed square of 0.01 degrees reports perimeter and area", () => {
    const sq: LngLat[] = [
      [-60, -30],
      [-59.99, -30],
      [-59.99, -29.99],
      [-60, -29.99],
    ];
    const m = measure(sq, true);
    expect(m.ha).not.toBeNull();
    expect(m.ha!).toBeGreaterThan(90);
    expect(m.ha!).toBeLessThan(110);
    expect(m.km).toBeGreaterThan(3.8);
  });

  test("closing with fewer than three points gives no area", () => {
    expect(
      measure(
        [
          [0, 0],
          [0, 1],
        ],
        true,
      ).ha,
    ).toBeNull();
  });

  test("dedupe drops repeated consecutive points only", () => {
    expect(
      dedupe([
        [1, 1],
        [1, 1],
        [2, 2],
        [1, 1],
      ]),
    ).toEqual([
      [1, 1],
      [2, 2],
      [1, 1],
    ]);
  });
});

describe("createTileErrorTracker", () => {
  test("notifies once when the limit is hit inside the window", () => {
    const t = createTileErrorTracker(5, 10_000);
    const res = [0, 1000, 2000, 3000, 4000, 5000].map((n) => t.fail(n));
    expect(res).toEqual([false, false, false, false, true, false]);
  });

  test("failures spread beyond the window never trigger", () => {
    const t = createTileErrorTracker(5, 10_000);
    expect([0, 4000, 8000, 12000, 16000, 20000].some((n) => t.fail(n))).toBe(
      false,
    );
  });

  test("a success re-arms the notification", () => {
    const t = createTileErrorTracker(2, 10_000);
    t.fail(0);
    expect(t.fail(1)).toBe(true);
    t.ok();
    t.fail(100);
    expect(t.fail(101)).toBe(true);
  });
});

describe("clusterTargetZoom", () => {
  test("zooms at least one level and never past the point layers handover", () => {
    expect(clusterTargetZoom(4, 5)).toBe(6);
    expect(clusterTargetZoom(14, 5)).toBe(CLUSTER_MAX_ZOOM + 0.5);
  });
});
