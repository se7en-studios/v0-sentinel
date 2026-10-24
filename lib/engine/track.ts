// Object-based fire tracking on VIIRS 375 m detections, after NASA FEDS
// (Chen et al. 2022, Sci Data 9:249): 12 h steps, 0.7 km clustering,
// attach-by-distance with land-cover dependent reach, merge into the lowest
// id, alpha-shape perimeters that never shrink, 5/20-day active/sleeper rules.
// Hotspot states and rate-of-spread metrics are our additions (see README).



import {
  GridIndex,
  bearingXY,
  distM,
  localProjection,
  simplifyRing,
  toDirection8,
  type Direction8,
  type LngLat,
  type Projection,
  type XY,
} from "./geo";
import { areaM2, fireHull, unionXY, type MultiXY } from "./hull";
import { PolygonIndex } from "./segments";
import type { Detection } from "./types";

export type LandCover = "bosque" | "arbustal" | "pastizal" | "cultivo" | "urbano" | "otro";
export type HotspotState = "nuevo" | "persistente" | "reactivado";
export type FireStatus = "activo" | "latente" | "extinguido" | "fusionado";

export interface TrackOptions {
  clusterM: number;
  /** reach for attaching new pixels to an existing fire, by fire land cover */
  connectM: Record<LandCover, number>;
  /** a sleeper fire only wakes up for pixels this close to it */
  sleeperConnectM: number;
  activeDays: number;
  sleeperDays: number;
  /** pixels within this distance of the previous perimeter are not "nuevo" */
  insideM: number;
  /** ...and are "reactivado" when nothing burned within reactivationM for this long */
  quietHours: number;
  reactivationM: number;
  /** pixels further than this outside the perimeter count as possible spot fires */
  spotM: number;
  frontM: number;
  fireLineM: number;
  landCover?: (lat: number, lng: number) => LandCover | undefined;
  defaultCover: LandCover;
}

export const FEDS_OPTIONS: TrackOptions = {
  clusterM: 700,
  connectM: { bosque: 5000, arbustal: 5000, pastizal: 1000, cultivo: 1000, urbano: 1000, otro: 1000 },
  sleeperConnectM: 1000,
  activeDays: 5,
  sleeperDays: 20,
  insideM: 375,
  quietHours: 48,
  reactivationM: 750,
  spotM: 1000,
  frontM: 200,
  fireLineM: 500,
  defaultCover: "otro",
};

export interface Pixel extends Detection {
  fire: number;
  step: number;
  state: HotspotState;
  /** on the active front after this step */
  front: boolean;
  /** cluster detached from the previous perimeter by more than spotM */
  spot?: boolean;
  /** metres outside the previous perimeter (0 = inside) */
  outsideM: number;
  cover?: LandCover;
}

export interface StepInfo {
  index: number;
  /** local solar date of the step and half: AM (night passes) or PM (day passes) */
  date: string;
  half: "AM" | "PM";
  t0: number;
  t1: number;
}

export interface FireStep {
  step: number;
  t0: number;
  t1: number;
  hull: LngLat[][][];
  fireLine: LngLat[][];
  areaHa: number;
  growthHa: number;
  perimeterKm: number;
  fireLineKm: number;
  pixels: number;
  newPixels: number;
  frpSum: number;
  frpMax: number;
  states: Record<HotspotState, number>;
  /** detached clusters this step (possible spot fires) */
  spots: number;
  /** furthest new pixel outside the previous perimeter, metres */
  maxOutsideM: number;
  /** area-weighted spread: growth / previous fire-line length / dt, m/h */
  rosAweMh: number | null;
  /** max perimeter advance / dt, m/h, and where it pointed */
  rosMaxMh: number | null;
  rosDirDeg: number | null;
  rosDir: Direction8 | null;
  rosAt: LngLat | null;
}

export type FireEventKind =
  | "ignicion"
  | "crecimiento"
  | "avance"
  | "salto"
  | "reactivacion"
  | "fusion"
  | "latente"
  | "extincion";

export interface FireEvent {
  kind: FireEventKind;
  t: number;
  step: number;
  at?: LngLat;
  value?: number;
  ref?: number;
}

export interface Fire {
  id: number;
  status: FireStatus;
  mergedInto?: number;
  absorbed: number[];
  ignition: { t: number; at: LngLat; sat: Detection["sat"] };
  lastT: number;
  cover: Partial<Record<LandCover, number>>;
  mainCover: LandCover;
  steps: FireStep[];
  events: FireEvent[];
}

export interface TrackResult {
  steps: StepInfo[];
  fires: Fire[];
  pixels: Pixel[];
  options: TrackOptions;
}

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

