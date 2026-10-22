import type { FirePoint } from "./types";

export type NoiseReason = "static" | "industrial" | null;

export interface Classified {
  /** 0-100, how likely the detection is a real vegetation fire */
  score: number[];
  /** why a detection looks like industrial heat, null when it does not */
  reason: NoiseReason[];
  /** true when the ~440 m pixel was not seen on an earlier day and is within 24 h of the newest detection */
  fresh: boolean[];
}

// A fixed hot pixel that keeps showing up day after day with modest power is
// almost always a flare, kiln or smelter, not a vegetation fire.
const PIXEL = 0.004; // ~440 m, a bit wider than a 375 m VIIRS pixel
const STATIC_DAYS = 5;
const STATIC_MAX_FRP = 40; // MW: above this a persistent source is probably a real, large fire
// The satellite geometry shifts the same source a few hundred metres between passes, so persistence is
// judged on ~1 km cells (3x3 neighbourhood). A real fire that lasts days spreads over many distinct
// pixels; a fixed source keeps landing on the same handful (9-14 seen on live data, 2026-10).
const COARSE = 0.01;
const STATIC_MAX_POSITIONS = 16;
const KM_LAT = 111.32;
const FRESH_MIN = 24 * 60;
// minutes since day 0 (day index + hhmm UTC), comparable across days
const minutes = (p: FirePoint) =>
  p[4] * 1440 + Math.floor(p[5] / 100) * 60 + (p[5] % 100);

/**
 * Large industrial heat sources. ponytail: approximate coordinates written from
 * memory, radius generous to a few km; validate each against a satellite image
 * before relying on them. The data-driven "static" rule catches the many sites
 * that are not listed (oil and gas fields spread over hundreds of km²).
 */
export const INDUSTRIAL_SITES: {
  name: string;
  lat: number;
  lng: number;
  km: number;
}[] = [
  { name: "Refinería La Plata", lat: -34.905, lng: -57.915, km: 3 },
  { name: "Dock Sud", lat: -34.645, lng: -58.345, km: 3 },
  { name: "Polo de Campana", lat: -34.16, lng: -58.95, km: 4 },
  {
    name: "Polo petroquímico de Bahía Blanca",
    lat: -38.77,
    lng: -62.27,
    km: 4,
  },
  { name: "Refinería Luján de Cuyo", lat: -33.01, lng: -68.88, km: 3 },
  { name: "Refinería Plaza Huincul", lat: -38.93, lng: -69.21, km: 3 },
  { name: "Puerto General San Martín", lat: -32.75, lng: -60.73, km: 5 },
  { name: "Añelo (Vaca Muerta)", lat: -38.35, lng: -68.79, km: 6 },
  { name: "Rincón de los Sauces", lat: -37.39, lng: -68.93, km: 5 },
  { name: "Comodoro Rivadavia", lat: -45.86, lng: -67.48, km: 6 },
  { name: "Campo Durán / Aguaray", lat: -22.25, lng: -63.73, km: 5 },
];

const kmApart = (aLat: number, aLng: number, bLat: number, bLng: number) => {
  const dy = (aLat - bLat) * KM_LAT;
  const dx = (aLng - bLng) * KM_LAT * Math.cos((aLat * Math.PI) / 180);
  return Math.hypot(dx, dy);
};

const pixel = (p: FirePoint) =>
  `${Math.round(p[0] / PIXEL)}:${Math.round(p[1] / PIXEL)}`;

/**
 * Scores every detection and flags those that look like industrial heat.
 * Pure and order-preserving: result arrays line up with `points`.
 */
export interface FireInfo {
  /** 0-100 likelihood of a real vegetation fire */
  score: number;
  reason: NoiseReason;
  /** first sighting of this pixel in the last 24 h of data */
  fresh: boolean;
}

/** Detection object -> classifier verdict, so the map can explain any point without re-classifying. */
export function fireInfoMap(
  points: FirePoint[],
  c: Classified,
): Map<FirePoint, FireInfo> {
  const m = new Map<FirePoint, FireInfo>();
  points.forEach((p, i) =>
    m.set(p, { score: c.score[i], reason: c.reason[i], fresh: c.fresh[i] }),
  );
  return m;
}

export function classifyPoints(points: FirePoint[]): Classified {
  const byPixel = new Set<string>();
  type Cell = { days: Set<number>; maxFrp: number; positions: Set<string> };
  const cells = new Map<string, Cell>();
  const coarse = (p: FirePoint): [number, number] => [
    Math.round(p[0] / COARSE),
    Math.round(p[1] / COARSE),
  ];
  for (const p of points) {
    byPixel.add(pixel(p));
    const [ci, cj] = coarse(p);
    const k = `${ci}:${cj}`;
    const e = cells.get(k) ?? {
      days: new Set<number>(),
      maxFrp: 0,
      positions: new Set<string>(),
    };
    e.days.add(p[4]);
    e.maxFrp = Math.max(e.maxFrp, p[2]);
    e.positions.add(`${p[0].toFixed(3)},${p[1].toFixed(3)}`);
    cells.set(k, e);
  }
  const hoods = new Map<string, Cell>();
  const hood = (p: FirePoint): Cell => {
    const [ci, cj] = coarse(p);
    const k = `${ci}:${cj}`;
    let h = hoods.get(k);
    if (!h) {
      h = { days: new Set(), maxFrp: 0, positions: new Set() };
      for (let di = -1; di <= 1; di++)
        for (let dj = -1; dj <= 1; dj++) {
          const c = cells.get(`${ci + di}:${cj + dj}`);
          if (!c) continue;
          c.days.forEach((d) => h!.days.add(d));
          c.positions.forEach((q) => h!.positions.add(q));
          h.maxFrp = Math.max(h.maxFrp, c.maxFrp);
        }
      hoods.set(k, h);
    }
    return h;
  };
  const neighbours = (p: FirePoint) => {
    const [i, j] = pixel(p).split(":").map(Number);
    let n = 0;
    for (let di = -3; di <= 3; di++)
      for (let dj = -3; dj <= 3; dj++)
        if ((di || dj) && byPixel.has(`${i + di}:${j + dj}`)) n++;
    return n;
  };

  const firstDay = new Map<string, number>();
  let newest = -Infinity;
  for (const p of points) {
    const k = pixel(p);
    firstDay.set(k, Math.min(firstDay.get(k) ?? Infinity, p[4]));
    newest = Math.max(newest, minutes(p));
  }

  const score: number[] = [];
  const reason: NoiseReason[] = [];
  const fresh: boolean[] = [];
  for (const p of points) {
    fresh.push(
      firstDay.get(pixel(p)) === p[4] && newest - minutes(p) <= FRESH_MIN,
    );
    const h = hood(p);
    const near = neighbours(p);
    let why: NoiseReason = null;
    if (
      h.days.size >= STATIC_DAYS &&
      h.maxFrp < STATIC_MAX_FRP &&
      h.positions.size <= STATIC_MAX_POSITIONS
    )
      why = "static";
    else if (
      INDUSTRIAL_SITES.some((s) => kmApart(p[0], p[1], s.lat, s.lng) <= s.km)
    )
      why = "industrial";

    // satellite confidence is the base; power and company (neighbours) raise it
    const base = [20, 55, 80][p[3]] ?? 40;
    const raw = base + Math.min(15, p[2] / 10) + Math.min(10, near * 2);
    score.push(
      why ? Math.min(15, Math.round(raw / 6)) : Math.min(100, Math.round(raw)),
    );
    reason.push(why);
  }
  return { score, reason, fresh };
}
