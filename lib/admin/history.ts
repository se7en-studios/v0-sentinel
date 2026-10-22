import { isModis } from "./fire-sources";
import type { FirePoint } from "./types";

// Annual burned area in Argentina. Only years with a figure we could trace
// are listed; 2021/2022/2025 are left out instead of estimated. Validate
// against the official SNMF (Servicio Nacional de Manejo del Fuego) reports
// before using these in a client deliverable.
export const BURNED_HISTORY = [
  {
    year: 2020,
    ha: 1_151_931,
    source: "MAyDS, citado por FARN",
    url: "https://farn.org.ar/wp-content/uploads/2021/07/DOC_ARGENTINA-INCENDIADA_links-1.pdf",
  },
  {
    year: 2023,
    ha: 500_821,
    source: "SNMF, vía prensa",
    url: "https://www.airedesantafe.com.ar/ambiente/radiografia-los-incendios-cuanta-superficie-se-quemo-2024-y-cuales-fueron-las-provincias-mas-afectadas-n608614",
  },
  {
    year: 2024,
    ha: 301_604,
    source: "SNMF, vía prensa",
    url: "https://www.airedesantafe.com.ar/ambiente/radiografia-los-incendios-cuanta-superficie-se-quemo-2024-y-cuales-fueron-las-provincias-mas-afectadas-n608614",
  },
];

// One VIIRS 375 m pixel covers ~14 ha: upper bound of area per detection.
export const HA_PER_DETECTION = 14.06;
// One MODIS pixel (Terra/Aqua, FirePoint code 2 or 3) covers ~1 km² = 100 ha.
export const HA_PER_MODIS_DETECTION = 100;

const VIIRS_CELL = 0.004; // ~440 m, wider than a 375 m pixel so the same pixel seen twice counts once
const MODIS_CELL = 0.01; // ~1.1 km

/**
 * Upper-bound burned area of a set of detections: each distinct pixel counts once, 14 ha for a VIIRS
 * pixel and 100 ha for a MODIS one. A MODIS pixel that already holds a VIIRS detection is not
 * added: VIIRS sees the same ground in finer detail, and both would double count it.
 */
export function detectionHectares(points: FirePoint[]): number {
  const viirs = new Set<string>();
  const viirsInModisCell = new Set<string>();
  const modis = new Set<string>();
  const cell = (p: FirePoint, size: number) =>
    `${Math.round(p[0] / size)}:${Math.round(p[1] / size)}`;
  for (const p of points) {
    if (isModis(p[7])) modis.add(cell(p, MODIS_CELL));
    else {
      viirs.add(cell(p, VIIRS_CELL));
      viirsInModisCell.add(cell(p, MODIS_CELL));
    }
  }
  let modisOnly = 0;
  for (const k of modis) if (!viirsInModisCell.has(k)) modisOnly++;
  return viirs.size * HA_PER_DETECTION + modisOnly * HA_PER_MODIS_DETECTION;
}