/** FEDS step: local solar 07:00-17:59 = that day's PM, 18:00-06:59 = next day's AM. */
export function stepOf(d: { t: number; lng: number }) {
  const solar = new Date(d.t + (d.lng / 15) * HOUR_MS);
  const h = solar.getUTCHours();
  const day = Math.floor(solar.getTime() / DAY_MS) + (h >= 18 ? 1 : 0);
  const half: "AM" | "PM" = h >= 7 && h < 18 ? "PM" : "AM";
  return { ordinal: day * 2 + (half === "PM" ? 1 : 0), day, half };
}

interface FireState {
  fire: Fire;
  proj: Projection;
  pixels: Pixel[];
  index: GridIndex<Pixel>;
  hull: MultiXY;
  hullIndex: PolygonIndex | null;
  areaHa: number;
  fireLineM: number;
  lastStepMid: number;
  coverCount: Map<LandCover, number>;
}

/** `until`: end of the observation window (defaults to the last detection). */
export function trackFires(detections: Detection[], opts: TrackOptions = FEDS_OPTIONS, until?: number): TrackResult {
  const sorted = [...detections].sort((a, b) => a.t - b.t);
  const refLat = sorted.length ? sorted[0].lat : 0;
  const byStep = new Map<number, Detection[]>();
  for (const d of sorted) {
    const { ordinal } = stepOf(d);
    const list = byStep.get(ordinal);
    if (list) list.push(d);
    else byStep.set(ordinal, [d]);
  }
  const ordinals = [...byStep.keys()].sort((a, b) => a - b);
  if (ordinals.length === 0) return { steps: [], fires: [], pixels: [], options: opts };

  // a continuous step axis, so quiet half-days still exist for the timeline
  const steps: StepInfo[] = [];
  const stepIndex = new Map<number, number>();
  for (let o = ordinals[0]; o <= ordinals.at(-1)!; o++) {
    const day = Math.floor(o / 2);
    const half = o % 2 ? "PM" : "AM";
    const dets = byStep.get(o) ?? [];
    stepIndex.set(o, steps.length);
    steps.push({
      index: steps.length,
      date: new Date(day * DAY_MS).toISOString().slice(0, 10),
      half,
      t0: dets.length ? dets[0].t : NaN,
      t1: dets.length ? dets.at(-1)!.t : NaN,
    });
  }

  const states = new Map<number, FireState>();
  const pixels: Pixel[] = [];
  let nextId = 1;
  const coverOf = (d: Detection) => opts.landCover?.(d.lat, d.lng);

  const live = () => [...states.values()].filter((s) => s.fire.status === "activo" || s.fire.status === "latente");

  for (const o of ordinals) {
    const step = stepIndex.get(o)!;
    const dets = byStep.get(o)!;
    const now = dets[0].t;

    for (const s of live()) {
      const quiet = now - s.fire.lastT;
      if (s.fire.status === "activo" && quiet > opts.activeDays * DAY_MS) {
        s.fire.status = "latente";
        s.fire.events.push({ kind: "latente", t: s.fire.lastT + opts.activeDays * DAY_MS, step });
      }
      if (quiet > opts.sleeperDays * DAY_MS) {
        s.fire.status = "extinguido";
        s.fire.events.push({ kind: "extincion", t: s.fire.lastT, step });
      }
    }

    // 1. connected components of this step's pixels at clusterM
    const grid = new GridIndex<Detection & { k: number }>(opts.clusterM, refLat);
    const items = dets.map((d, k) => ({ ...d, k }));
    items.forEach((it) => grid.add(it));
    const parent = items.map((_, k) => k);
    const find = (k: number): number => (parent[k] === k ? k : (parent[k] = find(parent[k])));
    for (const it of items)
      for (const nb of grid.near(it.lat, it.lng)) if (nb.k !== it.k) parent[find(it.k)] = find(nb.k);
    const clusters = new Map<number, Detection[]>();
    for (const it of items) {
      const root = find(it.k);
      const list = clusters.get(root);
      if (list) list.push(dets[it.k]);
      else clusters.set(root, [dets[it.k]]);
    }

    // 2. attach each cluster to the fires it reaches; merge when it reaches several
    const incoming = new Map<number, { dets: Detection[]; clusters: Detection[][]; wasSleeping: boolean; isNew: boolean }>();
    for (const cl of clusters.values()) {
      const reached = live().filter((s) => {
        const reach = s.fire.status === "latente" ? opts.sleeperConnectM : opts.connectM[s.fire.mainCover];
        return cl.some((d) => s.index.any(d.lat, d.lng, reach));
      });
      let target: FireState;
      let isNew = false;
      if (reached.length === 0) {
        const first = cl[0];
        const fire: Fire = {
          id: nextId++,
          status: "activo",
          absorbed: [],
          ignition: { t: first.t, at: [first.lng, first.lat], sat: first.sat },
          lastT: first.t,
          cover: {},
          mainCover: opts.defaultCover,
          steps: [],
          events: [{ kind: "ignicion", t: first.t, step, at: [first.lng, first.lat] }],
        };
        target = {
          fire,
          proj: localProjection(first.lat, first.lng),
          pixels: [],
          index: new GridIndex<Pixel>(1000, first.lat),
          hull: [],
          hullIndex: null,
          areaHa: 0,
          fireLineM: 0,
          lastStepMid: first.t,
          coverCount: new Map(),
        };
        states.set(fire.id, target);
        isNew = true;
      } else {
        reached.sort((a, b) => a.fire.id - b.fire.id);
        target = reached[0];
        for (const other of reached.slice(1)) {
          mergeInto(target, other, step, now);
          // pixels this step already routed to the absorbed fire follow it
          const moved = incoming.get(other.fire.id);
          if (moved) {
            incoming.delete(other.fire.id);
            const entry = incoming.get(target.fire.id);
            if (entry) {
              entry.dets.push(...moved.dets);
              entry.clusters.push(...moved.clusters);
            }
            else incoming.set(target.fire.id, { ...moved, isNew: false });
          }
        }
      }
      const entry = incoming.get(target.fire.id) ?? {
        dets: [],
        clusters: [],
        wasSleeping: target.fire.status === "latente",
        isNew,
      };
      entry.dets.push(...cl);
      entry.clusters.push(cl);
      incoming.set(target.fire.id, entry);
    }

    // 3. classify, grow the hull, measure
    for (const [id, { dets: fresh, clusters, wasSleeping, isNew }] of incoming) {
      const s = states.get(id)!;
      if (s.fire.status === "fusionado") continue; // absorbed later in this same step
      const prevIndex = s.hullIndex;
      const counts: Record<HotspotState, number> = { nuevo: 0, persistente: 0, reactivado: 0 };
      let maxOutsideM = 0;
      const added: Pixel[] = [];
      for (const d of fresh) {
        const xy = s.proj.toXY([d.lng, d.lat]);
        const outsideM = prevIndex && !prevIndex.empty ? prevIndex.distance(xy, 50_000) : 0;
        let state: HotspotState;
        if (isNew || (prevIndex && outsideM > opts.insideM)) state = "nuevo";
        else if (wasSleeping) state = "reactivado";
        else {
          const recent = s.index.any(d.lat, d.lng, opts.reactivationM, (p) => d.t - p.t <= opts.quietHours * HOUR_MS);
          state = recent ? "persistente" : "reactivado";
        }
        counts[state]++;
        if (Number.isFinite(outsideM)) maxOutsideM = Math.max(maxOutsideM, outsideM);
        const cover = coverOf(d);
        const px: Pixel = { ...d, fire: id, step, state, front: false, outsideM: Number.isFinite(outsideM) ? Math.round(outsideM) : 0, cover };
        added.push(px);
      }
      for (const px of added) {
        s.pixels.push(px);
        s.index.add(px);
        pixels.push(px);
        const c = px.cover ?? opts.defaultCover;
        s.coverCount.set(c, (s.coverCount.get(c) ?? 0) + 1);
      }
      if (wasSleeping) {
        s.fire.status = "activo";
        s.fire.events.push({ kind: "reactivacion", t: fresh[0].t, step, at: [fresh[0].lng, fresh[0].lat], value: added.length });
      }
      s.fire.lastT = Math.max(s.fire.lastT, fresh.at(-1)!.t);
      updateCover(s);

      const prevHull = s.hull;
      const prevArea = s.areaHa;
      const prevLine = s.fireLineM;
      s.hull = fireHull(
        s.pixels.map((p) => s.proj.toXY([p.lng, p.lat])),
        prevHull.length ? prevHull : null,
      );
      s.areaHa = areaM2(s.hull) / 10_000;
      const projected = s.hull;
      s.hullIndex = new PolygonIndex(projected);

      // front: new pixels hugging the new perimeter; fire line: perimeter near them
      const frontXY: XY[] = [];
      for (const px of added) {
        const xy = s.proj.toXY([px.lng, px.lat]);
        const near = s.hullIndex.nearest(xy, opts.frontM);
        if (near) {
          px.front = true;
          frontXY.push(xy);
        }
      }
      const { lines, lengthM } = fireLine(projected, frontXY, opts.fireLineM);
      s.fireLineM = lengthM;

      const mid = fresh.reduce((a, d) => a + d.t, 0) / fresh.length;
      const dtH = Math.max(1, (mid - s.lastStepMid) / HOUR_MS);
      const growthHa = s.areaHa - prevArea;
      const ros = !isNew && prevIndex && !prevIndex.empty ? maxAdvance(projected, prevIndex) : null;

      const fstep: FireStep = {
        step,
        t0: fresh[0].t,
        t1: fresh.at(-1)!.t,
        hull: toLngLatHull(s.hull, s.proj),
        fireLine: lines.map((l) => l.map((p) => s.proj.toLngLat(p))),
        areaHa: round(s.areaHa, 1),
        growthHa: round(growthHa, 1),
        perimeterKm: round(perimeterM(projected) / 1000, 2),
        fireLineKm: round(lengthM / 1000, 2),
        pixels: s.pixels.length,
        newPixels: added.length,
        frpSum: round(added.reduce((a, p) => a + p.frp, 0), 1),
        frpMax: round(Math.max(...added.map((p) => p.frp)), 1),
        states: counts,
        maxOutsideM: Math.round(maxOutsideM),
        spots: 0,
        rosAweMh: !isNew && prevLine > 0 ? round((growthHa * 10_000) / prevLine / dtH, 1) : null,
        rosMaxMh: ros ? round(ros.d / dtH, 1) : null,
        rosDirDeg: ros ? Math.round(ros.bearing) : null,
        rosDir: ros ? toDirection8(ros.bearing) : null,
        rosAt: ros ? s.proj.toLngLat(ros.at) : null,
      };
      s.fire.steps.push(fstep);
      s.lastStepMid = mid;

      // possible spot fire: a whole cluster detached from the previous
      // perimeter (a fast front stays connected to it, a spot does not)
      if (!isNew) {
        const byDet = new Map(fresh.map((d, k) => [d, added[k]]));
        let spot: Pixel | null = null;
        for (const cl of clusters) {
          const px = cl.map((d) => byDet.get(d)!);
          const closest = px.reduce((a, b) => (b.outsideM < a.outsideM ? b : a));
          if (closest.outsideM < opts.spotM) continue;
          for (const p of px) p.spot = true;
          fstep.spots++;
          if (!spot || closest.outsideM > spot.outsideM) spot = closest;
        }
        if (spot) s.fire.events.push({ kind: "salto", t: spot.t, step, at: [spot.lng, spot.lat], value: spot.outsideM });
      }
    }
  }

  const endT = Math.max(until ?? 0, sorted.at(-1)!.t);
  for (const s of states.values()) {
    if (s.fire.status === "fusionado") continue;
    const quiet = endT - s.fire.lastT;
    if (s.fire.status === "activo" && quiet > opts.activeDays * DAY_MS) {
      s.fire.status = "latente";
      s.fire.events.push({ kind: "latente", t: s.fire.lastT + opts.activeDays * DAY_MS, step: steps.length - 1 });
    }
    addGrowthEvents(s.fire);
  }
  for (const s of states.values()) s.fire.events.sort((a, b) => a.t - b.t);

  return { steps, fires: [...states.values()].map((s) => s.fire), pixels, options: opts };

  function mergeInto(target: FireState, other: FireState, step: number, t: number) {
    for (const px of other.pixels) {
      px.fire = target.fire.id;
      target.pixels.push(px);
      target.index.add(px);
    }
    for (const [c, n] of other.coverCount) target.coverCount.set(c, (target.coverCount.get(c) ?? 0) + n);
    other.pixels = [];
    // the absorbed burned area is not growth: fold it into the baseline
    if (other.hull.length) {
      // each fire has its own local projection: move the absorbed hull into ours
      const moved = other.hull.map((poly) =>
        poly.map((ring) => ring.map((p) => target.proj.toXY(other.proj.toLngLat(p)))),
      );
      target.hull = unionXY(target.hull, moved);
      target.areaHa = areaM2(target.hull) / 10_000;
      target.hullIndex = new PolygonIndex(target.hull);
    }
    target.fireLineM += other.fireLineM;
    other.fire.status = "fusionado";
    other.fire.mergedInto = target.fire.id;
    target.fire.absorbed.push(other.fire.id);
    target.fire.ignition = other.fire.ignition.t < target.fire.ignition.t ? other.fire.ignition : target.fire.ignition;
    target.fire.events.push({ kind: "fusion", t, step, ref: other.fire.id, at: other.fire.ignition.at });
    target.fire.lastT = Math.max(target.fire.lastT, other.fire.lastT);
    if (target.fire.status === "latente") target.fire.status = "activo";
  }

  function updateCover(s: FireState) {
    let total = 0;
    for (const n of s.coverCount.values()) total += n;
    let best: LandCover = opts.defaultCover;
    let bestN = -1;
    s.fire.cover = {};
    for (const [c, n] of s.coverCount) {
      s.fire.cover[c] = round(n / total, 3);
      if (n > bestN) [best, bestN] = [c, n];
    }
    s.fire.mainCover = best;
  }
}

