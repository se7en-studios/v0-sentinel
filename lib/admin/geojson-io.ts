import { isFeat } from "./store";
import type { Feat } from "./types";

export const MAX_IMPORT_BYTES = 2_000_000;

/**
 * Geometry -> app mode. The app only draws Polygon / LineString / Point:
 * Polygon -> zone-polygon, LineString -> line (not "route": routes are drone
 * missions created inside Sentinel), Point -> sensor.
 */
const MODE_FOR: Record<string, string> = {
  Polygon: "zone-polygon",
  LineString: "line",
  Point: "sensor",
};

type Geom = { type?: unknown; coordinates?: unknown; geometries?: unknown };

/** Splits Multi* / GeometryCollection into simple geometries; unsupported ones are dropped. */
function simple(g: Geom | null | undefined): Geom[] {
  if (!g || typeof g !== "object") return [];
  const c = g.coordinates;
  switch (g.type) {
    case "Polygon": // holes ignored, outer ring kept
      return Array.isArray(c) && c.length
        ? [{ type: "Polygon", coordinates: [c[0]] }]
        : [];
    case "LineString":
    case "Point":
      return [g];
    case "MultiPolygon":
      return Array.isArray(c)
        ? c.flatMap((p) => simple({ type: "Polygon", coordinates: p }))
        : [];
    case "MultiLineString":
      return Array.isArray(c)
        ? c.map((l) => ({ type: "LineString", coordinates: l }))
        : [];
    case "MultiPoint":
      return Array.isArray(c)
        ? c.map((p) => ({ type: "Point", coordinates: p }))
        : [];
    case "GeometryCollection":
      return Array.isArray(g.geometries)
        ? (g.geometries as Geom[]).flatMap(simple)
        : [];
    default:
      return [];
  }
}

export interface GeoJsonImport {
  features: Feat[];
  /** id -> display name (meta.name, properties.name/title, or the id) */
  names: Record<string, string>;
  /** raw `meta` / `settings` of a Sentinel export, unvalidated */
  meta: Record<string, unknown>;
  settings: unknown;
  skipped: number;
}

const isGeometryType = (t: unknown) =>
  typeof t === "string" &&
  (t === "GeometryCollection" || t.replace(/^Multi/, "") in MODE_FOR);

/** Throws an Error with a user-facing Spanish message. */
export function parseGeoJson(text: string): GeoJsonImport {
  if (text.length > MAX_IMPORT_BYTES)
    throw new Error("El archivo supera los 2 MB.");
  let j: Record<string, unknown>;
  try {
    j = JSON.parse(text);
  } catch {
    throw new Error("El archivo no es JSON válido.");
  }
  if (!j || typeof j !== "object") throw new Error("El archivo no es GeoJSON.");

  let raw: unknown[];
  if (Array.isArray(j.features)) raw = j.features;
  else if (j.type === "Feature") raw = [j];
  else if (isGeometryType(j.type))
    raw = [{ type: "Feature", properties: {}, geometry: j }];
  else
    throw new Error(
      "No es un FeatureCollection, Feature ni geometría GeoJSON.",
    );

  const meta =
    j.meta && typeof j.meta === "object"
      ? (j.meta as Record<string, unknown>)
      : {};
  const stamp = Date.now();
  const seen = new Set<string>();
  const features: Feat[] = [];
  const names: Record<string, string> = {};
  let skipped = 0;
  let n = 0;

  for (const item of raw) {
    const f = item as {
      id?: unknown;
      properties?: Record<string, unknown>;
      geometry?: Geom;
    } | null;
    const parts = simple(f?.geometry);
    if (parts.length === 0) skipped++;
    const baseId = f?.id !== undefined && f.id !== null ? String(f.id) : "";
    const props = f?.properties ?? {};
    // a Sentinel export already carries a valid mode (zone-circle, route...): keep it when the geometry agrees
    const ownMode = typeof props.mode === "string" ? props.mode : "";
    parts.forEach((g, k) => {
      let id = baseId
        ? parts.length > 1
          ? `${baseId}-${k}`
          : baseId
        : `imp-${stamp}-${n}`;
      n++;
      while (seen.has(id)) id = `${id}_${n++}`;
      const own =
        ownMode && isFeat({ id, geometry: g, properties: { mode: ownMode } });
      const feat = {
        type: "Feature" as const,
        id,
        geometry: g as Feat["geometry"],
        properties: { mode: own ? ownMode : MODE_FOR[String(g.type)] },
      };
      if (!isFeat(feat)) return void skipped++;
      seen.add(id);
      features.push(feat);
      const m = meta[baseId] as { name?: unknown } | undefined;
      const name = [m?.name, props.name, props.title].find(
        (v) => typeof v === "string" && v.trim(),
      );
      names[id] = String(name ?? id).slice(0, 80);
    });
  }
  return { features, names, meta, settings: j.settings, skipped };
}
