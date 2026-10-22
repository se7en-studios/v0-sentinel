import { describe, expect, test } from "vitest";
import { classifyPoints } from "./noise";
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
