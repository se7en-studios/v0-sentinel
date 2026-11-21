// Does our FWI tell dangerous days apart? Checks lib/admin/fwi.ts against real VIIRS detections,
// the way the flood observatory publishes its validation (docs/04_validacion_simulador.md there).
//
//   node --env-file=.env.local scripts/verify-fwi.mjs W,S,E,N START_DATE DAYS [label]
//   e.g. node --env-file=.env.local scripts/verify-fwi.mjs -72.5,-46,-69,-37 2025-01-01 59 patagonia
//
// The region is cut into 1° cells. For each cell and day: FWI from ERA5 (Open-Meteo archive, local noon,
// 30 days of warm-up) and the detections that fell in the cell that day. The table groups cell-days by
// FWI class. A useful index shows far more fire per cell-day in the high classes than in the low ones.
// ponytail: this verifies the index with observed weather (what it says on the day), not the 7-day
// forecast skill; detections count hotspots, not fires (one big fire = many). Read the ratios, not the
// absolute numbers. Writes docs/verificacion-fwi-<label>.md.
import fs from "node:fs";
import path from "node:path";
import { fwiDanger, fwiSeries } from "../lib/admin/fwi.ts";

const KEY = process.env.NASA_FIRMS_KEY;
const [bbox, startDate, daysArg, label = "region"] = process.argv.slice(2);
if (!KEY || !bbox || !startDate || !daysArg) {
  console.error("usage: node --env-file=.env.local scripts/verify-fwi.mjs W,S,E,N START_DATE DAYS [label]");
  process.exit(1);
}
const DAYS = Number(daysArg);
const WARMUP = 30;
const [W, S, E, N] = bbox.split(",").map(Number);
const CLASSES = ["Bajo", "Moderado", "Alto", "Muy alto", "Extremo"];
const addDays = (iso, n) => new Date(Date.parse(iso) + n * 86_400_000).toISOString().slice(0, 10);
const endDate = addDays(startDate, DAYS - 1);

async function get(url, as = "text", tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(60_000) });
      if (r.ok) return as === "json" ? await r.json() : await r.text();
    } catch {}
    await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
  }
  throw new Error(`failed: ${url.replace(KEY, "***")}`);
}

/** cell-day -> detections (nominal/high confidence, both VIIRS satellites, standard + near-real-time) */
async function loadDetections() {
  const seen = new Set();
  const counts = new Map();
  for (const sat of ["VIIRS_SNPP_SP", "VIIRS_NOAA20_SP", "VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT"]) {
    for (let d = 0; d < DAYS; d += 5) {
      const n = Math.min(5, DAYS - d);
      const csv = await get(
        `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${KEY}/${sat}/${bbox}/${n}/${addDays(startDate, d)}`,
      );
      const [head, ...rows] = csv.trim().split("\n");
      if (!head.startsWith("latitude")) continue; // product not available for these dates
      const col = Object.fromEntries(head.split(",").map((h, i) => [h, i]));
      for (const row of rows) {
        const c = row.split(",");
        if (!["n", "h"].includes(c[col.confidence])) continue;
        const k = `${sat.split("_")[1]}|${c[col.latitude]}|${c[col.longitude]}|${c[col.acq_date]}|${c[col.acq_time]}`;
        if (seen.has(k)) continue; // SP and NRT overlap
        seen.add(k);
        const cell = `${Math.floor(+c[col.latitude])}:${Math.floor(+c[col.longitude])}`;
        const key = `${cell}|${c[col.acq_date]}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }
  return counts;
}

/** daily FWI for one cell centre, keyed by date */
async function cellFwi(lat, lng) {
  const j = await get(
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}` +
      `&start_date=${addDays(startDate, -WARMUP)}&end_date=${endDate}` +
      "&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&timezone=auto",
    "json",
  );
  const h = j.hourly;
  const days = [];
  for (let d = 0; d * 24 + 23 < h.time.length; d++) {
    const i = d * 24 + 12;
    if ([h.temperature_2m[i], h.relative_humidity_2m[i], h.wind_speed_10m[i]].some((v) => v == null)) return null;
    let rain = 0;
    for (let k = d * 24; k < d * 24 + 24; k++) rain += h.precipitation[k] ?? 0;
    days.push({
      date: h.time[d * 24].slice(0, 10),
      weather: { temp: h.temperature_2m[i], rh: h.relative_humidity_2m[i], wind: h.wind_speed_10m[i], rain },
    });
  }
  const res = fwiSeries(days, lat);
  return new Map(days.map((d, i) => [d.date, res[i].fwi]));
}

const counts = await loadDetections();
const byClass = Object.fromEntries(CLASSES.map((c) => [c, { cellDays: 0, withFire: 0, detections: 0 }]));
let cells = 0;
for (let lat = Math.floor(S); lat < N; lat++) {
  for (let lng = Math.floor(W); lng < E; lng++) {
    const fwi = await cellFwi(lat + 0.5, lng + 0.5);
    if (!fwi) continue;
    cells++;
    for (let d = 0; d < DAYS; d++) {
      const date = addDays(startDate, d);
      const v = fwi.get(date);
      if (v === undefined) continue;
      const n = counts.get(`${lat}:${lng}|${date}`) ?? 0;
      const b = byClass[fwiDanger(v)];
      b.cellDays++;
      b.detections += n;
      if (n > 0) b.withFire++;
    }
  }
}

const rate = (b) => (b.cellDays ? b.detections / b.cellDays : 0);
const share = (b) => (b.cellDays ? b.withFire / b.cellDays : 0);
const low = byClass.Bajo;
const high = ["Muy alto", "Extremo"].reduce(
  (a, c) => ({
    cellDays: a.cellDays + byClass[c].cellDays,
    withFire: a.withFire + byClass[c].withFire,
    detections: a.detections + byClass[c].detections,
  }),
  { cellDays: 0, withFire: 0, detections: 0 },
);
const pct = (v) => `${(v * 100).toFixed(1)} %`;
const rows = CLASSES.map((c) => {
  const b = byClass[c];
  return `| ${c} | ${b.cellDays} | ${pct(share(b))} | ${rate(b).toFixed(2)} |`;
});
const ratio = share(low) > 0 ? (share(high) / share(low)).toFixed(1) : "∞";
const md = `# Verificación del FWI: ${label}

Región ${bbox} (W,S,E,N), del ${startDate} al ${endDate}, ${cells} celdas de 1°.
FWI calculado con ERA5 (Open-Meteo, mediodía local); focos VIIRS de confianza nominal y alta (NASA FIRMS).
Generado con \`scripts/verify-fwi.mjs\`.

| Clase FWI | Celda-días | Días con al menos un foco | Focos por celda-día |
|---|---|---|---|
${rows.join("\n")}

**Lectura:** en los días de peligro muy alto o extremo hubo al menos un foco en el ${pct(share(high))} de las celdas, contra
el ${pct(share(low))} en los días de peligro bajo (${ratio} veces más).

Límites: verifica el índice con el tiempo observado, no el pronóstico a 7 días; un incendio grande suma muchos focos; las
clases son las canadienses genéricas, sin calibrar para Argentina.
`;
const out = path.join(process.cwd(), "docs", `verificacion-fwi-${label}.md`);
fs.writeFileSync(out, md);
process.stdout.write(md);
