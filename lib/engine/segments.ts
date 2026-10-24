import { inPolygon, nearestOnSegment, type XY } from "./geo";

/**
 * Nearest-boundary queries against a projected (multi)polygon: a bucket grid
 * of its edges, searched in growing square rings until no closer edge can
 * exist. Also answers point-in-polygon with a bbox pre-check.
 */
export class PolygonIndex {
  private cells = new Map<string, [XY, XY][]>();
  private bboxes: [number, number, number, number][];
  private readonly cell: number;
  readonly polygons: XY[][][];

  constructor(polygons: XY[][][], cell = 400) {
    this.polygons = polygons;
    this.cell = cell;
    this.bboxes = polygons.map((poly) => {
      let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
      for (const [x, y] of poly[0]) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
      return [x0, y0, x1, y1];
    });
    for (const poly of polygons)
      for (const ring of poly)
        for (let i = 0; i < ring.length - 1; i++) this.addSegment(ring[i], ring[i + 1]);
  }

  get empty() {
    return this.polygons.length === 0;
  }

  private addSegment(a: XY, b: XY) {
    const i0 = Math.floor(Math.min(a[0], b[0]) / this.cell);
    const i1 = Math.floor(Math.max(a[0], b[0]) / this.cell);
    const j0 = Math.floor(Math.min(a[1], b[1]) / this.cell);
    const j1 = Math.floor(Math.max(a[1], b[1]) / this.cell);
    for (let i = i0; i <= i1; i++)
      for (let j = j0; j <= j1; j++) {
        const k = `${i}:${j}`;
        const list = this.cells.get(k);
        if (list) list.push([a, b]);
        else this.cells.set(k, [[a, b]]);
      }
  }

  contains(p: XY) {
    return this.polygons.some((poly, n) => {
      const [x0, y0, x1, y1] = this.bboxes[n];
      return p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1 && inPolygon(p, poly);
    });
  }

  /** Closest boundary point within maxM metres, or null. */
  nearest(p: XY, maxM = 60_000): { d: number; q: XY } | null {
    const ci = Math.floor(p[0] / this.cell);
    const cj = Math.floor(p[1] / this.cell);
    let best: { d: number; q: XY } | null = null;
    const maxK = Math.ceil(maxM / this.cell);
    for (let k = 0; k <= maxK; k++) {
      if (best && best.d <= (k - 1) * this.cell) break;
      for (let i = ci - k; i <= ci + k; i++)
        for (let j = cj - k; j <= cj + k; j++) {
          if (Math.max(Math.abs(i - ci), Math.abs(j - cj)) !== k) continue;
          for (const [a, b] of this.cells.get(`${i}:${j}`) ?? []) {
            const r = nearestOnSegment(p, a, b);
            if (!best || r.d < best.d) best = r;
          }
        }
    }
    return best && best.d <= maxM ? best : null;
  }

  /** Distance from p to the polygon: 0 inside, else to the nearest edge. */
  distance(p: XY, maxM?: number) {
    if (this.contains(p)) return 0;
    return this.nearest(p, maxM)?.d ?? Infinity;
  }
}
