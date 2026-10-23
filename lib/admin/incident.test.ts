import { describe, expect, test } from "vitest";
import { buildIncidents, recentGrowth, type Incident } from "./incident";
import type { FirePoint } from "./types";

const pt = (lat: number, lng: number, day: number): FirePoint => [
  lat,
  lng,
  10,
  1,
  day,
  1200,
  0,
];
// day 0: tight cluster; day 1: spreads ~1.2 km east; day 2: isolated point ~2.6 km further (a jump)
const pts: FirePoint[] = [
  pt(-41, -71, 0),
  pt(-41.001, -71, 0),
  pt(-41, -71.001, 0),
  pt(-41.001, -71.001, 0),
  pt(-41.0005, -71.0005, 0),
  pt(-41, -70.985, 1),
  pt(-41.001, -70.985, 1),
  pt(-41, -70.955, 2),
  pt(-30, -60, 0), // lone detection elsewhere: below MIN_POINTS, dropped
];
test("buildIncidents", () => {
  const inc = buildIncidents(pts);
  expect(inc.length, "one incident, lone point dropped").toBe(1);
  const [i] = inc;
  expect(i.perDay.length).toBe(3);
  expect(
    i.perDay[1].areaHa > i.perDay[0].areaHa,
    "area grows with new detections",
  ).toBe(true);
  expect(
    i.events.some((e) => e.kind === "ignition" && e.day === 0),
    "ignition",
  ).toBe(true);
  expect(
    i.events.some((e) => e.kind === "jump" && e.day === 2),
    "isolated point flagged as a jump",
  ).toBe(true);
});

describe("recentGrowth", () => {
  const inc = (id: string, growthHa: number, lastDay: number) =>
    ({
      id,
      lat: -38,
      lng: -68,
      growthHa,
      perDay: [{ day: lastDay - 1 }, { day: lastDay }],
    }) as unknown as Incident;

  test("keeps incidents that grew on the latest day and drops stale or shrinking ones", () => {
    const out = recentGrowth(
      [inc("a", 250, 9), inc("b", 400, 8), inc("c", 0, 9)],
      9,
    );
    expect(out).toEqual([{ id: "a", lat: -38, lng: -68, ha: 250 }]);
  });
});

describe("buildIncidents cache", () => {
  test("same array and limit share one result; a smaller limit is a prefix of a larger one", () => {
    const two = [...pts, ...pts.map((p): FirePoint => [p[0] + 1, p[1], p[2] * 2, p[3], p[4], p[5], p[6]])];
    expect(buildIncidents(two, 60)).toBe(buildIncidents(two, 60));
    const all = buildIncidents(two, 60);
    expect(all.length).toBe(2);
    expect(buildIncidents(two, 1)).toEqual(all.slice(0, 1));
    expect(all[0].frp).toBeGreaterThanOrEqual(all[1].frp);
  });
});
