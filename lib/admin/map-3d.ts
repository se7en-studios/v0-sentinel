import buffer from "@turf/buffer";
import { feature } from "@turf/helpers";
import { MODE_ROLE, ROLE_COLOR, type Feat, type FirePoint } from "./types";

type FC = GeoJSON.FeatureCollection;
const empty = (): FC => ({ type: "FeatureCollection", features: [] });

/** Regular hexagon ring around a point, radius in km. */
function hexRing(lat: number, lng: number, km: number): GeoJSON.Position[] {
  const dLat = km / 111;
  const dLng = km / (111 * Math.cos((lat * Math.PI) / 180));
  const ring: GeoJSON.Position[] = [];
  for (let i = 0; i <= 6; i++) {
    const a = (Math.PI / 3) * (i % 6) + Math.PI / 6;
    ring.push([lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)]);
  }
  return ring;
}

const squareRing = (
  lat: number,
  lng: number,
  km: number,
): GeoJSON.Position[] => {
  const dLat = km / 111;
  const dLng = km / (111 * Math.cos((lat * Math.PI) / 180));
  return [
    [lng - dLng, lat - dLat],
    [lng + dLng, lat - dLat],
    [lng + dLng, lat + dLat],
    [lng - dLng, lat + dLat],
    [lng - dLng, lat - dLat],
  ];
};

const poly = (
  ring: GeoJSON.Position[],
  props: GeoJSON.GeoJsonProperties,
): GeoJSON.Feature => ({
  type: "Feature",
  properties: props,
  geometry: { type: "Polygon", coordinates: [ring] },
});

export interface Wind {
  /** direction the wind blows FROM, degrees */
  dir: number;
  /** km/h */
  speed: number;
}

/** Offsets a point (km east/north) into degrees. */
const shift = (lat: number, lng: number, east: number, north: number): [number, number] => [
  lat + north / 111,
  lng + east / (111 * Math.cos((lat * Math.PI) / 180)),
];

/**
 * Fire beacons: hexagonal flame column in three bands (ember base, flame body,
 * white-hot tip), a faint light beam, and a smoke plume made of stacked,
 * widening, translucent prisms that lean downwind like a real plume.
 */
export function fireBeacons(fires: FirePoint[], wind: Wind = { dir: 270, speed: 12 }): FC {
  const top = [...fires].sort((a, b) => b[2] - a[2]).slice(0, 1500);
  const features: GeoJSON.Feature[] = [];
  const toward = (((wind.dir + 180) % 360) * Math.PI) / 180;
  const lean = Math.min(1.6, 0.25 + wind.speed / 22); // km of drift per stage
  for (const p of top) {
    const [lat, lng, frp, conf, day, hhmm] = p;
    const h = Math.min(4800, 380 + frp * 70);
    const r = 0.11 + Math.min(0.12, frp / 800);
    const base = { frp, conf, day, hhmm };
    const ring = hexRing(lat, lng, r);
    features.push(
      poly(ring, { ...base, b: 0, h: h * 0.45, c: "#a81f0c", k: "fire" }),
      poly(ring, { ...base, b: h * 0.45, h: h * 0.85, c: "#ff6a1a", k: "fire" }),
      poly(hexRing(lat, lng, r * 0.55), { ...base, b: h * 0.85, h, c: "#fff0b8", k: "fire" }),
    );
    if (frp >= 12) {
      // smoke leaning downwind: each stage is higher, wider, paler and displaced
      for (let i = 1; i <= 4; i++) {
        const [sLat, sLng] = shift(lat, lng, Math.sin(toward) * lean * i, Math.cos(toward) * lean * i);
        features.push(
          poly(hexRing(sLat, sLng, r * (1.4 + i * 0.9)), {
            ...base,
            b: h * (0.85 + 0.55 * (i - 1)),
            h: h * (0.85 + 0.55 * i),
            c: ["#6b5a52", "#7c6e68", "#8d8480", "#a09a98"][i - 1],
            k: "smoke",
            o: 0.5 - i * 0.08,
          }),
        );
      }
    }
  }
  return { type: "FeatureCollection", features };
}

/**
 * Drone routes in 3D: a floating ribbon at flight altitude plus a faint
 * curtain down to the ground, so the path reads as a flight line.
 */
export function routeRibbons(features: Feat[]): FC {
  const out: GeoJSON.Feature[] = [];
  for (const f of features) {
    if (MODE_ROLE[String(f.properties.mode)] !== "route" || f.geometry.type !== "LineString") continue;
    try {
      const ribbon = buffer(feature(f.geometry as unknown as GeoJSON.LineString), 0.012, { units: "kilometers" });
      if (!ribbon || ribbon.geometry.type !== "Polygon") continue;
      out.push(
        { type: "Feature", properties: { b: 118, h: 142, c: ROLE_COLOR.route, k: "ribbon" }, geometry: ribbon.geometry },
        { type: "Feature", properties: { b: 0, h: 118, c: ROLE_COLOR.route, k: "curtain" }, geometry: ribbon.geometry },
      );
    } catch {
      /* degenerate route */
    }
  }
  return { type: "FeatureCollection", features: out };
}

/** Zones: a glowing boundary wall plus a very low, translucent volume. */
export function zoneVolumes(
  features: Feat[],
  alertIds: Set<string>,
  risk: Record<string, string>,
): FC {
  const out: GeoJSON.Feature[] = [];
  for (const f of features) {
    if (
      MODE_ROLE[String(f.properties.mode)] !== "zone" ||
      f.geometry.type !== "Polygon"
    )
      continue;
    const c = alertIds.has(f.id) ? "#d8402f" : (risk[f.id] ?? ROLE_COLOR.zone);
    const g = feature(f.geometry as unknown as GeoJSON.Polygon);
    out.push({
      type: "Feature",
      properties: { b: 0, h: 40, c, k: "vol" },
      geometry: g.geometry,
    });
    try {
      const inner = buffer(g, -0.045, { units: "kilometers" });
      if (inner && inner.geometry.type === "Polygon") {
        const outer = (f.geometry.coordinates as GeoJSON.Position[][])[0];
        const hole = inner.geometry.coordinates[0];
        out.push({
          type: "Feature",
          properties: { b: 0, h: 420, c, k: "wall" },
          geometry: { type: "Polygon", coordinates: [outer, hole] },
        });
      }
    } catch {
      /* tiny or degenerate zone: no wall */
    }
  }
  return { type: "FeatureCollection", features: out };
}

/** Sensors: a slim post with a brighter head. */
export function sensorPosts(features: Feat[], alertIds: Set<string>): FC {
  const out: GeoJSON.Feature[] = [];
  for (const f of features) {
    if (MODE_ROLE[String(f.properties.mode)] !== "sensor") continue;
    const [lng, lat] = f.geometry.coordinates as [number, number];
    const c = alertIds.has(f.id) ? "#e5483c" : ROLE_COLOR.sensor;
    out.push(
      poly(squareRing(lat, lng, 0.008), { b: 0, h: 110, c }),
      poly(squareRing(lat, lng, 0.02), {
        b: 110,
        h: 160,
        c: alertIds.has(f.id) ? "#ff8a7a" : "#7fe3ea",
      }),
    );
  }
  return { type: "FeatureCollection", features: out };
}

export { empty as emptyFC };
