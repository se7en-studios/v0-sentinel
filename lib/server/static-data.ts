// Server-only loaders for the static inputs of the live mode (bundled with the
// API route through outputFileTracingIncludes in next.config.mjs).

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { coverSampler, type CoverRaster } from "../engine/landcover";

const STATIC = path.join(process.cwd(), "data", "static");

let cover: ReturnType<typeof coverSampler> | null = null;
let argentina: GeoJSON.Feature<GeoJSON.MultiPolygon> | null = null;

/** ESA WorldCover for all of Argentina at ~1 km (scripts/fetch-worldcover.ts, gzipped). */
export function nationalCover() {
  if (!cover) {
    const dir = path.join(STATIC, "worldcover-ar");
    const meta = JSON.parse(fs.readFileSync(path.join(dir, "worldcover.json"), "utf8"));
    const raster: CoverRaster = {
      bbox: meta.bbox,
      width: meta.width,
      height: meta.height,
      data: new Uint8Array(zlib.gunzipSync(fs.readFileSync(path.join(dir, "worldcover.bin.gz")))),
    };
    // at 1 km a 187.5 m radius is a single cell: plain nearest lookup
    cover = coverSampler(raster, 0);
  }
  return cover;
}

/** Argentina outline (from v0-sentinel's data/latam-countries.json). */
export function argentinaOutline() {
  if (!argentina) argentina = JSON.parse(fs.readFileSync(path.join(STATIC, "argentina.json"), "utf8"));
  return argentina!;
}
