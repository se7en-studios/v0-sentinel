import type { Weather } from "./weather";
import type { TerrainInfo } from "./terrain";

export const HORIZONS = [3, 6, 12, 24, 48] as const;

// ponytail: simplified wind-driven ellipse, NOT an operational fire model.
// Terrain (when known) scales the head rate with a fuel factor by land cover and a slope factor
// (Rothermel's slope term, simplified); moisture of extinction, fuel load and fire-induced wind
// are still missing. Ceiling: a coarse relative estimate, good for ranking and direction,
// not for predicting distances. Swap in a Rothermel/FARSITE service when there is per-client fuel data.
export type SpreadTerrain = Partial<
  Pick<TerrainInfo, "landCover" | "burnable" | "slopeDeg" | "aspectDeg">
>;
type Cond = Pick<Weather, "wind" | "rh"> &
  Partial<Pick<Weather, "temp" | "rain7d" | "windDir">> & {
    terrain?: SpreadTerrain | null;
  };

/**
 * Head-rate multiplier by ESA WorldCover class, relative to the model's untouched baseline (grass = 1).
 * Assumed values in the spirit of the Anderson fuel models: grass spreads fastest, shrub and crops
 * slower, forest litter slowest, bare ground or water barely carries fire. Not calibrated for Argentina.
 */
const FUEL_FACTOR: Record<number, number> = {
  30: 1, // pastizal
  20: 0.7, // arbustal
  40: 0.6, // cultivos
  10: 0.4, // bosque
  100: 0.4, // musgo y líquenes
  90: 0.3, // humedal
  95: 0.3, // manglar
};
const NON_BURNABLE_FACTOR = 0.1;
/** no land-cover tile: stay at the baseline instead of guessing */
export function fuelFactor(t: SpreadTerrain | null | undefined): number {
  if (!t || t.landCover == null) return 1;
  if (t.burnable === false) return NON_BURNABLE_FACTOR;
  return FUEL_FACTOR[t.landCover] ?? 1;
}

const SLOPE_COEF = 5.275 * 0.01 ** -0.3; // Rothermel phi_s = 5.275 * beta^-0.3 * tan(slope)^2, beta ~ 0.01
const SLOPE_MAX = 4;
const SLOPE_MIN = 0.5;
/**
 * Slope effect on the rate in the direction the wind pushes: up to 4x when blowing uphill on a steep slope,
 * down to 0.5x when blowing downhill. Needs the wind direction and the aspect (null on flat ground).
 */
export function slopeFactor(
  t: SpreadTerrain | null | undefined,
  windDir: number | undefined,
): number {
  if (!t || t.slopeDeg == null || t.aspectDeg == null || windDir == null)
    return 1;
  // aspect is the downhill direction and windDir where the wind comes FROM: both +180 give "toward"/"uphill"
  const alignment = Math.cos(((windDir - t.aspectDeg) * Math.PI) / 180);
  const tan = Math.tan((Math.min(60, Math.max(0, t.slopeDeg)) * Math.PI) / 180);
  const phi = SLOPE_COEF * tan * tan;
  return Math.min(SLOPE_MAX, Math.max(SLOPE_MIN, 1 + phi * alignment));
}

/** Head rate of spread in km/h: faster with wind, dryness and heat; damped by recent rain. */
export function spreadRate(w: Cond) {
  const dry = 1 - Math.min(100, Math.max(0, w.rh)) / 100;
  const heat = 1 + Math.max(0, (w.temp ?? 20) - 20) * 0.012; // +1.2 % per °C above 20
  const wet = 1 - Math.min(0.6, (w.rain7d ?? 0) / 40); // 40 mm in 7 days damps up to 60 %
  const terrain = fuelFactor(w.terrain) * slopeFactor(w.terrain, w.windDir);
  return (0.12 + 0.045 * w.wind * dry) * heat * wet * terrain;
}

export type SpreadLevel = "bajo" | "moderado" | "alto" | "extremo";

export function spreadLevel(rate: number): SpreadLevel {
  return rate < 0.5 ? "bajo" : rate < 1.2 ? "moderado" : rate < 2.5 ? "alto" : "extremo";
}

export function spreadRingsKm(w: Cond, hours: number) {
  const head = Math.max(0.4, spreadRate(w) * hours);
  const ratio = Math.min(4, 1 + w.wind / 15);
  return { head, back: head * 0.2, flank: head / ratio };
}

/** Closed ring of [lng, lat] for an ellipse starting at (lat,lng) drifting downwind. */
export function spreadPolygon(
  lat: number,
  lng: number,
  w: Cond & Pick<Weather, "windDir">,
  hours: number,
): [number, number][] {
  const { head, back, flank } = spreadRingsKm(w, hours);
  const a = (head + back) / 2;
  const shift = (head - back) / 2;
  const toward = (((w.windDir + 180) % 360) * Math.PI) / 180; // wind dir is where it blows FROM
  const kmLat = 110.574;
  const kmLng = 111.32 * Math.cos((lat * Math.PI) / 180);
  const ring: [number, number][] = [];
  for (let i = 0; i <= 48; i++) {
    const t = (i / 48) * Math.PI * 2;
    const u = a * Math.cos(t) + shift; // along wind
    const v = flank * Math.sin(t); // across wind
    const east = u * Math.sin(toward) + v * Math.cos(toward);
    const north = u * Math.cos(toward) - v * Math.sin(toward);
    ring.push([lng + east / kmLng, lat + north / kmLat]);
  }
  return ring;
}
