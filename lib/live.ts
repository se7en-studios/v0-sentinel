// Builds the live bundle: the same tracking engine as the forensic replay,
// run over the last days of near-real-time detections for all of Argentina.
// Pure (no fs / network): the API route and the snapshot script feed it.

import inside from "@turf/boolean-point-in-polygon";
import { FEDS_OPTIONS, trackFires, type LandCover } from "./engine/track";
import type { Detection } from "./engine/types";
import type { LngLat } from "./engine/geo";
import { COVERS, FLAG, SATS, STATES, type LiveAlert, type LiveBundle, type LiveFireMeta, type PackedPixel } from "./incident";
import { nearestPlace, placeLabel } from "./places";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const FOREST: LandCover[] = ["bosque", "arbustal"];

export interface LiveInput {
  detections: Detection[];
  /** end of the observation window (usually "now") */
  windowEnd: number;
  windowDays: number;
  sources: string[];
  origin: "api" | "snapshot";
  argentina: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
  landCover?: (lat: number, lng: number) => LandCover | undefined;
}

export function buildLive(input: LiveInput): LiveBundle {
  const { windowEnd } = input;
  const windowStart = windowEnd - input.windowDays * DAY;
  const dets = input.detections.filter(
    (d) => d.t >= windowStart && d.t <= windowEnd && inside([d.lng, d.lat], input.argentina),
  );
  const res = trackFires(dets, { ...FEDS_OPTIONS, landCover: input.landCover }, windowEnd);
  const fires = res.fires.filter((f) => f.status !== "fusionado");
  const t0 = dets.length ? Math.min(...dets.map((d) => d.t)) : windowStart;

  // every pixel from every satellite is kept: FEDS builds the hulls from all of them
  const pixels: PackedPixel[] = res.pixels.map((p) => [
    Math.round(p.lng * 1e5) / 1e5,
    Math.round(p.lat * 1e5) / 1e5,
    Math.round((p.t - t0) / 60_000),
    SATS.indexOf(p.sat),
    Math.round(p.frp * 10) / 10,
    STATES.indexOf(p.state),
    (p.front ? FLAG.front : 0) | (p.spot ? FLAG.spot : 0) | (p.day ? FLAG.day : 0),
    p.fire,
    p.step,
    p.cover ? COVERS.indexOf(p.cover) : -1,
  ]);

  const byFire = new Map<number, typeof res.pixels>();
  for (const p of res.pixels) {
    const list = byFire.get(p.fire);
    if (list) list.push(p);
    else byFire.set(p.fire, [p]);
  }

  const meta: LiveFireMeta[] = [];
  const alerts: LiveAlert[] = [];
  for (const f of fires) {
    const px = byFire.get(f.id) ?? [];
    if (!px.length) continue;
    let [w, s, e, n] = [Infinity, Infinity, -Infinity, -Infinity];
    let lat = 0;
    let lng = 0;
    for (const p of px) {
      w = Math.min(w, p.lng);
      e = Math.max(e, p.lng);
      s = Math.min(s, p.lat);
      n = Math.max(n, p.lat);
      lat += p.lat;
      lng += p.lng;
    }
    const center: LngLat = [lng / px.length, lat / px.length];
    const place = nearestPlace(center[1], center[0]);
    const forestShare = FOREST.reduce((sum, c) => sum + (f.cover[c] ?? 0), 0);
    const last = f.steps.at(-1)!;
    const before = [...f.steps].reverse().find((st) => st.t1 <= windowEnd - DAY);
    const quiet = windowEnd - f.lastT;
    const forestal = forestShare >= 0.5;
    meta.push({
      id: f.id,
      code: fireCode(f.ignition.t, f.ignition.at),
      name: placeLabel(center[1], center[0]),
      province: place.province,
      center: [round(center[0], 4), round(center[1], 4)],
      bbox: [round(w, 4), round(s, 4), round(e, 4), round(n, 4)],
      forestShare: round(forestShare, 3),
      forestal,
      activity: quiet <= DAY ? "ahora" : quiet <= 5 * DAY ? "activo" : quiet <= 20 * DAY ? "latente" : "extinguido",
      detections24h: px.filter((p) => p.t > windowEnd - DAY).length,
      growth24hHa: round(Math.max(0, last.areaHa - (before?.areaHa ?? 0)), 1),
      lastT: f.lastT,
    });

    // alerts: what a brigade would want pushed, from the last 48 h
    const recent = (t: number) => t > windowEnd - 2 * DAY;
    // a new forest fire only alerts once it holds: 3+ pixels in its first 24 h
    // (single-pixel ignitions are mostly short agricultural burns)
    const firstDay = px.filter((p) => p.t <= f.ignition.t + DAY).length;
    if (recent(f.ignition.t) && forestal && firstDay >= 3)
      alerts.push({ fire: f.id, kind: "nuevo", t: f.ignition.t, value: firstDay, at: f.ignition.at, forestal });
    for (const ev of f.events) {
      if (!recent(ev.t)) continue;
      if (ev.kind === "crecimiento" || ev.kind === "salto" || ev.kind === "reactivacion")
        alerts.push({ fire: f.id, kind: ev.kind, t: ev.t, value: ev.value, at: ev.at, forestal });
    }
    // rekindles inside the burned area: several "reactivado" pixels in one pass
    for (const st of f.steps) {
      if (!recent(st.t0) || st.states.reactivado < 3) continue;
      const r = px.find((p) => p.step === st.step && p.state === "reactivado");
      alerts.push({ fire: f.id, kind: "reactivacion", t: st.t0, value: st.states.reactivado, at: r ? [r.lng, r.lat] : undefined, forestal });
    }
  }
  alerts.sort((a, b) => b.t - a.t);

  // most relevant first: active forest fires, then by recent activity and size
  const rank = (m: LiveFireMeta) =>
    (m.activity === "ahora" ? 4 : m.activity === "activo" ? 2 : 0) + (m.forestal ? 3 : 0) + Math.log10(1 + (fires.find((f) => f.id === m.id)?.steps.at(-1)?.areaHa ?? 0));
  meta.sort((a, b) => rank(b) - rank(a));
  const featured = meta[0]?.id ?? fires[0]?.id ?? 0;

  return {
    id: "live-ar",
    name: "Argentina en vivo",
    place: "Argentina",
    region: [-74, -56, -52, -21],
    view: { center: [-64.5, -38.5], zoom: 3.6, pitch: 0, bearing: 0 },
    generated: new Date(windowEnd).toISOString(),
    method: {
      detecciones: `NASA FIRMS VIIRS 375 m casi tiempo real (${input.sources.join(" + ")}), últimos ${input.windowDays} días`,
      seguimiento: "Objetos de incendio estilo NASA FEDS (Chen et al. 2022): pasos de 12 h, agrupamiento 0,7 km, enganche 5 km en bosque/arbustal y 1 km en el resto",
      perimetro: "Forma alfa (radio < 1 km) + medio píxel (187,5 m), acumulada: nunca se achica",
      velocidad: "Avance máximo del perímetro entre pasos (Cardil et al. 2023) y avance medio por longitud de frente",
      estados: "Nuevo: fuera del perímetro anterior · Persistente: dentro, con calor en las últimas 48 h · Reactivado: dentro, sin calor cerca en 48 h",
      vegetacion: "ESA WorldCover 2021 muestreado a 1 km para todo el país",
      clima: "NASA POWER (reanálisis MERRA-2, ~50 km), horario, con ~2 días de demora",
      detectionCount: dets.length,
    },
    t0,
    steps: res.steps.map((st) => ({
      index: st.index,
      date: st.date,
      half: st.half,
      t0: Number.isFinite(st.t0) ? st.t0 : null,
      t1: Number.isFinite(st.t1) ? st.t1 : null,
    })),
    featured,
    fires: fires.map((f) => ({
      id: f.id,
      status: f.status,
      mergedInto: f.mergedInto,
      absorbed: f.absorbed,
      ignition: f.ignition,
      lastT: f.lastT,
      mainCover: f.mainCover,
      cover: f.cover,
      areaHa: f.steps.at(-1)?.areaHa ?? 0,
      events: f.events,
      steps: f.steps,
    })),
    pixels,
    live: { windowStart, windowEnd, sources: input.sources, origin: input.origin, meta, alerts },
  };
}

/** DDMM of the ignition (Argentina time) plus a 3-char hash of its ~1 km cell: the same fire keeps the label when the window slides */
export function fireCode(t: number, at: [number, number]): string {
  const d = new Date(t - 3 * 3_600_000);
  const day = `${String(d.getUTCDate()).padStart(2, "0")}${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const cell = Math.abs((Math.round(at[1] * 100) * 7919) ^ (Math.round(at[0] * 100) * 104729)) % 46656;
  return `${day}-${cell.toString(36).toUpperCase().padStart(3, "0")}`;
}

const round = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d;
