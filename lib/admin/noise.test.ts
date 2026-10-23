import { describe, expect, test } from "vitest";
import {
  applyCover,
  classifyPoints,
  coverCandidates,
  coverKey,
  fireInfoMap,
} from "./noise";
import type { FirePoint } from "./types";

// [lat, lng, frp, confidence 0|1|2, dayIdx, hhmm, isNight]
const pt = (
  lat: number,
  lng: number,
  day: number,
  frp = 5,
  conf = 1,
): FirePoint => [lat, lng, frp, conf, day, 1200, 0];

describe("classifyPoints", () => {
  test("an isolated pixel that burns for 6 days at low power is flagged as static", () => {
    const points = [0, 1, 2, 3, 4, 5].map((d) => pt(-30.5, -60.5, d));
    const { reason, score } = classifyPoints(points);
    expect(reason.every((r) => r === "static")).toBe(true);
    expect(Math.max(...score)).toBeLessThanOrEqual(15);
  });

  test("a spreading fire with many neighbouring pixels is not flagged, even if it lasts days", () => {
    const points: FirePoint[] = [];
    for (let d = 0; d < 6; d++)
      for (let i = 0; i < 5; i++)
        points.push(pt(-41 + i * 0.004, -71 + d * 0.004, d, 20, 2));
    const { reason } = classifyPoints(points);
    expect(reason.every((r) => r === null)).toBe(true);
  });

  test("a high-power source is never called static", () => {
    const points = [0, 1, 2, 3, 4, 5].map((d) => pt(-30.5, -60.5, d, 120, 2));
    expect(classifyPoints(points).reason.every((r) => r === null)).toBe(true);
  });

  test("a detection inside a known industrial site is flagged as industrial", () => {
    const { reason } = classifyPoints([pt(-34.905, -57.915, 0)]);
    expect(reason[0]).toBe("industrial");
  });

  test("a one-day detection in the Patagonian forest keeps a high score when satellite confidence is high", () => {
    const { reason, score } = classifyPoints([pt(-41.1, -71.3, 0, 30, 2)]);
    expect(reason[0]).toBeNull();
    expect(score[0]).toBeGreaterThanOrEqual(80);
  });

  test("result arrays line up with the input", () => {
    const pts = [pt(-41, -71, 0), pt(-30, -60, 0), pt(-34.905, -57.915, 0)];
    const out = classifyPoints(pts);
    expect(out.score).toHaveLength(3);
    expect(out.reason).toHaveLength(3);
  });
});

describe("classifyPoints fresh", () => {
  const at = (
    lat: number,
    lng: number,
    day: number,
    hhmm: number,
  ): FirePoint => [lat, lng, 5, 1, day, hhmm, 0];

  test("a new pixel in the last 24 h is fresh; a pixel seen on an earlier day is not", () => {
    const pts = [
      at(-41, -71, 0, 1200), // seen again on day 1 -> persistent
      at(-41, -71, 1, 1300),
      at(-40, -70, 1, 1300), // first time, newest day -> fresh
    ];
    expect(classifyPoints(pts).fresh).toEqual([false, false, true]);
  });

  test("a first-time pixel older than 24 h before the newest detection is not fresh", () => {
    const pts = [at(-41, -71, 0, 900), at(-40, -70, 2, 1200)];
    expect(classifyPoints(pts).fresh).toEqual([false, true]);
  });

  test("same-day repeat passes over a new pixel are both fresh", () => {
    const pts = [at(-41, -71, 3, 500), at(-41, -71, 3, 1500)];
    expect(classifyPoints(pts).fresh).toEqual([true, true]);
  });

  test("empty input gives empty arrays", () => {
    expect(classifyPoints([]).fresh).toEqual([]);
  });
});

describe("fireInfoMap", () => {
  test("looks up the verdict by detection object", () => {
    const a: FirePoint = [-34.905, -57.915, 5, 1, 0, 1200, 0]; // inside a known refinery
    const b: FirePoint = [-41.1, -71.3, 30, 2, 0, 1200, 0];
    const info = fireInfoMap([a, b], classifyPoints([a, b]));
    expect(info.get(a)?.reason).toBe("industrial");
    expect(info.get(b)?.reason).toBeNull();
    expect(info.get(b)?.score).toBeGreaterThanOrEqual(80);
    expect(info.get([...b] as FirePoint)).toBeUndefined(); // identity, not value
  });
});

describe("land cover", () => {
  const points = [pt(-41.1, -71.3, 0, 30, 2), pt(-41.5, -71.5, 0, 30, 2)];

  test("a non-vegetated cell lowers only the score of detections inside it", () => {
    const base = classifyPoints(points);
    const out = applyCover(points, base, new Set([coverKey(-41.1, -71.3)]));
    expect(out.score[0]).toBeLessThan(base.score[0]);
    expect(out.score[1]).toBe(base.score[1]);
    expect(out.cover).toEqual([true, false]);
    expect(out.reason).toEqual(base.reason); // never hides the detection
  });

  test("without information the verdicts stay exactly as they were", () => {
    const base = classifyPoints(points);
    expect(applyCover(points, base, new Set())).toBe(base);
  });

  test("fireInfoMap carries the cover flag for the popup", () => {
    const base = classifyPoints(points);
    const out = applyCover(points, base, new Set([coverKey(-41.1, -71.3)]));
    expect(fireInfoMap(points, out).get(points[0])?.cover).toBe(true);
  });

  test("candidates: incident centres first, one per ~1 km cell", () => {
    const near = pt(-41.1004, -71.3004, 0);
    const c = coverCandidates(
      [{ lat: -41.1, lng: -71.3 }],
      [near, pt(-30, -60, 0)],
    );
    expect(c).toHaveLength(2);
    expect(c[0].key).toBe(coverKey(-41.1, -71.3));
  });
});
