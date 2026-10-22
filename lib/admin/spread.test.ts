import { describe, expect, test } from "vitest";
import {
  spreadLevel,
  spreadPolygon,
  spreadRate,
  spreadRingsKm,
} from "./spread";

const calm = { wind: 0, rh: 100 };
const bad = { wind: 60, rh: 10, temp: 38, rain7d: 0, windDir: 270 };

describe("spread", () => {
  test("rate grows with wind, dryness and heat and is damped by rain", () => {
    expect(spreadRate(calm)).toBeCloseTo(0.12, 5);
    expect(spreadRate(bad)).toBeGreaterThan(spreadRate({ ...bad, wind: 10 }));
    expect(spreadRate(bad)).toBeGreaterThan(spreadRate({ ...bad, temp: 20 }));
    expect(spreadRate({ ...bad, rain7d: 100 })).toBeCloseTo(
      spreadRate(bad) * 0.4,
      5,
    );
    expect(spreadRate({ wind: 5, rh: 150 })).toBe(
      spreadRate({ wind: 5, rh: 100 }),
    );
  });

  test("levels at the thresholds", () => {
    expect(spreadLevel(0.49)).toBe("bajo");
    expect(spreadLevel(0.5)).toBe("moderado");
    expect(spreadLevel(1.2)).toBe("alto");
    expect(spreadLevel(2.5)).toBe("extremo");
  });

  test("rings keep a minimum head and cap the elongation ratio", () => {
    const r = spreadRingsKm(calm, 3);
    expect(r.head).toBe(0.4);
    expect(r.back).toBeCloseTo(0.08, 5);
    const w = spreadRingsKm({ wind: 200, rh: 10 }, 10);
    expect(w.flank).toBeCloseTo(w.head / 4, 5);
  });

  test("polygon is closed and drifts downwind", () => {
    const ring = spreadPolygon(-41, -71, bad, 6); // wind from the west, fire moves east
    expect(ring).toHaveLength(49);
    expect(ring[0][0]).toBeCloseTo(ring[48][0], 9);
    expect(ring[0][1]).toBeCloseTo(ring[48][1], 9);
    const lngs = ring.map((c) => c[0]);
    expect(Math.max(...lngs) + 71).toBeGreaterThan(-71 - Math.min(...lngs));
  });
});
