import type { FirePoint } from "./types";

export interface IncidentEvent {
  day: number;
  kind: "ignition" | "explosive" | "jump";
  title: string;
  sub: string;
}

export interface Incident {
  id: string;
  lat: number;
  lng: number;
  count: number;
  frp: number;
  areaHa: number;
  growthHa: number;
  perDay: { day: number; areaHa: number; points: number; frp: number }[];
  /** cumulative convex outline per day, [lng, lat] rings, for the silhouette */
  hulls: { day: number; ring: [number, number][] }[];
  events: IncidentEvent[];
}

const LINK_KM = 3;
const MIN_POINTS = 5;
const PIXEL_KM = 0.1875; // half of a 375 m VIIRS pixel
const JUMP_KM = 2;
const EXPLOSIVE_HA = 100;
const EXPLOSIVE_PCT = 0.5;
const KM_LAT = 111.32;

const kmBetween = (a: FirePoint, b: FirePoint) => {
  const dy = (a[0] - b[0]) * KM_LAT;
  const dx =
    (a[1] - b[1]) * KM_LAT * Math.cos(((a[0] + b[0]) / 2) * (Math.PI / 180));
  return Math.hypot(dx, dy);
};

/** Andrew's monotone chain; returns the ring without repeating the first vertex. */
function hull(pts: [number, number][]): [number, number][] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o: number[], a: number[], b: number[]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (arr: [number, number][]) => {
    const h: [number, number][] = [];
    for (const q of arr) {
      while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], q) <= 0)
        h.pop();
      h.push(q);
    }
    h.pop();
    return h;
  };
  return [...half(p), ...half([...p].reverse())];
}

/** Shoelace on a local equirectangular projection, in hectares. */
function areaHa(ring: [number, number][]) {
  if (ring.length < 3) return 0;
  const lat0 = ring.reduce((a, r) => a + r[1], 0) / ring.length;
  const kx = KM_LAT * Math.cos(lat0 * (Math.PI / 180));
  let s = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    s += x1 * kx * (y2 * KM_LAT) - x2 * kx * (y1 * KM_LAT);
  }
  return (Math.abs(s) / 2) * 100; // km² → ha
}

const corners = (p: FirePoint): [number, number][] => {
  const dLat = PIXEL_KM / KM_LAT;
  const dLng = PIXEL_KM / (KM_LAT * Math.cos(p[0] * (Math.PI / 180)));
  return [
    [p[1] - dLng, p[0] - dLat],
    [p[1] + dLng, p[0] - dLat],
    [p[1] + dLng, p[0] + dLat],
    [p[1] - dLng, p[0] + dLat],
  ];
};

/** Single-link groups of detections closer than LINK_KM. Grid-bucketed, so ~linear. */
function groups(points: FirePoint[]) {
  const parent = points.map((_, i) => i);
  const find = (i: number): number =>
    parent[i] === i ? i : (parent[i] = find(parent[i]));
  const cellLat = LINK_KM / KM_LAT;
  // a degree of longitude is shorter toward the pole: size cells for ~57°S so one ring of neighbours always covers LINK_KM
  const cellLng = cellLat / 0.55;
  const key = (p: FirePoint) =>
    `${Math.floor(p[0] / cellLat)}:${Math.floor(p[1] / cellLng)}`;
  const grid = new Map<string, number[]>();
  points.forEach((p, i) => {
    const k = key(p);
    grid.set(k, [...(grid.get(k) ?? []), i]);
  });
  points.forEach((p, i) => {
    const [cy, cx] = key(p).split(":").map(Number);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        for (const j of grid.get(`${cy + dy}:${cx + dx}`) ?? [])
          if (j > i && kmBetween(p, points[j]) <= LINK_KM)
            parent[find(j)] = find(i);
  });
  const out = new Map<number, FirePoint[]>();
  points.forEach((p, i) => out.set(find(i), [...(out.get(find(i)) ?? []), p]));
  return [...out.values()].filter((g) => g.length >= MIN_POINTS);
}

// cells sized so one ring of neighbours always covers JUMP_KM (same longitude trick as groups())
const jumpCellLat = JUMP_KM / KM_LAT;
const jumpCellLng = jumpCellLat / 0.55;
const jumpKey = (p: FirePoint) =>
  `${Math.floor(p[0] / jumpCellLat)}:${Math.floor(p[1] / jumpCellLng)}`;

