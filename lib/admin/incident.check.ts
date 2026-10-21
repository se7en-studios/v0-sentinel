// Self-check: npx tsx lib/admin/incident.check.ts
import assert from "node:assert";
import { buildIncidents } from "./incident";
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
const inc = buildIncidents(pts);
assert.equal(inc.length, 1, "one incident, lone point dropped");
const [i] = inc;
assert.equal(i.perDay.length, 3);
assert.ok(
  i.perDay[1].areaHa > i.perDay[0].areaHa,
  "area grows with new detections",
);
assert.ok(
  i.events.some((e) => e.kind === "ignition" && e.day === 0),
  "ignition",
);
assert.ok(
  i.events.some((e) => e.kind === "jump" && e.day === 2),
  "isolated point flagged as a jump",
);
console.log(
  "incident ok",
  i.perDay.map((d) => d.areaHa),
);
