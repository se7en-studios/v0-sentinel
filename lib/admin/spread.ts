import type { Weather } from "./weather";

export const HORIZONS = [3, 6, 12, 24, 48] as const;

// ponytail: simplified wind-driven ellipse, NOT an operational fire model
// (no fuel, slope or moisture-of-extinction). Rate of spread grows with wind
// and dryness; the ellipse stretches downwind. Swap in a Rothermel/FARSITE
// service when there is fuel-map data per client.
export function spreadRingsKm(w: Pick<Weather, "wind" | "rh">, hours: number) {
  const rate =
    0.12 + 0.045 * w.wind * (1 - Math.min(100, Math.max(0, w.rh)) / 100); // km/h at the head
  const head = Math.max(0.4, rate * hours);
  const ratio = Math.min(4, 1 + w.wind / 15);
  return { head, back: head * 0.2, flank: head / ratio };
}

/** Closed ring of [lng, lat] for an ellipse starting at (lat,lng) drifting downwind. */
export function spreadPolygon(
  lat: number,
  lng: number,
  w: Pick<Weather, "wind" | "rh" | "windDir">,
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
