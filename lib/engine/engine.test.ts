import { test } from "vitest";
import assert from "node:assert/strict";
import { alphaShape, areaM2, fireHull } from "./hull";
import { FEDS_OPTIONS, stepOf, trackFires } from "./track";
import type { Detection } from "./types";
import type { XY } from "./geo";

const LAT = -42.2;
const LNG = -71.5;
const M_LAT = 110_574;
const M_LNG = 111_320 * Math.cos((LAT * Math.PI) / 180);
const T0 = Date.UTC(2026, 0, 5, 18, 0); // 05 Jan, ~13:15 local solar: a PM step

/** Detection at (x, y) metres east/north of the reference point. */
function det(x: number, y: number, t: number, extra: Partial<Detection> = {}): Detection {
  return {
    lat: LAT + y / M_LAT,
    lng: LNG + x / M_LNG,
    t,
    sat: "N20",
    conf: "n",
    frp: 10,
    day: true,
    scan: 0.375,
    track: 0.375,
    ...extra,
  };
}

/** Grid of detections covering [x0, x1] x [y0, y1] every 375 m. */
function block(x0: number, x1: number, y0: number, y1: number, t: number) {
  const out: Detection[] = [];
  for (let x = x0; x <= x1; x += 375) for (let y = y0; y <= y1; y += 375) out.push(det(x, y, t));
  return out;
}

const H = 3_600_000;

test("FEDS steps: local solar 07-18 h is PM, the rest is the next AM", () => {
  // at 71.5°W local solar time is UTC - 4.77 h
  const pm = stepOf({ t: Date.UTC(2026, 0, 5, 18, 30), lng: LNG }); // 13:44 solar
  const am = stepOf({ t: Date.UTC(2026, 0, 6, 6, 30), lng: LNG }); // 01:44 solar on the 6th
  const lateEvening = stepOf({ t: Date.UTC(2026, 0, 6, 2, 0), lng: LNG }); // 21:14 solar on the 5th
  assert.equal(pm.half, "PM");
  assert.equal(am.half, "AM");
  assert.equal(am.ordinal, pm.ordinal + 1);
  assert.equal(lateEvening.ordinal, am.ordinal, "evening passes belong to the next AM");
});

test("alpha shape: a dense block is one polygon close to its true area", () => {
  const pts: XY[] = [];
  for (let x = 0; x <= 3000; x += 375) for (let y = 0; y <= 1500; y += 375) pts.push([x, y]);
  const { polygons, isolated } = alphaShape(pts);
  assert.equal(polygons.length, 1);
  assert.equal(isolated.length, 0);
  const a = areaM2(polygons);
  assert.ok(Math.abs(a - 3000 * 1500) / (3000 * 1500) < 0.01, `area ${a}`);
});

test("alpha shape: far clusters stay apart, lone pixels are isolated", () => {
  const near: XY[] = [
    [0, 0],
    [300, 0],
    [0, 300],
    [300, 300],
  ];
  const far: XY[] = near.map(([x, y]) => [x + 10_000, y]);
  const { polygons, isolated } = alphaShape([...near, ...far, [5000, 5000]]);
  assert.equal(polygons.length, 2);
  assert.deepEqual(isolated, [[5000, 5000]]);
});

test("hull keeps half a pixel around detections and never shrinks", () => {
  const pts: XY[] = [];
  for (let x = 0; x <= 1500; x += 375) for (let y = 0; y <= 1500; y += 375) pts.push([x, y]);
  const first = fireHull(pts);
  const a1 = areaM2(first);
  assert.ok(a1 > 1500 * 1500, "buffer adds the pixel footprint");
  // fewer points next time: the union with the previous hull keeps the area
  const second = fireHull(pts.slice(0, 5), first);
  assert.ok(areaM2(second) >= a1 - 1);
});

test("tracking: one fire grows east, a far one stays separate", () => {
  const dets = [
    ...block(0, 1500, 0, 1500, T0),
    ...block(0, 4500, 0, 1500, T0 + 12 * H),
    ...block(0, 9000, 0, 1500, T0 + 24 * H),
    ...block(40_000, 41_000, 0, 750, T0 + 12 * H), // 40 km away
  ];
  const res = trackFires(dets, { ...FEDS_OPTIONS, defaultCover: "bosque" });
  const fires = res.fires.filter((f) => f.status !== "fusionado");
  assert.equal(fires.length, 2);
  const main = fires.find((f) => f.id === 1)!;
  assert.equal(main.steps.length, 3);
  const [s0, s1, s2] = main.steps;
  assert.ok(s1.areaHa > s0.areaHa && s2.areaHa > s1.areaHa, "area grows");
  assert.equal(s0.states.nuevo, s0.newPixels, "a new fire is all new pixels");
  assert.ok(s2.states.persistente > 0, "the old block keeps burning");
  assert.ok(s2.states.nuevo > 0, "the eastern extension is new");
  assert.equal(s2.rosDir, "E");
  assert.ok(s2.rosMaxMh! > 300 && s2.rosMaxMh! < 500, `~4.5 km in 12 h, got ${s2.rosMaxMh}`);
});

test("tracking: two fires that grow into each other merge into the lower id", () => {
  const dets = [
    ...block(0, 750, 0, 750, T0),
    ...block(8000, 8750, 0, 750, T0), // 7 km apart: two fires, even in forest
    ...block(0, 8750, 0, 750, T0 + 12 * H), // the gap burns
  ];
  const res = trackFires(dets, { ...FEDS_OPTIONS, defaultCover: "bosque" });
  const live = res.fires.filter((f) => f.status !== "fusionado");
  assert.equal(live.length, 1);
  assert.equal(live[0].id, 1);
  assert.deepEqual(live[0].absorbed, [2]);
  assert.ok(live[0].events.some((e) => e.kind === "fusion" && e.ref === 2));
  assert.ok(res.pixels.every((p) => p.fire === 1), "absorbed pixels are re-labelled");
});

test("tracking: a burn-out spot inside the perimeter after 2 quiet days is reactivated", () => {
  const dets = [
    ...block(0, 3000, 0, 3000, T0),
    det(1500, 1500, T0 + 72 * H), // 3 days later, nothing nearby since
  ];
  const res = trackFires(dets, { ...FEDS_OPTIONS, defaultCover: "bosque" });
  const last = res.pixels.at(-1)!;
  assert.equal(last.state, "reactivado");
  assert.equal(last.fire, 1);
});

test("tracking: an isolated cluster ahead of the perimeter is flagged as a possible spot", () => {
  const dets = [...block(0, 1500, 0, 1500, T0), ...block(0, 1500, 0, 1500, T0 + 12 * H), ...block(4000, 4375, 0, 375, T0 + 12 * H)];
  const res = trackFires(dets, { ...FEDS_OPTIONS, defaultCover: "bosque" });
  const fire = res.fires[0];
  assert.equal(res.fires.length, 1, "4 km ahead still attaches in forest (5 km reach)");
  assert.equal(fire.steps[1].spots, 1);
  assert.ok(fire.events.some((e) => e.kind === "salto"));
});
