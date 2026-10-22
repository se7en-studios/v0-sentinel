import { fromUrl, type GeoTIFF } from "geotiff";
import {
  describeTerrain,
  slopeAspect,
  tileNames,
  type TerrainInfo,
} from "@/lib/admin/terrain";

const OPEN_TIMEOUT_MS = 12_000;
const READ_TIMEOUT_MS = 12_000;
const MISSING_TILE_MS = 10 * 60_000;
const POINT_CACHE_MAX = 500;

// A COG is opened once per server instance (header and tile index); each point then costs one tile read.
const tiffs = new Map<string, Promise<GeoTIFF | null>>();
const open = (url: string) => {
  let p = tiffs.get(url);
  if (!p) {
    p = fromUrl(url, {}, AbortSignal.timeout(OPEN_TIMEOUT_MS)).catch(
      () => null,
    );
    tiffs.set(url, p);
    // a tile that failed to open (ocean, outage) is asked again later, not on every click
    void p.then((t) => {
      if (!t) setTimeout(() => tiffs.delete(url), MISSING_TILE_MS).unref?.();
    });
  }
  return p;
};

/** Pixel window around a point, or null when the point is outside the raster. */
async function readWindow(url: string, lat: number, lng: number, half: number) {
  const tiff = await open(url);
  if (!tiff) return null;
  const img = await tiff.getImage();
  const [ox, oy] = img.getOrigin();
  const [rx, ry] = img.getResolution();
  const px = Math.floor((lng - ox) / rx);
  const py = Math.floor((lat - oy) / ry);
  const w = img.getWidth();
  const h = img.getHeight();
  if (px - half < 0 || py - half < 0 || px + half >= w || py + half >= h)
    return null;
  const rasters = await img.readRasters({
    window: [px - half, py - half, px + half + 1, py + half + 1],
    signal: AbortSignal.timeout(READ_TIMEOUT_MS),
  });
  return { values: (rasters as unknown as ArrayLike<number>[])[0], rx, ry };
}

const cache = new Map<string, TerrainInfo>();

/** Land cover (ESA WorldCover 10 m) and elevation/slope (Copernicus DEM GLO-30) under a point. */
export async function readTerrain(
  lat: number,
  lng: number,
): Promise<TerrainInfo> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const { worldCoverUrl, demUrl } = tileNames(lat, lng);
  const [cover, dem] = await Promise.all([
    readWindow(worldCoverUrl, lat, lng, 0).catch(() => null),
    readWindow(demUrl, lat, lng, 1).catch(() => null),
  ]);
  // WorldCover 0 is "no data"
  const code = cover && cover.values[0] > 0 ? cover.values[0] : null;
  const info = describeTerrain(
    code,
    dem ? dem.values[4] : null,
    dem ? slopeAspect(dem.values, lat, dem.rx, dem.ry) : null,
  );
  if (info.landCover !== null || info.elevation !== null) {
    if (cache.size >= POINT_CACHE_MAX) cache.delete(cache.keys().next().value!);
    cache.set(key, info);
  }
  return info;
}
