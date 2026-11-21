import { describe, expect, test } from "vitest";
import { nationalPopulation } from "../server/static-data";
import { peopleNear, peopleWithin, roundPeople, type PopRaster } from "./population";

// 0.1° cells over [0,1]x[-1,0]: 10x10, 100 people in every cell
const flat: PopRaster = {
  bbox: [0, -1, 1, 0],
  width: 10,
  height: 10,
  data: new Uint32Array(100).fill(100),
};

describe("peopleWithin", () => {
  test("counts more people in a wider circle", () => {
    const a = peopleWithin(flat, -0.5, 0.5, 10);
    const b = peopleWithin(flat, -0.5, 0.5, 30);
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(a);
    expect(b % 100).toBe(0); // whole cells
  });

  test("a radius smaller than a cell takes its share of the containing cell", () => {
    // 0.1° ≈ 11 km: a 1 km circle is ~2.5 % of the cell
    const v = peopleWithin(flat, -0.52, 0.53, 1);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThan(10);
  });

  test("outside the grid there is nobody", () => {
    expect(peopleWithin(flat, 5, 5, 10)).toBe(0);
  });
});

describe("national grid", () => {
  const pop = nationalPopulation();
  test("adds up to Argentina's population", () => {
    const total = pop.data.reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThan(44_000_000);
    expect(total).toBeLessThan(47_000_000);
  });
  test("a city centre has far more people around than the Patagonian steppe", () => {
    const cordoba = peopleNear(pop, -31.4167, -64.1833);
    const steppe = peopleNear(pop, -44.0, -69.0);
    expect(cordoba.km10).toBeGreaterThan(500_000);
    expect(cordoba.km10).toBeGreaterThanOrEqual(cordoba.km5);
    expect(steppe.km10).toBeLessThan(500);
  });
});

test("roundPeople avoids false precision", () => {
  expect(roundPeople(47)).toBe(50);
  expect(roundPeople(1234)).toBe(1200);
  expect(roundPeople(56_789)).toBe(57_000);
});
