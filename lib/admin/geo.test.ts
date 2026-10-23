import { beforeAll, describe, expect, test } from "vitest";
import { loadBuffer } from "./buffer";
import {
  alongRoute,
  areaHa,
  centerOf,
  distKm,
  firesInZone,
  fmtArea,
  fmtKm,
  lengthKm,
  patrolRing,
  sweepPath,
} from "./geo";
import type { Feat, FirePoint } from "./types";

beforeAll(async () => {
  await loadBuffer();
});

const poly = (coordinates: unknown, type = "Polygon"): Feat => ({
  id: "z",
  type: "Feature",
  properties: { mode: "zone-polygon" },
  geometry: { type, coordinates },
});
// ~1 degree square near Bariloche
const square = poly([
  [
    [-71, -41],
    [-70, -41],
    [-70, -40],
    [-71, -40],
    [-71, -41],
  ],
]);
const fire = (lat: number, lng: number): FirePoint => [
  lat,
  lng,
  1,
  1,
  0,
  1200,
  0,
];

describe("geo", () => {
  test("areaHa and centerOf on a ~1 degree square", () => {
    const ha = areaHa(square);
    expect(ha).toBeGreaterThan(800_000);
    expect(ha).toBeLessThan(1_000_000);
    const [lng, lat] = centerOf(square);
    expect(lng).toBeCloseTo(-70.5, 1);
    expect(lat).toBeCloseTo(-40.5, 1);
  });

  test("firesInZone filters by polygon and honours the buffer", () => {
    const pts = [fire(-40.5, -70.5), fire(-40.5, -69.99), fire(-45, -60)];
    expect(firesInZone(square, pts, 0)).toEqual([pts[0]]);
    expect(firesInZone(square, pts, 5)).toEqual([pts[0], pts[1]]);
  });

  test("firesInZone handles MultiPolygon and non-polygon geometry", () => {
    const multi = poly(
      [
        [
          [
            [-71, -41],
            [-70, -41],
            [-70, -40],
            [-71, -40],
            [-71, -41],
          ],
        ],
        [
          [
            [-60, -31],
            [-59, -31],
            [-59, -30],
            [-60, -30],
            [-60, -31],
          ],
        ],
      ],
      "MultiPolygon",
    );
    const pts = [fire(-40.5, -70.5), fire(-30.5, -59.5), fire(-35, -65)];
    expect(firesInZone(multi, pts, 0)).toEqual([pts[0], pts[1]]);
    expect(firesInZone(poly([0, 0], "Point"), pts, 0)).toEqual([]);
  });

  test("patrolRing returns a closed ring outside the zone", () => {
    const ring = patrolRing(square, 1000)!;
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    expect(Math.min(...ring.map((c) => c[0]))).toBeLessThan(-71);
  });

  test("sweepPath makes alternating east-west passes and rejects non-polygons", () => {
    const path = sweepPath(square, 20_000);
    expect(path.length).toBeGreaterThan(4);
    expect(path.length % 2).toBe(0);
    expect(path[0][1]).toBe(path[1][1]);
    expect(path[1][0]).toBeGreaterThan(path[0][0]);
    expect(path[3][0]).toBeLessThan(path[2][0]);
    expect(sweepPath(poly([0, 0], "Point"), 100)).toEqual([]);
  });

  test("fmtArea and fmtKm", () => {
    expect(fmtArea(50.25, "ha")).toMatch(/^50,\d ha$/);
    expect(fmtArea(1234, "ha")).toContain("ha");
    expect(fmtArea(250, "km2")).toMatch(/^2,5 km²$/);
    expect(fmtKm(0.4)).toBe("400 m");
    expect(fmtKm(12.345)).toMatch(/^12,3\d? km$/);
  });

  test("distKm and route helpers", () => {
    expect(distKm([0, 0], [0, 1])).toBeCloseTo(111.2, 0);
    const line: Feat = {
      ...square,
      geometry: {
        type: "LineString",
        coordinates: [
          [-71, -41],
          [-71, -40.9],
        ],
      },
    };
    const total = lengthKm(line);
    expect(total).toBeCloseTo(11.1, 0);
    const out = alongRoute(line, total / 2)!;
    expect(out.progress).toBeCloseTo(0.5, 1);
    const back = alongRoute(line, total * 1.5)!; // returning leg
    expect(back.progress).toBeCloseTo(0.5, 1);
    expect(back.heading).toBeGreaterThan(90);
    const zero: Feat = {
      ...line,
      geometry: {
        type: "LineString",
        coordinates: [
          [-71, -41],
          [-71, -41],
        ],
      },
    };
    expect(alongRoute(zero, 1)).toBeNull();
  });
});
