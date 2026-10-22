import { nearestPlace } from "./places";
import type { FireCluster, FirePoint } from "./types";

const LINK_KM = 3;
const MIN_POINTS = 3;
const KM_LAT = 111.32;

const kmBetween = (a: FirePoint, b: FirePoint) => {
  const dy = (a[0] - b[0]) * KM_LAT;
  const dx =
    (a[1] - b[1]) * KM_LAT * Math.cos(((a[0] + b[0]) / 2) * (Math.PI / 180));
  return Math.hypot(dx, dy);
};

/**
 * Single-link clusters of detections <= linkKm apart (grid-bucketed, ~linear),
 * biggest FRP first, then count. Unlike a fixed lat/lng grid, a fire that
 * straddles a cell edge stays one cluster. Pure.
 */
export function clusterDetections(
  points: FirePoint[],
  { limit = 8, minPoints = MIN_POINTS, linkKm = LINK_KM } = {},
): FireCluster[] {
  const parent = points.map((_, i) => i);
  const find = (i: number): number =>
    parent[i] === i ? i : (parent[i] = find(parent[i]));
  const cellLat = linkKm / KM_LAT;
  // a degree of longitude shrinks toward the pole: size cells for ~57°S so one ring of neighbours covers linkKm
  const cellLng = cellLat / 0.55;
  const key = (p: FirePoint) =>
    `${Math.floor(p[0] / cellLat)}:${Math.floor(p[1] / cellLng)}`;
  const grid = new Map<string, number[]>();
  points.forEach((p, i) => {
    const k = key(p);
    const cell = grid.get(k);
    if (cell) cell.push(i);
    else grid.set(k, [i]);
  });
  points.forEach((p, i) => {
    const [cy, cx] = key(p).split(":").map(Number);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        for (const j of grid.get(`${cy + dy}:${cx + dx}`) ?? [])
          if (j > i && kmBetween(p, points[j]) <= linkKm)
            parent[find(j)] = find(i);
  });
  const out = new Map<number, FirePoint[]>();
  points.forEach((p, i) => {
    const r = find(i);
    const g = out.get(r);
    if (g) g.push(p);
    else out.set(r, [p]);
  });
  return [...out.values()]
    .filter((g) => g.length >= minPoints)
    .map((g): FireCluster => {
      const lat = g.reduce((s, p) => s + p[0], 0) / g.length;
      const lng = g.reduce((s, p) => s + p[1], 0) / g.length;
      return {
        lat,
        lng,
        count: g.length,
        frp: Math.round(g.reduce((s, p) => s + p[2], 0)),
        ...nearestPlace(lat, lng),
      };
    })
    .sort((a, b) => b.frp - a.frp || b.count - a.count)
    .slice(0, limit);
}
