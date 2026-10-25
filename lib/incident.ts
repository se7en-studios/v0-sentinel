// Shape of the static incident bundle the UI loads (public/data/<id>/incident.json),
// written by scripts/build-incident.ts.

import type { Direction8, LngLat } from "./engine/geo";
import type { FireEventKind, FireStatus, HotspotState, LandCover } from "./engine/track";
import type { Satellite } from "./engine/types";

export const SATS: Satellite[] = ["N", "N20", "N21"];
export const STATES: HotspotState[] = ["nuevo", "persistente", "reactivado"];
export const COVERS: LandCover[] = ["bosque", "arbustal", "pastizal", "cultivo", "urbano", "otro"];

/** Pixel flags bitmask. */
export const FLAG = { front: 1, spot: 2, day: 4 } as const;

/**
 * One detection, packed: [lng, lat, minutes since t0, sat index, FRP MW,
 * state index, flags, fire id, step index, cover index (-1 = unknown)].
 */
export type PackedPixel = [number, number, number, number, number, number, number, number, number, number];

export interface IncidentStep {
  index: number;
  date: string;
  half: "AM" | "PM";
  /** ms, NaN-free: null when the step had no detections at all */
  t0: number | null;
  t1: number | null;
}

export interface IncidentFireStep {
  step: number;
  t0: number;
  t1: number;
  areaHa: number;
  growthHa: number;
  perimeterKm: number;
  fireLineKm: number;
  pixels: number;
  newPixels: number;
  frpSum: number;
  frpMax: number;
  states: Record<HotspotState, number>;
  spots: number;
  maxOutsideM: number;
  rosAweMh: number | null;
  rosMaxMh: number | null;
  rosDirDeg: number | null;
  rosDir: Direction8 | null;
  rosAt: LngLat | null;
  /** only stored for the featured fire, every step; other fires keep the last one */
  hull?: LngLat[][][];
  fireLine?: LngLat[][];
}

export interface IncidentFire {
  id: number;
  status: FireStatus;
  mergedInto?: number;
  absorbed: number[];
  ignition: { t: number; at: LngLat; sat: Satellite };
  lastT: number;
  mainCover: LandCover;
  cover: Partial<Record<LandCover, number>>;
  areaHa: number;
  steps: IncidentFireStep[];
  events: { kind: FireEventKind; t: number; step: number; at?: LngLat; value?: number; ref?: number }[];
}

export interface IncidentBundle {
  id: string;
  name: string;
  place: string;
  region: [number, number, number, number];
  view: { center: LngLat; zoom: number; pitch: number; bearing: number };
  /** documented facts, only for reconstructed past incidents */
  official?: {
    start: string;
    controlled: string;
    areaHa: number;
    areaSource: string;
    cause: string;
    impact: string;
    notes: string[];
    sources: { label: string; url: string }[];
  };
  generated: string;
  method: Record<string, string | number>;
  t0: number;
  steps: IncidentStep[];
  featured: number;
  fires: IncidentFire[];
  pixels: PackedPixel[];
  /** hourly weather at the featured fire; live bundles load it per fire on demand */
  weather?: {
    source: string;
    at: LngLat;
    /** first hour, ms UTC; one value per hour after */
    t0: number;
    temp: number[];
    rh: number[];
    windKmh: number[];
    windDir: number[];
    rainMm: number[];
  };
}

// ---- live mode (scripts/build-live.ts, app/api/live) ----

export type LiveActivity = "ahora" | "activo" | "latente" | "extinguido";

export interface LiveFireMeta {
  id: number;
  /** stable label from the ignition date and place ("1018-K7F"); `id` is a counter that changes as the window slides */
  code: string;
  /** "a 12 km de El Bolsón (Río Negro)" */
  name: string;
  province: string;
  center: LngLat;
  /** west, south, east, north */
  bbox: [number, number, number, number];
  /** share of pixels on forest or shrubland (ESA WorldCover) */
  forestShare: number;
  forestal: boolean;
  activity: LiveActivity;
  detections24h: number;
  growth24hHa: number;
  lastT: number;
}

export type LiveAlertKind = "nuevo" | "crecimiento" | "salto" | "reactivacion";

export interface LiveAlert {
  fire: number;
  kind: LiveAlertKind;
  t: number;
  value?: number;
  at?: LngLat;
  forestal: boolean;
}

export interface LiveBundle extends IncidentBundle {
  live: {
    windowStart: number;
    windowEnd: number;
    sources: string[];
    /** "api" = fetched now, "snapshot" = the committed fallback */
    origin: "api" | "snapshot";
    meta: LiveFireMeta[];
    alerts: LiveAlert[];
  };
}
