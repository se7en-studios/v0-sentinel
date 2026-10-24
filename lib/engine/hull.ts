import Delaunator from "delaunator";
import jsts, { type Geometry } from "jsts";
import { inRing, ringArea, type XY } from "./geo";

/** Projected multipolygon: polygons → rings (closed) → [x, y] metres. */
export type MultiXY = XY[][][];

/** FEDS (Chen et al. 2022): keep Delaunay triangles with circumradius < 1 km. */
export const ALPHA_M = 1000;
/** ...then buffer by half a VIIRS pixel so each detection keeps its footprint. */
export const PIXEL_BUFFER_M = 187.5;
const QUADRANT_SEGMENTS = 4;

const reader = new jsts.io.GeoJSONReader();
const writer = new jsts.io.GeoJSONWriter();
const factory = new jsts.geom.GeometryFactory();

/**
 * Alpha shape of projected points: the polygons formed by kept triangles
 * (ring-walked from edges owned by a single kept triangle) and the points no
 * kept triangle touches. Rings may pinch at a vertex; fireHull cleans that up.
 */
export function alphaShape(xy: XY[], alphaM = ALPHA_M) {
  const seen = new Set<string>();
  const pts: XY[] = [];
  for (const p of xy) {
    const k = `${Math.round(p[0])}:${Math.round(p[1])}`; // 1 m: duplicates make degenerate triangles
    if (seen.has(k)) continue;
    seen.add(k);
    pts.push(p);
  }
  if (pts.length < 3) return { polygons: [] as MultiXY, isolated: pts, triangles: [] as XY[][] };

  const d = Delaunator.from(pts);
  const used = new Uint8Array(pts.length);
  const edgeCount = new Map<number, number>();
  const directed: [number, number][] = [];
  const triangles: XY[][] = [];
  const n = pts.length;
  const ekey = (u: number, v: number) => (u < v ? u * n + v : v * n + u);
  const tri = d.triangles;
  for (let t = 0; t < tri.length; t += 3) {
    const a = tri[t];
    let b = tri[t + 1];
    let c = tri[t + 2];
    const [ax, ay] = pts[a];
    const [bx, by] = pts[b];
    const [cx, cy] = pts[c];
    const cross = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    if (Math.abs(cross) < 1e-6) continue;
    const r =
      (Math.hypot(bx - cx, by - cy) * Math.hypot(ax - cx, ay - cy) * Math.hypot(ax - bx, ay - by)) /
      (2 * Math.abs(cross));
    if (r >= alphaM) continue;
    if (cross < 0) [b, c] = [c, b]; // counter-clockwise: interior on the left
    used[a] = used[b] = used[c] = 1;
    triangles.push([pts[a], pts[b], pts[c], pts[a]]);
    for (const [u, v] of [
      [a, b],
      [b, c],
      [c, a],
    ] as [number, number][]) {
      edgeCount.set(ekey(u, v), (edgeCount.get(ekey(u, v)) ?? 0) + 1);
      directed.push([u, v]);
    }
  }

  const next = new Map<number, number[]>();
  for (const [u, v] of directed) {
    if (edgeCount.get(ekey(u, v)) !== 1) continue;
    const list = next.get(u);
    if (list) list.push(v);
    else next.set(u, [v]);
  }
  const rings: XY[][] = [];
  for (const start of [...next.keys()]) {
    while ((next.get(start)?.length ?? 0) > 0) {
      const ring: XY[] = [pts[start]];
      let cur = next.get(start)!.pop()!;
      let guard = directed.length;
      while (cur !== start && guard-- > 0) {
        ring.push(pts[cur]);
        const outs = next.get(cur);
        if (!outs?.length) break;
        cur = outs.pop()!;
      }
      if (ring.length >= 3) rings.push([...ring, ring[0]]);
    }
  }

  const polygons: MultiXY = rings.filter((r) => ringArea(r) > 0).map((o) => [o]);
  for (const h of rings.filter((r) => ringArea(r) < 0)) {
    const owner = polygons
      .filter((p) => inRing(h[0], p[0]))
      .sort((a, b) => ringArea(a[0]) - ringArea(b[0]))[0];
    owner?.push(h);
  }
  const isolated = pts.filter((_, i) => !used[i]);
  return { polygons, isolated, triangles };
}

/**
 * Burned-area hull for a fire, in projected metres: alpha shape of every
 * pixel since ignition, buffered by half a pixel, unioned with the previous
 * hull so the perimeter never shrinks (FEDS behaviour).
 */
export function fireHull(xy: XY[], previous?: MultiXY | null): MultiXY {
  const { polygons, isolated, triangles } = alphaShape(xy);
  const parts: Geometry[] = [];
  if (polygons.length) {
    let g = reader.read({ type: "MultiPolygon", coordinates: polygons });
    if (!g.isValid()) {
      // pinched rings: fall back to the exact (slower) union of the triangles
      g = jsts.operation.union.UnaryUnionOp.union(
        factory.createGeometryCollection(
          triangles.map((t) => reader.read({ type: "Polygon", coordinates: [t] })),
        ),
      );
    }
    parts.push(g);
  }
  if (isolated.length) parts.push(reader.read({ type: "MultiPoint", coordinates: isolated }));
  if (!parts.length) return previous ?? [];
  let hull = jsts.operation.buffer.BufferOp.bufferOp(
    factory.createGeometryCollection(parts),
    PIXEL_BUFFER_M,
    QUADRANT_SEGMENTS,
  );
  if (previous?.length) hull = hull.union(reader.read({ type: "MultiPolygon", coordinates: previous }));
  return toMulti(writer.write(hull));
}

/** Union of projected multipolygons (used when fires merge). */
export function unionXY(a: MultiXY, b: MultiXY): MultiXY {
  if (!a.length) return b;
  if (!b.length) return a;
  const g = reader
    .read({ type: "MultiPolygon", coordinates: a })
    .union(reader.read({ type: "MultiPolygon", coordinates: b }));
  return toMulti(writer.write(g));
}

/** Planar area in m² (holes subtracted). */
export function areaM2(m: MultiXY) {
  let s = 0;
  for (const poly of m) poly.forEach((ring, i) => (s += i === 0 ? Math.abs(ringArea(ring)) : -Math.abs(ringArea(ring))));
  return s;
}

function toMulti(g: GeoJSON.Geometry): MultiXY {
  if (g.type === "Polygon") return [g.coordinates as XY[][]];
  if (g.type === "MultiPolygon") return g.coordinates as MultiXY;
  if (g.type === "GeometryCollection")
    return g.geometries.flatMap((x) => (x.type === "Polygon" || x.type === "MultiPolygon" ? toMulti(x) : []));
  return [];
}
