// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { parseKml, toKml } from "./kml";
import type { Feat } from "./types";

const kml = (body: string) =>
  `<?xml version="1.0"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document>${body}</Document></kml>`;

describe("parseKml", () => {
  it("lee Point, LineString y Polygon (ignora huecos) con nombres", () => {
    const fs = parseKml(
      kml(`<Placemark><name>P</name><Point><coordinates>-71.3,-41.1,900</coordinates></Point></Placemark>
      <Placemark><name>L</name><LineString><coordinates>-71,-41 -71.1,-41.1</coordinates></LineString></Placemark>
      <Placemark><name>Z</name><Polygon>
        <outerBoundaryIs><LinearRing><coordinates>0,0 1,0 1,1 0,0</coordinates></LinearRing></outerBoundaryIs>
        <innerBoundaryIs><LinearRing><coordinates>0.1,0.1 0.2,0.1 0.2,0.2 0.1,0.1</coordinates></LinearRing></innerBoundaryIs>
      </Polygon></Placemark>`),
    );
    expect(fs.map((f) => f.properties.mode)).toEqual([
      "sensor",
      "line",
      "zone-polygon",
    ]);
    expect(fs[0].geometry.coordinates).toEqual([-71.3, -41.1]);
    expect((fs[2].geometry.coordinates as unknown[]).length).toBe(1);
    expect(fs.map((f) => f.properties.name)).toEqual(["P", "L", "Z"]);
  });

  it("separa MultiGeometry y cierra anillos abiertos", () => {
    const fs = parseKml(
      kml(`<Placemark><name>M</name><MultiGeometry>
        <Point><coordinates>1,2</coordinates></Point>
        <Polygon><outerBoundaryIs><LinearRing><coordinates>0,0 1,0 1,1</coordinates></LinearRing></outerBoundaryIs></Polygon>
      </MultiGeometry></Placemark>`),
    );
    expect(fs).toHaveLength(2);
    const ring = (fs[1].geometry.coordinates as number[][][])[0];
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    expect(new Set(fs.map((f) => f.id)).size).toBe(2);
  });

  it("descarta coordenadas inválidas y falla con XML roto", () => {
    expect(
      parseKml(
        kml(
          `<Placemark><Point><coordinates>x,y</coordinates></Point></Placemark>`,
        ),
      ),
    ).toEqual([]);
    expect(() => parseKml("<kml><Document>")).toThrow();
  });
});

describe("toKml", () => {
  const feats: Feat[] = [
    {
      id: "a",
      type: "Feature",
      geometry: { type: "Point", coordinates: [-71, -41] },
      properties: { mode: "sensor" },
    },
    {
      id: "b",
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 0],
          ],
        ],
      },
      properties: { mode: "zone-polygon" },
    },
  ];

  it("genera KML 2.2 escapado que se vuelve a leer", () => {
    const xml = toKml(feats, { a: { name: `<b>"x" & y</b>` } });
    expect(xml).toContain('xmlns="http://www.opengis.net/kml/2.2"');
    expect(xml).not.toContain("<b>");
    const back = parseKml(xml);
    expect(back).toHaveLength(2);
    expect(back[0].properties.name).toBe(`<b>"x" & y</b>`);
    expect(back[1].geometry.type).toBe("Polygon");
  });
});

describe("parseKml: archivos hostiles", () => {
  const poly = (n: number) =>
    kml(
      `<Placemark><name>x</name><LineString><coordinates>${Array.from({ length: n }, (_, i) => `${(i % 100) / 10},1`).join(" ")}</coordinates></LineString></Placemark>`,
    );

  it("rechaza DOCTYPE y ENTITY (billion laughs / XXE)", () => {
    const bomb = `<?xml version="1.0"?><!DOCTYPE kml [<!ENTITY a "aaaa"><!ENTITY b "&a;&a;&a;&a;">]><kml><Document><Placemark><name>&b;</name></Placemark></Document></kml>`;
    expect(() => parseKml(bomb)).toThrow();
  });

  it("corta archivos con más de 100 000 vértices o de más de 2 M de caracteres", () => {
    expect(() => parseKml(poly(100_001))).toThrow(/demasiado/);
    expect(() => parseKml("x".repeat(2_000_001))).toThrow(/demasiado/);
    expect(parseKml(poly(1000))).toHaveLength(1);
  });

  it("descarta coordenadas fuera de rango", () => {
    const fs = parseKml(
      kml(`<Placemark><Point><coordinates>1e308,1e308</coordinates></Point></Placemark>
           <Placemark><Point><coordinates>-71,-41</coordinates></Point></Placemark>`),
    );
    expect(fs).toHaveLength(1);
  });
});
