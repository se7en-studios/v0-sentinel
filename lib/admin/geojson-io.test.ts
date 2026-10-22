import { describe, expect, it } from "vitest";
import { MAX_IMPORT_BYTES, parseGeoJson } from "./geojson-io";

const poly = {
  type: "Polygon",
  coordinates: [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 0],
    ],
  ],
};

describe("parseGeoJson", () => {
  it("acepta FeatureCollection, Feature y geometría suelta con modos por geometría", () => {
    const fc = parseGeoJson(
      JSON.stringify({
        type: "FeatureCollection",
        features: [
          { type: "Feature", properties: { name: "Lote" }, geometry: poly },
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [
                [0, 0],
                [1, 1],
              ],
            },
          },
          {
            type: "Feature",
            properties: {},
            geometry: { type: "Point", coordinates: [1, 2] },
          },
        ],
      }),
    );
    expect(fc.features.map((f) => f.properties.mode)).toEqual([
      "zone-polygon",
      "line",
      "sensor",
    ]);
    expect(Object.values(fc.names)[0]).toBe("Lote");
    expect(
      parseGeoJson(
        JSON.stringify({ type: "Feature", properties: {}, geometry: poly }),
      ).features,
    ).toHaveLength(1);
    expect(parseGeoJson(JSON.stringify(poly)).features).toHaveLength(1);
  });

  it("separa MultiPolygon con ids únicos y descarta lo no soportado", () => {
    const r = parseGeoJson(
      JSON.stringify({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: "m",
            properties: {},
            geometry: {
              type: "MultiPolygon",
              coordinates: [poly.coordinates, poly.coordinates],
            },
          },
          { type: "Feature", id: "m", properties: {}, geometry: poly },
          { type: "Feature", properties: {}, geometry: null },
          {
            type: "Feature",
            properties: {},
            geometry: { type: "Point", coordinates: ["a", 1] },
          },
        ],
      }),
    );
    expect(r.features).toHaveLength(3);
    expect(new Set(r.features.map((f) => f.id)).size).toBe(3);
    expect(r.skipped).toBe(2);
  });

  it("conserva el modo de un export de Sentinel y su meta", () => {
    const r = parseGeoJson(
      JSON.stringify({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: "r1",
            properties: { mode: "route" },
            geometry: {
              type: "LineString",
              coordinates: [
                [0, 0],
                [1, 1],
              ],
            },
          },
        ],
        meta: { r1: { name: "Ruta 1" } },
        settings: { org: "X" },
      }),
    );
    expect(r.features[0].properties.mode).toBe("route");
    expect(r.names.r1).toBe("Ruta 1");
    expect(r.settings).toEqual({ org: "X" });
  });

  it("rechaza JSON roto, otros formatos y archivos enormes", () => {
    expect(() => parseGeoJson("{")).toThrow(/JSON/);
    expect(() => parseGeoJson('{"a":1}')).toThrow(/GeoJSON/);
    expect(() => parseGeoJson(" ".repeat(MAX_IMPORT_BYTES + 1))).toThrow(
      /2 MB/,
    );
  });
});
