// Does our FWI tell dangerous days apart? Checks lib/admin/fwi.ts against real VIIRS detections,
// the way the flood observatory publishes its validation (docs/04_validacion_simulador.md there).
//
//   node --env-file=.env.local scripts/verify-fwi.mjs W,S,E,N START_DATE DAYS [label]
//   e.g. node --env-file=.env.local scripts/verify-fwi.mjs -72.5,-46,-69,-37 2025-01-01 59 patagonia
//
// The region is cut into 1° cells. For each cell and day: FWI from ERA5 (Open-Meteo archive, local noon,
// 30 days of warm-up) and the fire starts in the cell that day. Cell-days are grouped by FWI class under
// three criteria: the generic Canadian breaks and local percentiles (whole year, or ±1 month) from
// data/fwi-climate-ar.json (scripts/build-fwi-climate.mjs). The AUC says how well each one ranks
// days with a start above days without (0.5 = chance).
// ponytail: this verifies the index with observed weather (what it says on the day), not the 7-day
// forecast skill, and a start may be a farm burn. Writes docs/verificacion-fwi-<label>.md.
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

const NEW_KM = 5;
const NEW_DAYS = 5;
const kmApart = (a, b) =>
  Math.hypot((b.lat - a.lat) * 110.574, (b.lng - a.lng) * 111.32 * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180)));

/**
 * cell-day -> fire starts. A start is a detection (nominal/high confidence, both VIIRS satellites,
 * standard + near-real-time) with no earlier detection within NEW_KM in the previous NEW_DAYS, the
 * rule of scripts/backtest-spread.mjs. A danger index forecasts where fires begin, not how long a
 * big one keeps burning, so counting every hotspot would weigh one long fire as dozens of "fire days".
 */
async function loadStarts() {
  const seen = new Set();
  const pts = [];
  const from = addDays(startDate, -NEW_DAYS);
  const total = DAYS + NEW_DAYS;
  for (const sat of ["VIIRS_SNPP_SP", "VIIRS_NOAA20_SP", "VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT"]) {
    for (let d = 0; d < total; d += 5) {
      const n = Math.min(5, total - d);
      const csv = await get(
        `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${KEY}/${sat}/${bbox}/${n}/${addDays(from, d)}`,
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
        const hhmm = c[col.acq_time].padStart(4, "0");
        pts.push({
          lat: +c[col.latitude],
          lng: +c[col.longitude],
          date: c[col.acq_date],
          t: Date.parse(`${c[col.acq_date]}T${hhmm.slice(0, 2)}:${hhmm.slice(2)}:00Z`),
        });
      }
    }
  }
  pts.sort((a, b) => a.t - b.t);
  const G = 0.05; // ~5 km grid: a NEW_KM neighbour is in the same or an adjacent cell
  const grid = new Map();
  const starts = new Map();
  for (const p of pts) {
    const gi = Math.floor(p.lat / G);
    const gj = Math.floor(p.lng / G);
    let isNew = true;
    for (let a = -1; a <= 1 && isNew; a++)
      for (const q of [-1, 0, 1].flatMap((b) => grid.get(`${gi + a}:${gj + b}`) ?? []))
        if (p.t - q.t <= NEW_DAYS * 86_400_000 && kmApart(p, q) <= NEW_KM) {
          isNew = false;
          break;
        }
    (grid.get(`${gi}:${gj}`) ?? grid.set(`${gi}:${gj}`, []).get(`${gi}:${gj}`)).push(p);
    if (!isNew || p.date < startDate) continue;
    const key = `${Math.floor(p.lat)}:${Math.floor(p.lng)}|${p.date}`;
    starts.set(key, (starts.get(key) ?? 0) + 1);
  }
  return starts;
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

// ---- local classes (scripts/build-fwi-climate.mjs), same lookup as lib/admin/fwi-climate.ts ----
const climateFile = path.join(process.cwd(), "data", "fwi-climate-ar.json");
const climate = fs.existsSync(climateFile) ? JSON.parse(fs.readFileSync(climateFile, "utf8")) : null;
const localBreaks = (lat, lng, month, scheme) => {
  if (!climate) return null;
  const [w, s] = climate.origin;
  const c = climate.cell;
  const cell = climate.cells[`${s + Math.floor((lat - s) / c) * c}:${w + Math.floor((lng - w) / c) * c}`];
  const b = cell ? (scheme === "year" ? cell.year : cell.month[month - 1]) : null;
  return b ? b.map((v, i) => Math.max(v, FLOOR[i])) : null;
};
const FLOOR = [2.5, 5, 10, 15]; // absolute floor so always-wet cells (ice fields) do not read every dry day as Extremo
const classIndex = (fwi, b) => {
  const i = b.findIndex((v) => fwi < v);
  return i === -1 ? 4 : i;
};
const SCHEMES = {
  generic: { name: "Clases canadienses (actual)", cls: (v) => CLASSES.indexOf(fwiDanger(v)) },
  year: { name: "Percentiles locales del año", cls: (v, lat, lng, m) => { const b = localBreaks(lat, lng, m, "year"); return b ? classIndex(v, b) : null; } },
  month: { name: "Percentiles locales de la época (±1 mes)", cls: (v, lat, lng, m) => { const b = localBreaks(lat, lng, m, "month"); return b ? classIndex(v, b) : null; } },
};

const counts = await loadStarts();
const samples = []; // { cls: {scheme: idx}, fires }
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
      const m = Number(date.slice(5, 7));
      const cls = {};
      for (const [k, sc] of Object.entries(SCHEMES)) cls[k] = sc.cls(v, lat + 0.5, lng + 0.5, m);
      samples.push({ cls, fires: counts.get(`${lat}:${lng}|${date}`) ?? 0 });
    }
  }
}

