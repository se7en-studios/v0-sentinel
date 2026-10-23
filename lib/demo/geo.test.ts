import { describe, expect, it } from "vitest";
import countries from "@/data/latam-countries.json";
import { buildCountry, inside, project, unproject } from "./geo";
import { EARLY_POINT, FIRE_POINTS, NOISE_POINTS, ZONE_PRESET } from "./data";

const ar = buildCountry(countries, "Argentina");

describe("demo geo", () => {
  it("builds a path that fits the viewBox", () => {
    expect(ar.path.startsWith("M")).toBe(true);
    const nums = ar.path.match(/-?\d+\.\d/g)!.map(Number);
    expect(Math.min(...nums)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...nums)).toBeLessThanOrEqual(Math.max(ar.proj.w, ar.proj.h));
  });
  it("project and unproject are inverse", () => {
    const [x, y] = project(ar.proj, -64.5, -31.6);
    const [lon, lat] = unproject(ar.proj, x, y);
    expect(lon).toBeCloseTo(-64.5, 6);
    expect(lat).toBeCloseTo(-31.6, 6);
  });
  it("every sample point is inside Argentina", () => {
    for (const p of [...FIRE_POINTS, ...NOISE_POINTS, EARLY_POINT, ZONE_PRESET])
      expect(inside(ar.rings, p.lon, p.lat), `${p.lon},${p.lat}`).toBe(true);
  });
  it("points outside are rejected", () => {
    expect(inside(ar.rings, -50, -10)).toBe(false); // Brazil
    expect(inside(ar.rings, -70, -33.5)).toBe(false); // Chile
  });
  it("fails loudly for an unknown country", () => {
    expect(() => buildCountry(countries, "Atlantis")).toThrow();
  });
});