/** Hull for output: simplified to ~15 m and rounded to ~1 m (5 decimals). */
function toLngLatHull(m: MultiXY, proj: Projection): LngLat[][][] {
  const r5 = (v: number) => Math.round(v * 1e5) / 1e5;
  return m.map((poly) =>
    poly
      .map((ring) => simplifyRing(ring, 15))
      .map((ring) => ring.map((p) => proj.toLngLat(p)).map(([x, y]) => [r5(x), r5(y)] as LngLat)),
  );
}

function perimeterM(polys: XY[][][]) {
  let m = 0;
  for (const poly of polys)
    for (const ring of poly)
      for (let i = 0; i < ring.length - 1; i++)
        m += Math.hypot(ring[i + 1][0] - ring[i][0], ring[i + 1][1] - ring[i][1]);
  return m;
}

/** Outer-ring stretches within maxM of any front pixel, as polylines. */
function fireLine(polys: XY[][][], front: XY[], maxM: number) {
  const lines: XY[][] = [];
  let lengthM = 0;
  if (!front.length) return { lines, lengthM };
  const grid = new Map<string, XY[]>();
  const key = (x: number, y: number) => `${Math.floor(x / maxM)}:${Math.floor(y / maxM)}`;
  for (const p of front) {
    const k = key(p[0], p[1]);
    const list = grid.get(k);
    if (list) list.push(p);
    else grid.set(k, [p]);
  }
  const near = (v: XY) => {
    const i = Math.floor(v[0] / maxM);
    const j = Math.floor(v[1] / maxM);
    for (let di = -1; di <= 1; di++)
      for (let dj = -1; dj <= 1; dj++)
        for (const p of grid.get(`${i + di}:${j + dj}`) ?? [])
          if (Math.hypot(p[0] - v[0], p[1] - v[1]) <= maxM) return true;
    return false;
  };
  for (const poly of polys) {
    const ring = poly[0];
    let cur: XY[] = [];
    for (let i = 0; i < ring.length; i++) {
      if (near(ring[i])) cur.push(ring[i]);
      else if (cur.length) {
        if (cur.length > 1) lines.push(cur);
        cur = [];
      }
    }
    if (cur.length > 1) lines.push(cur);
  }
  for (const l of lines)
    for (let i = 0; i < l.length - 1; i++) lengthM += Math.hypot(l[i + 1][0] - l[i][0], l[i + 1][1] - l[i][1]);
  return { lines, lengthM };
}

