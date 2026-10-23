import { translate, type Locale, type MsgKey } from "./i18n";

/** What the ground under a point looks like: fuel (land cover), elevation and slope. */
export interface TerrainInfo {
  /** ESA WorldCover class code, null when the tile is missing (sea, outside coverage) */
  landCover: number | null;
  landCoverLabel: string | null;
  /** false for water, snow, bare ground and built-up land: a "fire" there is rarely vegetation burning */
  burnable: boolean | null;
  elevation: number | null;
  slopeDeg: number | null;
  /** compass direction the ground faces (steepest descent), 0 = north */
  aspectDeg: number | null;
  aspectLabel: string | null;
}

/** ESA WorldCover v200 legend, in Spanish (the language the API answers in). */
const LAND_COVER: Record<number, { label: string; burnable: boolean }> = {
  10: { label: "Bosque", burnable: true },
  20: { label: "Arbustal", burnable: true },
  30: { label: "Pastizal", burnable: true },
  40: { label: "Cultivos", burnable: true },
  50: { label: "Zona urbana", burnable: false },
  60: { label: "Suelo desnudo o vegetación escasa", burnable: false },
  70: { label: "Nieve y hielo", burnable: false },
  80: { label: "Agua", burnable: false },
  90: { label: "Humedal", burnable: true },
  95: { label: "Manglar", burnable: true },
  100: { label: "Musgo y líquenes", burnable: true },
};

export const landCoverInfo = (code: number | null) =>
  code === null ? null : (LAND_COVER[code] ?? null);

const COMPASS = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
export const compassLabel = (deg: number) =>
  COMPASS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];

const M_PER_DEG = 111_320;

/** Bucket the WorldCover tile (3x3 degrees) and the Copernicus DEM tile (1x1 degree) hold a point in. */
export function tileNames(lat: number, lng: number) {
  const tag = (v: number, pos: string, neg: string, w: number) =>
    `${v < 0 ? neg : pos}${String(Math.abs(v)).padStart(w, "0")}`;
  const wcLat = Math.floor(lat / 3) * 3;
  const wcLng = Math.floor(lng / 3) * 3;
  const dLat = Math.floor(lat);
  const dLng = Math.floor(lng);
  const wc = `${tag(wcLat, "N", "S", 2)}${tag(wcLng, "E", "W", 3)}`;
  const dem = `Copernicus_DSM_COG_10_${tag(dLat, "N", "S", 2)}_00_${tag(dLng, "E", "W", 3)}_00_DEM`;
  return {
    worldCoverUrl: `https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_${wc}_Map.tif`,
    demUrl: `https://copernicus-dem-30m.s3.eu-central-1.amazonaws.com/${dem}/${dem}.tif`,
  };
}

/**
 * Slope and aspect from a 3x3 window of elevations (rows north to south), by Horn's method.
 * `res*` are the pixel sizes in degrees; the east-west one is scaled by latitude.
 */
export function slopeAspect(
  z: ArrayLike<number>,
  latDeg: number,
  resLng: number,
  resLat: number,
): { slopeDeg: number; aspectDeg: number } {
  const dx = Math.abs(resLng) * M_PER_DEG * Math.cos((latDeg * Math.PI) / 180);
  const dy = Math.abs(resLat) * M_PER_DEG;
  const [a, b, c, d, , f, g, h, i] = Array.from(z);
  const dzdx = (c + 2 * f + i - (a + 2 * d + g)) / (8 * dx);
  const dzdy = (g + 2 * h + i - (a + 2 * b + c)) / (8 * dy); // south minus north
  const slopeDeg = (Math.atan(Math.hypot(dzdx, dzdy)) * 180) / Math.PI;
  // steepest descent in (east, north) is (-dzdx, +dzdy)
  const aspect = (Math.atan2(-dzdx, dzdy) * 180) / Math.PI;
  return {
    slopeDeg: Math.round(slopeDeg * 10) / 10,
    aspectDeg: Math.round(((aspect % 360) + 360) % 360),
  };
}

/** Build the response from the raw raster reads; any of them may be missing. */
export function describeTerrain(
  code: number | null,
  elevation: number | null,
  slope: { slopeDeg: number; aspectDeg: number } | null,
): TerrainInfo {
  const lc = landCoverInfo(code);
  return {
    landCover: code,
    landCoverLabel: lc?.label ?? null,
    burnable: lc?.burnable ?? null,
    elevation: elevation === null ? null : Math.round(elevation),
    slopeDeg: slope?.slopeDeg ?? null,
    aspectDeg: slope && slope.slopeDeg >= 2 ? slope.aspectDeg : null,
    aspectLabel:
      slope && slope.slopeDeg >= 2 ? compassLabel(slope.aspectDeg) : null,
  };
}

/** One line for a popup or card, e.g. "Pastizal · 840 m · pendiente 12° hacia el SO" (Spanish unless `locale` says otherwise). */
export function terrainLine(t: TerrainInfo, locale: Locale = "es"): string {
  const tr = (key: MsgKey, vars?: Record<string, string | number>) =>
    translate(locale, key, vars);
  const num = locale === "en" ? "en-US" : locale === "pt" ? "pt-BR" : "es-AR";
  const parts: string[] = [];
  const cover =
    t.landCover !== null && t.landCover in LAND_COVER
      ? tr(`terr.lc.${t.landCover}` as MsgKey)
      : t.landCoverLabel;
  if (cover) parts.push(cover);
  if (t.elevation !== null) parts.push(`${t.elevation.toLocaleString(num)} m`);
  if (t.slopeDeg !== null)
    parts.push(
      t.aspectLabel
        ? tr("terr.slope", {
            n: Math.round(t.slopeDeg),
            dir: tr(`dir.${t.aspectLabel}` as MsgKey),
          })
        : tr("terr.flat"),
    );
  return parts.join(" · ");
}
