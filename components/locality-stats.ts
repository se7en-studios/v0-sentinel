import { PLACES } from "@/lib/places";
import type { FirePoint } from "@/lib/landing-data/firms";

/** [km al foco más cercano, focos en 50 km, focos en 100 km, hora UTC del más cercano]. */
export type LocalityStat = [number | null, number, number, string];

const RAD = Math.PI / 180;

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const h =
    Math.sin(((lat2 - lat1) * RAD) / 2) ** 2 +
    Math.cos(lat1 * RAD) *
      Math.cos(lat2 * RAD) *
      Math.sin(((lng2 - lng1) * RAD) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

// Se calcula en el servidor sobre TODOS los focos de las últimas 24 h (no solo
// los ~150 que dibuja el mapa) y viaja una tabla chica alineada con PLACES.
export function localityStats(fires: FirePoint[]): LocalityStat[] {
  return PLACES.map(([, , lat, lng]) => {
    let best: FirePoint | null = null;
    let bestKm = Infinity;
    let n50 = 0;
    let n100 = 0;
    for (const f of fires) {
      const km = haversineKm(lat, lng, f.lat, f.lng);
      if (km < bestKm) {
        bestKm = km;
        best = f;
      }
      if (km <= 100) n100++;
      if (km <= 50) n50++;
    }
    const t = best?.acqTime.padStart(4, "0") ?? "";
    const at = best ? `${best.acqDate} ${t.slice(0, 2)}:${t.slice(2)} UTC` : "";
    return [best ? Math.round(bestKm) : null, n50, n100, at];
  });
}
