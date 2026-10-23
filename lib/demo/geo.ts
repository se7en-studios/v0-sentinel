// Tiny equirectangular projection + point-in-polygon for the presentation mode map.
// No map library, no tiles: the country outline from data/latam-countries.json drawn as one SVG path.

export interface Proj {
  lon0: number;
  lat0: number;
  /** longitude shrink at the country's mean latitude (cos φ) */
  k: number;
  /** SVG units per degree */
  s: number;
  w: number;
  h: number;
}

type Ring = readonly (readonly number[])[];

export interface CountryGeo {
  path: string;
  proj: Proj;
  /** outer rings, [lon, lat] */
  rings: Ring[];
}

interface GeoJsonLike {
  features: { properties: { name: string }; geometry: { type: string; coordinates: unknown } }[];
}

const SCALE = 12;
const PAD = 4;

const isRing = (r: unknown): r is Ring =>
  Array.isArray(r) && r.length >= 4 && r.every((p) => Array.isArray(p) && p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]));

/** Outer rings of a (Multi)Polygon feature; throws on anything unexpected (static, build-time data). */
export function outerRings(geo: GeoJsonLike, name: string): Ring[] {
  const f = geo.features.find((x) => x.properties.name === name);
  if (!f) throw new Error(`country not found: ${name}`);
  const { type, coordinates } = f.geometry;
  const polys = type === "Polygon" ? [coordinates] : type === "MultiPolygon" ? (coordinates as unknown[]) : null;
  if (!polys) throw new Error(`unsupported geometry: ${type}`);
  const rings = polys.map((p) => (Array.isArray(p) ? p[0] : null)).filter(isRing);
  if (rings.length === 0) throw new Error("no valid rings");
  return rings;
}

export function buildCountry(geo: GeoJsonLike, name: string): CountryGeo {
  const rings = outerRings(geo, name);
  const pts = rings.flat();
  const lons = pts.map((p) => p[0]);
  const lats = pts.map((p) => p[1]);
  const [minLon, maxLon, minLat, maxLat] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)];
  const k = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const proj: Proj = {
    lon0: minLon,
    lat0: maxLat,
    k,
    s: SCALE,
    w: Math.ceil((maxLon - minLon) * k * SCALE + PAD * 2),
    h: Math.ceil((maxLat - minLat) * SCALE + PAD * 2),
  };
  const path = rings
    .map((r) => "M" + r.map((p) => project(proj, p[0], p[1]).map((n) => n.toFixed(1)).join(" ")).join("L") + "Z")
    .join("");
  return { path, proj, rings };
}

export function project(p: Proj, lon: number, lat: number): [number, number] {
  return [PAD + (lon - p.lon0) * p.k * p.s, PAD + (p.lat0 - lat) * p.s];
}

export function unproject(p: Proj, x: number, y: number): [number, number] {
  return [(x - PAD) / (p.k * p.s) + p.lon0, p.lat0 - (y - PAD) / p.s];
}

/** Ray casting over the outer rings. */
export function inside(rings: readonly Ring[], lon: number, lat: number): boolean {
  return rings.some((r) => {
    let hit = false;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i];
      const [xj, yj] = r[j];
      if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
  });
}
