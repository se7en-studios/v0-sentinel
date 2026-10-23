// Sample data for the presentation mode. Everything here is invented for illustration:
// the positions only need to look plausible on the map (a test checks they fall inside Argentina).

export interface SamplePoint {
  lon: number;
  lat: number;
}

/** Heat that stays after Sentinel's filter. */
export const FIRE_POINTS: readonly SamplePoint[] = [
  { lon: -71.4, lat: -41.9 },
  { lon: -71.2, lat: -42.3 },
  { lon: -71.6, lat: -41.2 },
  { lon: -71.3, lat: -40.6 },
  { lon: -64.6, lat: -31.4 },
  { lon: -64.3, lat: -31.9 },
  { lon: -60.8, lat: -25.9 },
  { lon: -61.2, lat: -26.4 },
  { lon: -59.9, lat: -26.1 },
  { lon: -59.1, lat: -32.6 },
  { lon: -58.7, lat: -33.1 },
  { lon: -54.9, lat: -26.9 },
  { lon: -68.9, lat: -35.4 },
];

/** Heat that is not a new fire (industrial sites, heat that is always there). */
export const NOISE_POINTS: readonly SamplePoint[] = [
  { lon: -62.3, lat: -38.7 },
  { lon: -68.4, lat: -38.6 },
  { lon: -60.7, lat: -32.9 },
  { lon: -67.5, lat: -45.8 },
  { lon: -65.2, lat: -26.8 },
];

/** Where the early alert of scene 3 appears. */
export const EARLY_POINT: SamplePoint = { lon: -71.3, lat: -41.6 };

/** Zone drawn by the "example zone" button of scene 4. */
export const ZONE_PRESET: SamplePoint = { lon: -64.5, lat: -31.6 };

/** Slightly irregular outline so the zone looks hand drawn (unit offsets around the center). */
export const ZONE_SHAPE: readonly [number, number][] = [
  [0, -1],
  [0.85, -0.55],
  [1, 0.2],
  [0.55, 0.9],
  [-0.4, 0.95],
  [-1, 0.3],
  [-0.8, -0.6],
];

export const INCIDENT_STAGES = ["new", "active", "controlled", "closed"] as const;
export type IncidentStage = (typeof INCIDENT_STAGES)[number];
