import { test } from "vitest";
import assert from "node:assert/strict";
import { buildLive } from "./live";
import { matchFire } from "./live-match";
import type { Detection } from "./engine/types";
import type { LngLat } from "./engine/geo";

const HOUR = 3_600_000;
const END = Date.UTC(2026, 9, 21, 20, 0);

// a square "country" around the test fires
const country: GeoJSON.Feature<GeoJSON.Polygon> = {
  type: "Feature",
  properties: {},
  geometry: { type: "Polygon", coordinates: [[[-63, -27], [-60, -27], [-60, -24], [-63, -24], [-63, -27]]] },
};

const det = (lat: number, lng: number, t: number): Detection => ({
  lat,
  lng,
  t,
  sat: "N21",
  conf: "n",
  frp: 12,
  day: true,
  scan: 0.375,
  track: 0.375,
});

/** n pixels in a row 375 m apart, all at time t. */
const row = (lat: number, lng: number, n: number, t: number) =>
  Array.from({ length: n }, (_, i) => det(lat, lng + (i * 375) / 100_000, t));

test("live: forest vs crop fires, activity, alerts and the outside-the-country filter", () => {
  const forest = row(-25.5, -61.5, 4, END - 3 * HOUR); // new forest fire, 4 pixels
  const crops = [...row(-26.5, -61.0, 2, END - 5 * 24 * HOUR - 3 * HOUR), ...row(-26.5, -61.0, 2, END - 3 * 24 * HOUR)];
  const abroad = row(-22, -58, 5, END - 3 * HOUR); // outside the square
  const lonely = [det(-24.5, -62.5, END - 2 * HOUR)]; // single-pixel forest ignition: no alert

  const b = buildLive({
    detections: [...forest, ...crops, ...abroad, ...lonely],
    windowEnd: END,
    windowDays: 10,
    sources: ["VIIRS_NOAA21_NRT"],
    origin: "snapshot",
    argentina: country,
    landCover: (lat) => (lat > -26 ? "bosque" : "cultivo"),
  });

  assert.equal(b.pixels.length, forest.length + crops.length + lonely.length, "pixels abroad are dropped");
  assert.equal(b.live.meta.length, 3);
  const [first] = b.live.meta;
  assert.equal(first.forestal, true, "the active forest fire ranks first");
  assert.equal(first.activity, "ahora");
  assert.equal(first.detections24h, 4);

  const crop = b.live.meta.find((m) => !m.forestal)!;
  assert.equal(crop.activity, "activo", "last seen 3 days ago");
  assert.equal(crop.detections24h, 0);

  const nuevo = b.live.alerts.filter((a) => a.kind === "nuevo");
  assert.equal(nuevo.length, 1, "only the 4-pixel forest fire alerts as new");
  assert.equal(nuevo[0].fire, first.id);
  assert.equal(nuevo[0].value, 4);
  assert.equal(b.featured, first.id);
});

/** Axis-aligned box as an open [lng, lat] ring. */
const box = (w: number, s: number, e: number, n: number): LngLat[] => [[w, s], [e, s], [e, n], [w, n]];

test("match: an outline drawn elsewhere finds the tracked fire under it", () => {
  const big = row(-25.5, -61.5, 6, END - 3 * HOUR);
  const small = row(-25.52, -61.46, 2, END - 3 * HOUR); // ~2.5 km away: a separate fire
  const b = buildLive({
    detections: [...big, ...small],
    windowEnd: END,
    windowDays: 10,
    sources: ["VIIRS_NOAA21_NRT"],
    origin: "snapshot",
    argentina: country,
    landCover: () => "cultivo", // 1 km reach: the two stay apart
  });
  assert.equal(b.live.meta.length, 2);
  const bigId = b.pixels.find((p) => p[0] === big[0].lng)![7];
  const smallId = b.pixels.find((p) => p[0] === small[0].lng)![7];
  assert.notEqual(bigId, smallId);

  // an outline around both: the one with more detections inside wins
  assert.equal(matchFire(b, { at: [-61.49, -25.51], ring: box(-61.52, -25.53, -61.44, -25.49) }), bigId);
  // an outline around the small one only
  assert.equal(matchFire(b, { at: [-61.455, -25.52], ring: box(-61.47, -25.53, -61.44, -25.51) }), smallId);
  // no detection inside, but fire centres within 15 km: the nearest (~11 km vs ~14 km)
  assert.equal(matchFire(b, { at: [-61.6, -25.5], ring: box(-61.61, -25.51, -61.59, -25.49) }), bigId);
  // nothing near
  assert.equal(matchFire(b, { at: [-60.2, -24.2], ring: box(-60.21, -24.21, -60.19, -24.19) }), null);
});
