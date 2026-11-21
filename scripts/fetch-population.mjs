// Builds data/static/population-ar/ from WorldPop 2020 (1 km, UN-adjusted, CC BY 4.0):
// people per ~2.8 km cell (3x3 source pixels summed), Uint32 little-endian, gzipped.
// Run: node scripts/fetch-population.mjs   (downloads ~18 MB once, writes ~1 MB)
// ponytail: WorldPop 2020 is a modelled grid, not the 2022 census. Upgrade path: INDEC Censo 2022
// by radio censal (66.515 radios, see the flood observatory's ingesta/censo.py) rasterised the same way.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { fromFile } from "geotiff";

const URL =
  "https://data.worldpop.org/GIS/Population/Global_2000_2020_1km_UNadj/2020/ARG/arg_ppp_2020_1km_Aggregated_UNadj.tif";
const BLOCK = 3;
const OUT = path.join(process.cwd(), "data", "static", "population-ar");

const tmp = path.join(os.tmpdir(), "worldpop-arg-2020.tif");
if (!fs.existsSync(tmp)) {
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`WorldPop answered ${res.status}`);
  fs.writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
}

const image = await (await fromFile(tmp)).getImage();
const [west, south, east, north] = image.getBoundingBox();
const w = image.getWidth();
const h = image.getHeight();
const [src] = await image.readRasters();
const width = Math.ceil(w / BLOCK);
const height = Math.ceil(h / BLOCK);
const sums = new Float64Array(width * height);
let total = 0;
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const v = src[y * w + x];
    if (!(v > 0)) continue; // nodata is -99999
    sums[Math.floor(y / BLOCK) * width + Math.floor(x / BLOCK)] += v;
    total += v;
  }
}
const cells = Uint32Array.from(sums, (v) => Math.round(v));
const kept = cells.reduce((a, b) => a + b, 0);

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(
  path.join(OUT, "population.bin.gz"),
  zlib.gzipSync(Buffer.from(cells.buffer), { level: 9 }),
);
fs.writeFileSync(
  path.join(OUT, "population.json"),
  JSON.stringify(
    {
      // grid edges: the last row/column may extend past the source by up to BLOCK-1 pixels
      bbox: [west, north - height * BLOCK * ((north - south) / h), west + width * BLOCK * ((east - west) / w), north],
      width,
      height,
      total: Math.round(kept),
      source: "WorldPop 2020, 1 km, UN-adjusted (CC BY 4.0), summed to 3x3 cells",
    },
    null,
    2,
  ),
);
process.stdout.write(`${width}x${height} cells, ${Math.round(total)} people (kept ${kept})\n`);
