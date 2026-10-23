import circle from "@turf/circle";
import type { Incident } from "./incident";
import type { Feat } from "./types";

/** Radius of the zone the popup's "Crear zona acá" drops on a point. */
export const POPUP_ZONE_KM = 1;
/** An incident outline is convex and coarse: accept a point this far (deg) outside its box. */
const INCIDENT_PAD_DEG = 0.03;

export const mapsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;

export const coordText = (lat: number, lng: number) =>
  `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

/** A circular zone centred on the point, shaped like the ones the draw tool makes. */
export function zoneCircleAt(lat: number, lng: number, id: string): Feat {
  const c = circle([lng, lat], POPUP_ZONE_KM, {
    steps: 48,
    units: "kilometers",
  });
  return {
    id,
    type: "Feature",
    geometry: c.geometry,
    properties: { mode: "zone-circle", radiusKm: POPUP_ZONE_KM },
  };
}

/** Popup shortcut for "Crear zona acá": only exists when the map has a real handler (read-only maps have none). */
export function zoneCreator(
  onCreateZone: ((f: Feat) => void) | undefined,
  newId: () => string,
): ((lat: number, lng: number) => void) | undefined {
  if (!onCreateZone) return undefined;
  return (lat, lng) => onCreateZone(zoneCircleAt(lat, lng, newId()));
}

/** The incident whose latest outline (plus a margin) holds the point, if any; nearest centre wins. */
export function incidentContaining(
  incidents: Incident[],
  lat: number,
  lng: number,
): Incident | null {
  let best: Incident | null = null;
  let bestD = Infinity;
  for (const i of incidents) {
    const ring = i.hulls[i.hulls.length - 1]?.ring ?? [];
    if (!ring.length) continue;
    const xs = ring.map((p) => p[0]);
    const ys = ring.map((p) => p[1]);
    const inside =
      lng >= Math.min(...xs) - INCIDENT_PAD_DEG &&
      lng <= Math.max(...xs) + INCIDENT_PAD_DEG &&
      lat >= Math.min(...ys) - INCIDENT_PAD_DEG &&
      lat <= Math.max(...ys) + INCIDENT_PAD_DEG;
    const d = Math.hypot(i.lat - lat, i.lng - lng);
    if (inside && d < bestD) {
      best = i;
      bestD = d;
    }
  }
  return best;
}
