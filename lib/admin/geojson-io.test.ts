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

describe("parseGeoJson: archivos hostiles", () => {
  const fc = (features: unknown[]) => JSON.stringify({ type: "FeatureCollection", features });
  const pt = (id: unknown, c: number[] = [-71, -41]) => ({
    type: "Feature",
    id,
    properties: {},
    geometry: { type: "Point", coordinates: c },
  });

  it("ids __proto__/constructor o larguísimos se reemplazan por uno generado", () => {
    const r = parseGeoJson(fc([pt("__proto__"), pt("constructor"), pt("a".repeat(500))]));
    expect(r.features.map((f) => f.id).every((id) => /^imp-/.test(String(id)))).toBe(true);
    expect(Object.keys(r.names)).not.toContain("__proto__");
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("un meta con __proto__ no contamina Object.prototype", () => {
    const r = parseGeoJson(
      `{"type":"FeatureCollection","meta":{"__proto__":{"polluted":1}},"features":[${JSON.stringify(pt("a"))}]}`,
    );
    expect(r.features).toHaveLength(1);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("descarta coordenadas fuera de rango y corta más de 100 000 vértices", () => {
    expect(parseGeoJson(fc([pt("a", [1e308, 0]), pt("b")])).features.map((f) => f.id)).toEqual(["b"]);
    const big = { type: "LineString", coordinates: Array.from({ length: 100_001 }, () => [1, 1]) };
    expect(() => parseGeoJson(fc([{ type: "Feature", properties: {}, geometry: big }]))).toThrow(/demasiado/);
  });

  it("corta más de 5000 elementos", () => {
    expect(() => parseGeoJson(fc(Array.from({ length: 5001 }, (_, i) => pt(`p${i}`))))).toThrow(/demasiados/);
  });
});
