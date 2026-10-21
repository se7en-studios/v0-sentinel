import circle from "@turf/circle";
import type { Feat, Meta, SensorType } from "./types";

const poly = (id: string, mode: string, ring: [number, number][]): Feat => ({
  id,
  type: "Feature",
  geometry: { type: "Polygon", coordinates: [[...ring, ring[0]]] },
  properties: { mode },
});
const line = (id: string, mode: string, coords: [number, number][]): Feat => ({
  id,
  type: "Feature",
  geometry: { type: "LineString", coordinates: coords },
  properties: { mode },
});
const pt = (id: string, c: [number, number]): Feat => ({
  id,
  type: "Feature",
  geometry: { type: "Point", coordinates: c },
  properties: { mode: "sensor" },
});

/** Sample workspace around a center so a new client sees a populated panel. */
export function demoWorkspace([lng, lat]: [number, number]) {
  const k = 0.045; // ~5 km
  const at = (dx: number, dy: number): [number, number] => [
    lng + dx * k,
    lat + dy * k * 0.8,
  ];
  const meta: Record<string, Meta> = {};
  const features: Feat[] = [];
  const add = (f: Feat, m: Meta) => {
    features.push(f);
    meta[f.id] = m;
  };

  add(
    poly("demo-z1", "zone-polygon", [
      at(-1.6, 0.9),
      at(-0.2, 1.7),
      at(1.4, 1.2),
      at(1.8, -0.3),
      at(0.6, -1.5),
      at(-1.2, -1.1),
    ]),
    { name: "Sector Norte (bosque nativo)" },
  );
  const c = circle([lng + k * 2.6, lat - k * 1.4], 1.6, {
    steps: 48,
    units: "kilometers",
  });
  add(
    {
      id: "demo-z2",
      type: "Feature",
      geometry: c.geometry,
      properties: { mode: "zone-circle", radiusKm: 1.6 },
    },
    { name: "Forestación pinos" },
  );
  add(
    line("demo-l1", "line", [
      at(-2.4, -0.4),
      at(-1, -0.1),
      at(0.4, -0.5),
      at(2, -0.3),
    ]),
    { name: "Cortafuego principal" },
  );
  add(
    line("demo-r1", "route", [
      at(-1.8, 1.2),
      at(0, 2.1),
      at(1.9, 1.5),
      at(2.3, -0.2),
      at(1, -1.8),
      at(-1.4, -1.5),
      at(-2.3, 0),
    ]),
    { name: "Ruta crítica perímetro", droneId: "d1" },
  );
  add(line("demo-r2", "route", [at(-2.6, -1.9), at(0, -0.9), at(2.8, -2.2)]), {
    name: "Barrido sur",
    droneId: "d3",
  });

  const sensors: [string, [number, number], SensorType, string][] = [
    ["demo-s1", at(-0.9, 0.6), "temp", "Sensor T-01"],
    ["demo-s2", at(0.7, 0.9), "humidity", "Sensor H-02"],
    ["demo-s3", at(1.2, -0.7), "smoke", "Sensor CO-03"],
    ["demo-s4", at(-1.5, -0.9), "wind", "Anemómetro V-04"],
  ];
  for (const [id, p, sensorType, name] of sensors)
    add(pt(id, p), { name, sensorType });

  return { features, meta };
}

