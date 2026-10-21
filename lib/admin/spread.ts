import type { Weather } from "./weather";

export const HORIZONS = [3, 6, 12, 24, 48] as const;

// ponytail: simplified wind-driven ellipse, NOT an operational fire model
// (no fuel, slope or moisture-of-extinction). Rate of spread grows with wind
// and dryness; the ellipse stretches downwind. Swap in a Rothermel/FARSITE
// service when there is fuel-map data per client.
type Cond = Pick<Weather, "wind" | "rh"> & Partial<Pick<Weather, "temp" | "rain7d">>;

/** Head rate of spread in km/h: faster with wind, dryness and heat; damped by recent rain. */
export function spreadRate(w: Cond) {
  const dry = 1 - Math.min(100, Math.max(0, w.rh)) / 100;
  const heat = 1 + Math.max(0, (w.temp ?? 20) - 20) * 0.012; // +1.2 % per °C above 20
  const wet = 1 - Math.min(0.6, (w.rain7d ?? 0) / 40); // 40 mm in 7 days damps up to 60 %
  return (0.12 + 0.045 * w.wind * dry) * heat * wet;
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
