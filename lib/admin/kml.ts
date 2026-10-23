import { isFeat } from "./store";
import type { Feat } from "./types";

const MODE_FOR: Record<string, string> = {
  Polygon: "zone-polygon",
  LineString: "line",
  Point: "sensor",
};

/** Caps shared with the GeoJSON import: a hostile file must not hang the tab. */
export const MAX_KML_CHARS = 2_000_000;
export const MAX_FEATURES = 5_000;
export const MAX_VERTICES = 100_000;
const TOO_BIG = "El archivo es demasiado grande o complejo.";

const stripCtl = (s: string) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, "");
const esc = (s: string) =>
  stripCtl(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ] as string,
  );

/** "lon,lat[,alt] lon,lat ..." -> [[lon,lat],...]; invalid tuples are dropped. */
function coords(text: string | null | undefined): [number, number][] {
  return (text ?? "")
    .trim()
    .split(/\s+/)
    .map((t) => t.split(",").map(Number))
    .filter(
      (p) =>
        p.length >= 2 &&
        Number.isFinite(p[0]) &&
        Number.isFinite(p[1]) &&
        Math.abs(p[0]) <= 180 &&
        Math.abs(p[1]) <= 90,
    )
    .map((p) => [p[0], p[1]] as [number, number]);
}

const kids = (el: Element, tag: string) =>
  Array.from(el.getElementsByTagName(tag));

/**
 * Placemark -> features. Polygon: outer ring kept, holes ignored.
 * MultiGeometry becomes one feature per member. Names go in `properties.name`.
 * Needs DOMParser (browser, or jsdom in tests). Throws on malformed XML.
 */
export function parseKml(text: string, idPrefix = "kml"): Feat[] {
  if (text.length > MAX_KML_CHARS) throw new Error(TOO_BIG);
  // KML never needs a DTD; refusing it closes entity-expansion (billion laughs) and external-entity tricks
  if (/<!(DOCTYPE|ENTITY)/i.test(text))
    throw new Error("El archivo KML no es válido.");
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.getElementsByTagName("parsererror").length)
    throw new Error("El archivo KML no es válido.");
  const out: Feat[] = [];
  let vertices = 0;
  const add = (geometry: Feat["geometry"], name: string) => {
    vertices += JSON.stringify(geometry.coordinates).split("],[").length;
    if (out.length >= MAX_FEATURES || vertices > MAX_VERTICES)
      throw new Error(TOO_BIG);
    const f = {
      type: "Feature" as const,
      id: `${idPrefix}-${out.length}`,
      geometry,
      properties: { mode: MODE_FOR[geometry.type], name },
    };
    if (isFeat(f)) out.push(f);
  };
  for (const pm of kids(doc.documentElement, "Placemark")) {
    const name = (kids(pm, "name")[0]?.textContent ?? "").trim().slice(0, 80);
    for (const p of kids(pm, "Point")) {
      const c = coords(kids(p, "coordinates")[0]?.textContent)[0];
      if (c) add({ type: "Point", coordinates: c }, name);
    }
    for (const l of kids(pm, "LineString")) {
      const c = coords(kids(l, "coordinates")[0]?.textContent);
      if (c.length >= 2) add({ type: "LineString", coordinates: c }, name);
    }
    for (const poly of kids(pm, "Polygon")) {
      const outer = kids(poly, "outerBoundaryIs")[0];
      const c = coords(
        outer ? kids(outer, "coordinates")[0]?.textContent : null,
      );
      if (c.length >= 3) {
        const [a, b] = [c[0], c[c.length - 1]];
        add(
          {
            type: "Polygon",
            coordinates: [a[0] === b[0] && a[1] === b[1] ? c : [...c, a]],
          },
          name,
        );
      }
    }
  }
  return out;
}

const ring = (c: unknown) =>
  (c as number[][]).map((p) => `${p[0]},${p[1]}`).join(" ");

function geomKml(g: Feat["geometry"]): string {
  const c = g.coordinates;
  if (g.type === "Point")
    return `<Point><coordinates>${(c as number[]).join(",")}</coordinates></Point>`;
  if (g.type === "LineString")
    return `<LineString><coordinates>${ring(c)}</coordinates></LineString>`;
  return `<Polygon><outerBoundaryIs><LinearRing><coordinates>${ring((c as unknown[])[0])}</coordinates></LinearRing></outerBoundaryIs></Polygon>`;
}

/** Valid KML 2.2 document. Features with unsupported geometry are skipped. */
export function toKml(
  features: Feat[],
  meta: Record<string, { name?: string }> = {},
): string {
  const marks = features
    .filter((f) => f.geometry.type in MODE_FOR)
    .map(
      (f) =>
        `<Placemark><name>${esc(meta[f.id]?.name || f.id)}</name><ExtendedData><Data name="mode"><value>${esc(String(f.properties.mode ?? ""))}</value></Data></ExtendedData>${geomKml(f.geometry)}</Placemark>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>Sentinel</name>${marks}</Document></kml>`;
}