function addToGrid(grid: Map<string, FirePoint[]>, p: FirePoint) {
  const k = jumpKey(p);
  const cell = grid.get(k);
  if (cell) cell.push(p);
  else grid.set(k, [p]);
}

/** For each of today's detections with nothing earlier within JUMP_KM, the distance to the nearest earlier one. Near-linear: only isolated points pay for a full scan. */
function isolatedKm(
  today: FirePoint[],
  seen: Map<string, FirePoint[]>,
  g: FirePoint[],
  day: number,
) {
  const out: number[] = [];
  for (const p of today) {
    const [cy, cx] = jumpKey(p).split(":").map(Number);
    let near = false;
    for (let dy = -1; dy <= 1 && !near; dy++)
      for (let dx = -1; dx <= 1 && !near; dx++)
        near = (seen.get(`${cy + dy}:${cx + dx}`) ?? []).some(
          (q) => kmBetween(p, q) < JUMP_KM,
        );
    if (near) continue;
    let min = Infinity;
    for (const q of g) if (q[4] < day) min = Math.min(min, kmBetween(p, q));
    if (min >= JUMP_KM && Number.isFinite(min)) out.push(min);
  }
  return out;
}

/** Largest-FRP incidents with a day-by-day cumulative outline. Pure; the outline is convex, so it overestimates ragged fires. */
export function buildIncidents(points: FirePoint[], limit = 8): Incident[] {
  return groups(points)
    .map((g): Incident => {
      const lastDay = Math.max(...g.map((p) => p[4]));
      const firstDay = Math.min(...g.map((p) => p[4]));
      const perDay: Incident["perDay"] = [];
      const hulls: Incident["hulls"] = [];
      const events: IncidentEvent[] = [];
      const seen = new Map<string, FirePoint[]>();
      let prevArea = 0;
      for (let d = firstDay; d <= lastDay; d++) {
        const upTo = g.filter((p) => p[4] <= d);
        const today = g.filter((p) => p[4] === d);
        const ring = hull(upTo.flatMap(corners));
        const a = areaHa(ring);
        perDay.push({
          day: d,
          areaHa: Math.round(a),
          points: today.length,
          frp: Math.round(today.reduce((s, p) => s + p[2], 0)),
        });
        hulls.push({ day: d, ring });
        if (d === firstDay)
          events.push({
            day: d,
            kind: "ignition",
            title: "Ignición detectada",
            sub: `${today.length} focos en el primer pase`,
          });
        else {
          const delta = a - prevArea;
          if (
            delta >= EXPLOSIVE_HA &&
            delta / Math.max(prevArea, 1) >= EXPLOSIVE_PCT
          )
            events.push({
              day: d,
              kind: "explosive",
              title: "Crecimiento explosivo",
              sub: `+${Math.round(delta).toLocaleString("es-AR")} ha en 24 h`,
            });
          const far = isolatedKm(today, seen, g, d);
          if (far.length)
            events.push({
              day: d,
              kind: "jump",
              title: "Posible salto de fuego",
              sub: `Foco aislado a ${Math.max(...far).toFixed(1)} km de lo ya quemado`,
            });
        }
        prevArea = a;
        for (const p of today) addToGrid(seen, p);
      }
      const n = perDay.length;
      // the earliest detection anchors the id: it stays put while the 10-day window slides, unlike an arbitrary member
      const first = g.reduce((m, p) =>
        p[4] < m[4] || (p[4] === m[4] && p[5] < m[5]) ? p : m,
      );
      return {
        id: `${first[0].toFixed(2)},${first[1].toFixed(2)}`,
        lat: g.reduce((s, p) => s + p[0], 0) / g.length,
        lng: g.reduce((s, p) => s + p[1], 0) / g.length,
        count: g.length,
        frp: Math.round(g.reduce((s, p) => s + p[2], 0)),
        areaHa: perDay[n - 1].areaHa,
        growthHa: n > 1 ? perDay[n - 1].areaHa - perDay[n - 2].areaHa : 0,
        perDay,
        hulls,
        events,
      };
    })
    .sort((a, b) => b.frp - a.frp)
    .slice(0, limit);
}