/** probability that a cell-day with fire sits in a higher class than one without (ties count half) */
function auc(k) {
  const pos = Array(5).fill(0);
  const neg = Array(5).fill(0);
  for (const x of samples) if (x.cls[k] !== null) (x.fires > 0 ? pos : neg)[x.cls[k]]++;
  const P = pos.reduce((a, b) => a + b, 0);
  const Q = neg.reduce((a, b) => a + b, 0);
  let below = 0;
  let sum = 0;
  for (let c = 0; c < 5; c++) {
    sum += pos[c] * (below + neg[c] / 2);
    below += neg[c];
  }
  return P && Q ? sum / (P * Q) : NaN;
}
const pct = (v) => `${(v * 100).toFixed(1)} %`;
function table(k) {
  const rows = CLASSES.map((c, i) => {
    const xs = samples.filter((x) => x.cls[k] === i);
    const withFire = xs.filter((x) => x.fires > 0).length;
    const det = xs.reduce((a, x) => a + x.fires, 0);
    return `| ${c} | ${xs.length} | ${xs.length ? pct(withFire / xs.length) : "—"} | ${xs.length ? (det / xs.length).toFixed(2) : "—"} |`;
  });
  const used = samples.filter((x) => x.cls[k] !== null);
  const high = used.filter((x) => x.cls[k] >= 3);
  const low = used.filter((x) => x.cls[k] === 0);
  const share = (xs) => (xs.length ? xs.filter((x) => x.fires > 0).length / xs.length : 0);
  return {
    auc: auc(k),
    flagged: used.length ? high.length / used.length : 0,
    lift: share(low) ? share(high) / share(low) : Infinity,
    md: `### ${SCHEMES[k].name}

| Clase FWI | Celda-días | Días con al menos un inicio de fuego | Inicios por celda-día |
|---|---|---|---|
${rows.join("\n")}
`,
  };
}
const results = Object.fromEntries(Object.keys(SCHEMES).map((k) => [k, table(k)]));
const summary = Object.entries(results)
  .map(([k, r]) => `| ${SCHEMES[k].name} | ${r.auc.toFixed(3)} | ${pct(r.flagged)} | ${Number.isFinite(r.lift) ? r.lift.toFixed(1) : "∞"} |`)
  .join("\n");
const md = `# Verificación del FWI: ${label}

Región ${bbox} (W,S,E,N), del ${startDate} al ${endDate}, ${cells} celdas de 1°.
FWI calculado con ERA5 (Open-Meteo, mediodía local). Inicio de fuego: foco VIIRS de confianza nominal o alta (NASA FIRMS) sin otro foco a menos de 5 km en los 5 días previos.
Umbrales locales: \`data/fwi-climate-ar.json\` (${climate?.period ?? "no generado"}), fuera del período verificado.
Generado con \`scripts/verify-fwi.mjs\`.

| Criterio | AUC | Celda-días en muy alto o extremo | Veces más días con inicios (muy alto o extremo vs bajo) |
|---|---|---|---|
${summary}

AUC: probabilidad de que un día con un inicio de fuego quede en una clase más alta que un día sin fuego (0,5 = azar, 1 = perfecto).

${Object.values(results).map((r) => r.md).join("\n")}
Límites: verifica el índice con el tiempo observado, no el pronóstico a 7 días; un inicio puede ser una quema agrícola; las
celdas de los umbrales locales miden 2° (~220 km).
`;
const out = path.join(process.cwd(), "docs", `verificacion-fwi-${label}.md`);
fs.writeFileSync(out, md);
process.stdout.write(md);
