import { expect, test } from "vitest";
import { isFeat, parseWorkspace } from "./store";

const zone = {
  id: "z1",
  type: "Feature",
  properties: { mode: "zone-polygon" },
  geometry: { type: "Polygon", coordinates: [[[-71, -41], [-71, -40], [-70, -40], [-71, -41]]] },
};

test("isFeat accepts valid and rejects mismatched geometry", () => {
  expect(isFeat(zone)).toBe(true);
  expect(isFeat({ ...zone, geometry: { type: "Point", coordinates: [0, 0] } })).toBe(false);
  expect(isFeat({ ...zone, geometry: { ...zone.geometry, coordinates: [[[NaN, 0]]] } })).toBe(false);
  expect(isFeat(null)).toBe(false);
});

test("parseWorkspace sanitizes garbage input", () => {
  const ws = parseWorkspace({ features: [zone, { id: 1 }], notes: 5, settings: { units: "x" } });
  expect(ws.features).toHaveLength(1);
  expect(ws.meta.z1.name).toBe("z1");
  expect(ws.notes).toBe("");
  expect(ws.settings.units).toBe("ha");
  expect(parseWorkspace(undefined).features).toEqual([]);
});
