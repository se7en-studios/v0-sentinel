import { describe, expect, test } from "vitest";
import {
  fuelFactor,
  slopeFactor,
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

describe("terrain-aware spread", () => {
  const grass = { landCover: 30, burnable: true, slopeDeg: 0, aspectDeg: null };

  test("without terrain, or with an unknown cover, the rate is the baseline", () => {
    expect(spreadRate({ ...bad, terrain: null })).toBe(spreadRate(bad));
    expect(spreadRate({ ...bad, terrain: { landCover: null } })).toBe(
      spreadRate(bad),
    );
    expect(spreadRate({ ...bad, terrain: grass })).toBe(spreadRate(bad));
  });

  test("fuel: grass > shrub > forest > bare ground", () => {
    const f = (landCover: number, burnable = true) =>
      fuelFactor({ landCover, burnable });
    expect(f(30)).toBeGreaterThan(f(20));
    expect(f(20)).toBeGreaterThan(f(10));
    expect(f(10)).toBeGreaterThan(f(60, false));
    expect(spreadRate({ ...bad, terrain: { landCover: 60, burnable: false } })).toBeLessThan(
      spreadRate(bad) * 0.2,
    );
  });

  test("slope: wind up the hill accelerates, down the hill slows, flat does nothing", () => {
    // aspect 270: the ground descends to the west, so uphill is east; wind FROM the west blows east, uphill
    const steep = { slopeDeg: 20, aspectDeg: 270 };
    expect(slopeFactor(steep, 270)).toBeGreaterThan(3);
    expect(slopeFactor(steep, 90)).toBe(0.5);
    expect(slopeFactor(steep, 0)).toBeCloseTo(1, 5); // across the slope
    expect(slopeFactor({ slopeDeg: 1, aspectDeg: null }, 270)).toBe(1);
    expect(slopeFactor({ slopeDeg: 89, aspectDeg: 270 }, 270)).toBe(4);
    expect(slopeFactor(steep, undefined)).toBe(1);
  });

  test("a steeper uphill slope enlarges the head of the polygon reach", () => {
    const flat = spreadRingsKm(bad, 6).head;
    const up = spreadRingsKm(
      { ...bad, terrain: { ...grass, slopeDeg: 15, aspectDeg: 270 } },
      6,
    ).head;
    expect(up).toBeGreaterThan(flat * 2);
  });
});