/** Largest distance a new-perimeter vertex sits outside the previous perimeter (Cardil et al. 2023). */
function maxAdvance(polys: XY[][][], prev: PolygonIndex) {
  let best: { d: number; at: XY; bearing: number } | null = null;
  for (const poly of polys)
    for (const v of poly[0]) {
      if (prev.contains(v)) continue;
      const n = prev.nearest(v, 60_000);
      if (n && (!best || n.d > best.d)) best = { d: n.d, at: v, bearing: bearingXY(n.q, v) };
    }
  return best && best.d > 0 ? best : null;
}

function addGrowthEvents(fire: Fire) {
  const growing = fire.steps.filter((s) => s.growthHa > 0);
  if (growing.length < 2) return;
  const sorted = [...growing].sort((a, b) => b.growthHa - a.growthHa);
  const median = sorted[Math.floor(sorted.length / 2)].growthHa;
  for (const s of sorted.slice(0, 3)) {
    if (s.growthHa < Math.max(200, median * 3)) break;
    fire.events.push({ kind: "crecimiento", t: s.t0, step: s.step, value: s.growthHa });
  }
  const fastest = fire.steps
    .filter((s) => s.rosMaxMh !== null)
    .sort((a, b) => b.rosMaxMh! - a.rosMaxMh!)[0];
  if (fastest?.rosAt)
    fire.events.push({ kind: "avance", t: fastest.t0, step: fastest.step, at: fastest.rosAt, value: fastest.rosMaxMh! });
}

const round = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d;

export { distM };
