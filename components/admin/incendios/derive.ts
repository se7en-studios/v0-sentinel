// Everything the map, panels and charts need, computed once from the bundle.

import { COVERS, FLAG, SATS, STATES, type IncidentBundle, type IncidentFire, type IncidentFireStep } from "@/lib/incident";
import { fmtDayTime } from "./format";

type FC = GeoJSON.FeatureCollection;

export interface ChartRow {
  step: number;
  t: number;
  label: string;
  areaHa: number | null;
  growthHa: number;
  rosMax: number | null;
  frp: number;
  nuevo: number;
  persistente: number;
  reactivado: number;
  temp: number | null;
  rh: number | null;
  wind: number | null;
}

export interface Derived {
  b: IncidentBundle;
  fire: IncidentFire;
  others: IncidentFire[];
  /** global step → featured fire step at or before it */
  fireStepAt: (IncidentFireStep | null)[];
  stepTime: number[];
  firstStep: number;
  lastStep: number;
  pixels: FC;
  isochrones: FC;
  perimeters: FC;
  fireLines: FC;
  arrows: FC;
  labels: FC;
  otherPerimeters: FC;
  rows: ChartRow[];
  weatherAt: (t: number) => { temp: number; rh: number; wind: number; dir: number; rain24: number } | null;
}

const HOUR = 3_600_000;

/** loc: BCP 47 tag for the labels baked into the chart rows and map data. */
export function derive(b: IncidentBundle, loc?: string): Derived {
  const fire = b.fires.find((f) => f.id === b.featured)!;
  const others = b.fires.filter((f) => f.id !== b.featured);

  // representative time per global step: mid of its detections, else interpolated
  const stepTime = b.steps.map((s, i) => {
    if (s.t0 !== null && s.t1 !== null) return (s.t0 + s.t1) / 2;
    const day = Date.parse(`${s.date}T00:00:00Z`);
    // FEDS AM ≈ 02:00 local solar, PM ≈ 14:00 (≈ +4.8 h to UTC at 71.5°W)
    return day + (s.half === "AM" ? 6.8 : 18.8) * HOUR + i * 0;
  });

  const byStep = new Map(fire.steps.map((s) => [s.step, s]));
  const fireStepAt: (IncidentFireStep | null)[] = [];
  let last: IncidentFireStep | null = null;
  for (let i = 0; i < b.steps.length; i++) {
    last = byStep.get(i) ?? last;
    fireStepAt.push(last);
  }
  const firstStep = fire.steps[0].step;
  const lastStep = fire.steps.at(-1)!.step;

  const pixels: FC = {
    type: "FeatureCollection",
    features: b.pixels.map(([lng, lat, min, sat, frp, state, flags, fid, step, cover]) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng, lat] },
      properties: {
        t: b.t0 + min * 60_000,
        sat: SATS[sat],
        frp,
        state: STATES[state],
        front: flags & FLAG.front ? 1 : 0,
        spot: flags & FLAG.spot ? 1 : 0,
        day: flags & FLAG.day ? 1 : 0,
        fire: fid,
        step,
        cover: cover >= 0 ? COVERS[cover] : "",
        main: fid === fire.id ? 1 : 0,
      },
    })),
  };

  const span = Math.max(1, lastStep - firstStep);
  const isochrones: FC = { type: "FeatureCollection", features: [] };
  const perimeters: FC = { type: "FeatureCollection", features: [] };
  const fireLines: FC = { type: "FeatureCollection", features: [] };
  const arrows: FC = { type: "FeatureCollection", features: [] };
  const labels: FC = { type: "FeatureCollection", features: [] };
  let prevMid = fire.ignition.t;
  for (const s of fire.steps) {
    if (!s.hull) continue;
    const k = (s.step - firstStep) / span;
    const mid = (s.t0 + s.t1) / 2;
    isochrones.features.push({
      type: "Feature",
      geometry: { type: "MultiLineString", coordinates: s.hull.map((poly) => poly[0]) },
      properties: { step: s.step, k, t: mid },
    });
    perimeters.features.push({
      type: "Feature",
      geometry: { type: "MultiPolygon", coordinates: s.hull },
      properties: { step: s.step },
    });
    if (s.fireLine?.length)
      fireLines.features.push({
        type: "Feature",
        geometry: { type: "MultiLineString", coordinates: s.fireLine },
        properties: { step: s.step },
      });
    if (s.rosAt && s.rosDirDeg !== null && s.rosMaxMh !== null && s.rosMaxMh >= 80) {
      // arrow ending at the furthest advance, as long as the advance itself (capped)
      const dtH = Math.max(1, (mid - prevMid) / HOUR);
      const lenM = Math.min(6000, Math.max(600, s.rosMaxMh * dtH));
      const rad = (s.rosDirDeg * Math.PI) / 180;
      const [lng, lat] = s.rosAt;
      const dLat = (Math.cos(rad) * lenM) / 110_574;
      const dLng = (Math.sin(rad) * lenM) / (111_320 * Math.cos((lat * Math.PI) / 180));
      arrows.features.push({
        type: "Feature",
        geometry: { type: "LineString", coordinates: [[lng - dLng, lat - dLat], [lng, lat]] },
        properties: { step: s.step, k, bearing: s.rosDirDeg, ros: s.rosMaxMh },
      });
    }
    if (s.growthHa >= 900 || s.step === firstStep)
      labels.features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: s.rosAt ?? fire.ignition.at },
        properties: { step: s.step, k, label: fmtDayTime(s.t0, loc) },
      });
    prevMid = mid;
  }

  const otherPerimeters: FC = {
    type: "FeatureCollection",
    features: others.flatMap((f) => {
      const s = [...f.steps].reverse().find((x) => x.hull);
      return s?.hull
        ? [{ type: "Feature" as const, geometry: { type: "MultiPolygon" as const, coordinates: s.hull }, properties: { fire: f.id, from: f.steps[0].step } }]
        : [];
    }),
  };

  const w = b.weather;
  const weatherAt = (t: number) => {
    if (!w) return null;
    const i = Math.round((t - w.t0) / HOUR);
    if (i < 0 || i >= w.temp.length || Number.isNaN(w.temp[i])) return null;
    let rain24 = 0;
    for (let j = Math.max(0, i - 23); j <= i; j++) rain24 += w.rainMm[j] || 0;
    return { temp: w.temp[i], rh: w.rh[i], wind: w.windKmh[i], dir: w.windDir[i], rain24: Math.round(rain24 * 10) / 10 };
  };

  const rows: ChartRow[] = b.steps.map((s, i) => {
    const own = byStep.get(i);
    const at = fireStepAt[i];
    const wx = weatherAt(stepTime[i]);
    return {
      step: i,
      t: stepTime[i],
      label: fmtDayTime(stepTime[i], loc),
      areaHa: i >= firstStep && at ? at.areaHa : null,
      growthHa: own?.growthHa ?? 0,
      rosMax: own?.rosMaxMh ?? null,
      frp: own?.frpSum ?? 0,
      nuevo: own?.states.nuevo ?? 0,
      persistente: own?.states.persistente ?? 0,
      reactivado: own?.states.reactivado ?? 0,
      temp: wx?.temp ?? null,
      rh: wx?.rh ?? null,
      wind: wx?.wind ?? null,
    };
  });

  return {
    b,
    fire,
    others,
    fireStepAt,
    stepTime,
    firstStep,
    lastStep,
    pixels,
    isochrones,
    perimeters,
    fireLines,
    arrows,
    labels,
    otherPerimeters,
    rows,
    weatherAt,
  };
}
