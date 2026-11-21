// Local FWI climatology for Argentina: what "high" means here, the way the flood observatory turns
// rainfall into local thresholds (90th/99th percentiles of 1991-2020 ERA5-Land, SMN method).
//
//   node scripts/build-fwi-climate.mjs            (resumable: cells are cached in the OS temp dir)
//   CACHED_ONLY=1 node scripts/build-fwi-climate.mjs   (rebuild the table from the cache, no downloads)
//
// 2° cells that touch Argentina; for each, ERA5 (Open-Meteo archive) local-noon weather 2019-2024 and
// the daily FWI from lib/admin/fwi.ts. Stores the 50/75/90/97th percentiles over the whole year and,
// per month, over a ±1 month window. Writes data/fwi-climate-ar.json (input of scripts/verify-fwi.mjs; the panel does not use it, see docs).
// ponytail: 6 years and ~220 km cells (Open-Meteo free tier: a 6-year call weighs ~60 of the 5000
// calls per hour, so the run is paced at one cell every PACE_MS and takes about 75 minutes). The Andes and the coast change
// within one cell. Upgrade: 0.5° cells and 30 years when there is a paid key or a CDS account.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { fwiSeries } from "../lib/admin/fwi.ts";

const CELL = 2;
const [W, S, E, N] = [-74, -56, -52, -21];
const START = "2019-01-01";
const END = "2024-12-31";
const PCTS = [0.5, 0.75, 0.9, 0.97];
const CACHE = path.join(os.tmpdir(), "fwi-climate-cache");
const OUT = path.join(process.cwd(), "data", "fwi-climate-ar.json");
fs.mkdirSync(CACHE, { recursive: true });

const outline = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "static", "argentina.json"), "utf8"));
/** the cell counts when any of a 5x5 set of points inside it is Argentine land */
const touches = (lat0, lng0) => {
  for (let a = 0; a < 5; a++)
    for (let b = 0; b < 5; b++)
      if (booleanPointInPolygon([lng0 + ((b + 0.5) * CELL) / 5, lat0 + ((a + 0.5) * CELL) / 5], outline)) return true;
  return false;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PACE_MS = 45_000;
async function archive(lat, lng) {
  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${START}&end_date=${END}` +
    "&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&timezone=auto";
  for (let i = 0; i < 8; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(120_000) });
      if (r.ok) return await r.json();
      // 429: the free tier counts long requests as many calls; wait for the minute/hour window
      process.stdout.write(`  ${r.status}, retrying in ${r.status === 429 ? 120 : 10} s\n`);
      await sleep(r.status === 429 ? 120_000 : 10_000);
    } catch {
      await sleep(10_000);
    }
  }
  throw new Error(`archive failed for ${lat},${lng}`);
}

/** daily FWI at the cell centre, cached */
async function dailyFwi(lat, lng) {
  const file = path.join(CACHE, `${lat}_${lng}.json`);
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"));
  const h = (await archive(lat, lng)).hourly;
  await sleep(PACE_MS); // stay under the hourly budget instead of bouncing off 429s
  const days = [];
  for (let d = 0; d * 24 + 23 < h.time.length; d++) {
    const i = d * 24 + 12;
    let rain = 0;
    for (let k = d * 24; k < d * 24 + 24; k++) rain += h.precipitation[k] ?? 0;
    days.push({
      date: h.time[d * 24].slice(0, 10),
      // ERA5 has no gaps; a null would mean a broken answer, so keep a neutral day rather than 0 °C / 0 %
      weather: {
        temp: h.temperature_2m[i] ?? 15,
        rh: h.relative_humidity_2m[i] ?? 50,
        wind: h.wind_speed_10m[i] ?? 0,
        rain,
      },
    });
  }
  const fwi = fwiSeries(days, lat).map((r) => Math.round(r.fwi * 10) / 10);
  const out = { dates: days.map((d) => d.date), fwi };
  fs.writeFileSync(file, JSON.stringify(out));
  return out;
}

const pct = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1))];
const breaks = (vals) => {
  const s = [...vals].sort((a, b) => a - b);
  return PCTS.map((p) => Math.round(pct(s, p) * 10) / 10);
};

// skip the first season: the moisture codes start from standard values (see fwiSeries)
const WARMUP_DAYS = 90;
const cells = {};
const todo = [];
for (let lat = S; lat < N; lat += CELL) for (let lng = W; lng < E; lng += CELL) if (touches(lat, lng)) todo.push([lat, lng]);
process.stdout.write(`${todo.length} cells\n`);
for (const [k, [lat, lng]] of todo.entries()) {
  if (process.env.CACHED_ONLY && !fs.existsSync(path.join(CACHE, `${lat + CELL / 2}_${lng + CELL / 2}.json`))) continue;
  const { dates, fwi } = await dailyFwi(lat + CELL / 2, lng + CELL / 2);
  const month = dates.map((d) => Number(d.slice(5, 7)));
  const keep = (pred) => fwi.filter((_, i) => i >= WARMUP_DAYS && pred(month[i]));
  const byMonth = Array.from({ length: 12 }, (_, m) => {
    const near = new Set([((m + 11) % 12) + 1, m + 1, ((m + 1) % 12) + 1]);
    return breaks(keep((mo) => near.has(mo)));
  });
  cells[`${lat}:${lng}`] = { year: breaks(keep(() => true)), month: byMonth };
  process.stdout.write(`${k + 1}/${todo.length} ${lat},${lng} p90=${cells[`${lat}:${lng}`].year[2]}\n`);
}

fs.writeFileSync(
  OUT,
  JSON.stringify({
    cell: CELL,
    origin: [W, S],
    pcts: PCTS,
    period: `${START}..${END}`,
    source: "ERA5 via Open-Meteo archive, FWI at local noon (lib/admin/fwi.ts)",
    cells,
  }),
);
process.stdout.write(`wrote ${OUT}\n`);
