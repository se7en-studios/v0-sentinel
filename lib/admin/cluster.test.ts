import { describe, expect, test } from "vitest";
import { clusterDetections } from "./cluster";
import type { FirePoint } from "./types";

const pt = (lat: number, lng: number, frp = 10): FirePoint => [
  lat,
  lng,
  frp,
  1,
  0,
  1200,
  0,
];

describe("clusterDetections", () => {
  test("a fire straddling the old 0.15 degree cell edge is one cluster", () => {
    // -41.1 is a multiple of 0.15 (-274 * 0.15): points on both sides, ~0.8 km apart
    const pts = [
      pt(-41.1004, -71.2),
      pt(-41.0996, -71.2),
      pt(-41.099, -71.2),
      pt(-41.101, -71.2),
    ];
    const c = clusterDetections(pts);
    expect(c).toHaveLength(1);
    expect(c[0].count).toBe(4);
    expect(c[0].frp).toBe(40);
  });

  test("detections farther than 3 km apart stay separate, and chains link", () => {
    const far = [
      pt(-40, -70),
      pt(-40.001, -70),
      pt(-40.002, -70),
      pt(-40.5, -70),
      pt(-40.501, -70),
      pt(-40.502, -70),
    ];
    expect(clusterDetections(far)).toHaveLength(2);
    // 4 points each ~2.2 km from the next: single-link joins them though ends are 6.7 km apart
    const chain = [0, 1, 2, 3].map((i) => pt(-40 - i * 0.02, -70));
    const c = clusterDetections(chain);
    expect(c).toHaveLength(1);
    expect(c[0].count).toBe(4);
  });

  test("groups under the minimum are dropped; limit and ordering by FRP then count", () => {
    const small = [pt(-30, -60), pt(-30.001, -60)];
    const big = [0, 1, 2].map((i) => pt(-35 - i * 0.001, -65, 50));
    const mid = [0, 1, 2, 3].map((i) => pt(-38 - i * 0.001, -66, 5));
    const all = clusterDetections([...small, ...mid, ...big]);
    expect(all.map((c) => c.frp)).toEqual([150, 20]);
    expect(
      clusterDetections([...small, ...mid, ...big], { limit: 1 }),
    ).toHaveLength(1);
    expect(
      clusterDetections([...small, ...big], { minPoints: 2 }),
    ).toHaveLength(2);
  });

  test("tie on FRP falls back to count; empty input is empty", () => {
    const a = [0, 1, 2].map((i) => pt(-30 - i * 0.001, -60, 10)); // 30
    const b = [0, 1, 2]
      .map((i) => pt(-36 - i * 0.001, -66, 5))
      .concat([pt(-36.0035, -66, 15)]); // 30
    expect(clusterDetections([...a, ...b])[0].count).toBe(4);
    expect(clusterDetections([])).toEqual([]);
  });

  test("a fire straddling the antimeridian-free longitude cell edge links too", () => {
    const pts = [pt(-41, -71.0002), pt(-41, -70.9998), pt(-41, -70.999)];
    expect(clusterDetections(pts)).toHaveLength(1);
  });
});
