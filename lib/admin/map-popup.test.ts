import { describe, expect, it } from "vitest";
import {
  coordText,
  incidentContaining,
  mapsUrl,
  zoneCircleAt,
  zoneCreator,
} from "./map-popup";
import type { Incident } from "./incident";

const inc = (id: string, lat: number, lng: number): Incident => ({
  id,
  lat,
  lng,
  count: 9,
  frp: 1,
  areaHa: 1,
  growthHa: 0,
  perDay: [],
  events: [],
  hulls: [
    {
      day: 0,
      ring: [
        [lng - 0.01, lat - 0.01],
        [lng + 0.01, lat - 0.01],
        [lng + 0.01, lat + 0.01],
        [lng - 0.01, lat + 0.01],
      ],
    },
  ],
});

describe("map popup helpers", () => {
  it("formats coordinates and the maps link", () => {
    expect(coordText(-41.1, -71.3)).toBe("-41.10000, -71.30000");
    expect(mapsUrl(-41.1, -71.3)).toBe(
      "https://www.google.com/maps?q=-41.100000,-71.300000",
    );
  });
  it("builds a closed zone-circle polygon around the point", () => {
    const f = zoneCircleAt(-41, -71, "z1");
    expect(f.properties.mode).toBe("zone-circle");
    const ring = (f.geometry.coordinates as number[][][])[0];
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });
  it("finds the incident that holds a point, else null", () => {
    const list = [inc("a", -41, -71), inc("b", -35, -65)];
    expect(incidentContaining(list, -41.005, -71.005)?.id).toBe("a");
    expect(incidentContaining(list, -30, -60)).toBeNull();
  });
});

describe("zoneCreator", () => {
  it("offers nothing on a read-only map (no handler)", () => {
    expect(zoneCreator(undefined, () => "z")).toBeUndefined();
  });

  it("builds a circle zone at the point and hands it to the handler", () => {
    const got: unknown[] = [];
    const create = zoneCreator((f) => got.push(f), () => "z-1");
    create?.(-40.1, -71.1);
    expect(got).toHaveLength(1);
    expect(got[0]).toMatchObject({ id: "z-1", properties: { mode: "zone-circle" } });
  });
});
