// Backtest of lib/admin/spread.ts against real VIIRS detections.
//
//   node --env-file=.env.local scripts/backtest-spread.mjs W,S,E,N START_DATE DAYS [label]
//   e.g. node --env-file=.env.local scripts/backtest-spread.mjs -72.5,-46,-69,-37 2025-01-10 40 patagonia
//
// An "event" starts at a detection with no other detection within 5 km in the previous 5 days. Its observed
// footprint is every detection chained to it (3 km links) in the next 6/12/24/48 h. We compare the farthest
// chained detection (observed head) with the model's head ring, and the bearing of that detection with the
// downwind bearing. Weather: Open-Meteo archive at the origin, averaged over the horizon.
// ponytail: satellite overpasses are 4-8 per day (SNPP + NOAA-20), so short horizons are coarse and the
// "origin" is the first detection, not the ignition: read the medians, not single events.
import { spreadRingsKm } from "../lib/admin/spread.ts";

const KEY = process.env.NASA_FIRMS_KEY;
const [bbox, startDate, daysArg, label = "region"] = process.argv.slice(2);
if (!KEY || !bbox || !startDate || !daysArg) {
  console.error("usage: node --env-file=.env.local scripts/backtest-spread.mjs W,S,E,N START_DATE DAYS [label]");
  process.exit(1);
}
const DAYS = Number(daysArg);
const WARMUP_DAYS = 5;
const HORIZONS = [6, 12, 24, 48];
const LINK_KM = 3;
const QUIET_KM = 5;
const MIN_CHAIN = 10; // detections at 48 h for the event to count as a real fire (not a burn pile)
const HOUR = 3_600_000;

const addDays = (iso, n) => new Date(Date.parse(iso) + n * 86_400_000).toISOString().slice(0, 10);
const rad = (d) => (d * Math.PI) / 180;
const km = (a, b) => {
  const dy = (b.lat - a.lat) * 110.574;
  const dx = (b.lng - a.lng) * 111.32 * Math.cos(rad((a.lat + b.lat) / 2));
  return Math.hypot(dx, dy);
};
const bearing = (a, b) => {
  const dy = (b.lat - a.lat) * 110.574;
  const dx = (b.lng - a.lng) * 111.32 * Math.cos(rad((a.lat + b.lat) / 2));
  return ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
};
const angDiff = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor((s.length - 1) / 2)] : NaN;
};
const quart = (xs, q) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor((s.length - 1) * q)] : NaN;
};

async function getText(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (r.ok) return await r.text();
    } catch {}
    await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
  }
  throw new Error(`failed: ${url.replace(KEY, "***")}`);
}

async function loadDetections() {
  const out = [];
  const from = addDays(startDate, -WARMUP_DAYS);
  const total = DAYS + WARMUP_DAYS;
  for (const sat of ["VIIRS_SNPP_SP", "VIIRS_NOAA20_SP"]) {
    for (let d = 0; d < total; d += 5) {
      const n = Math.min(5, total - d);
      const csv = await getText(
        `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${KEY}/${sat}/${bbox}/${n}/${addDays(from, d)}`,
      );
      const [head, ...rows] = csv.trim().split("\n");
      if (!head.startsWith("latitude")) throw new Error(`FIRMS: ${csv.slice(0, 120)}`);
      const col = Object.fromEntries(head.split(",").map((h, i) => [h, i]));
      for (const row of rows) {
        const c = row.split(",");
        if (!["n", "h"].includes(c[col.confidence])) continue;
        const hhmm = c[col.acq_time].padStart(4, "0");
        out.push({
          lat: +c[col.latitude],
          lng: +c[col.longitude],
          t: Date.parse(`${c[col.acq_date]}T${hhmm.slice(0, 2)}:${hhmm.slice(2)}:00Z`),
        });
      }
    }
  }
  out.sort((a, b) => a.t - b.t);
  return out;
}

// ---- spatial index (0.03 deg cells ~ 3.3 km) ----
const CELL = 0.03;
const cellOf = (p) => `${Math.floor(p.lat / CELL)}:${Math.floor(p.lng / CELL)}`;
function buildIndex(pts) {
  const m = new Map();
  pts.forEach((p, i) => {
    const k = cellOf(p);
    (m.get(k) ?? m.set(k, []).get(k)).push(i);
  });
  return m;
}
function near(pts, idx, p, radiusKm) {
  const r = Math.ceil(radiusKm / 3.3) + 1;
  const ci = Math.floor(p.lat / CELL);
  const cj = Math.floor(p.lng / CELL);
  const out = [];
  for (let i = -r; i <= r; i++)
    for (let j = -r; j <= r; j++)
      for (const n of idx.get(`${ci + i}:${cj + j}`) ?? []) if (km(p, pts[n]) <= radiusKm) out.push(n);
  return out;
}

function findEvents(pts, idx, endT) {
  const claimed = new Set();
  const events = [];
  const startT = Date.parse(startDate);
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (p.t < startT || p.t > endT - 48 * HOUR - 6 * HOUR) continue;
    if (claimed.has(i)) continue;
    if (near(pts, idx, p, QUIET_KM).some((n) => n !== i && pts[n].t < p.t && pts[n].t >= p.t - 5 * 86_400_000)) continue;
    // chain growth (BFS) within 48 h
    const chain = [i];
    const seen = new Set([i]);
    for (let q = 0; q < chain.length; q++) {
      for (const n of near(pts, idx, pts[chain[q]], LINK_KM)) {
        if (seen.has(n) || pts[n].t < p.t || pts[n].t > p.t + 48 * HOUR) continue;
        seen.add(n);
        chain.push(n);
      }
    }
    chain.forEach((n) => claimed.add(n));
    if (chain.length < MIN_CHAIN) continue;
    const early = chain.map((n) => pts[n]).filter((q) => q.t <= p.t + 6 * HOUR);
    const origin = {
      lat: early.reduce((a, q) => a + q.lat, 0) / early.length,
      lng: early.reduce((a, q) => a + q.lng, 0) / early.length,
    };
    events.push({ t0: p.t, origin, members: chain.map((n) => pts[n]) });
  }
  return events;
}

async function weatherFor(ev) {
  const day0 = new Date(ev.t0).toISOString().slice(0, 10);
  const day1 = new Date(ev.t0 + 48 * HOUR).toISOString().slice(0, 10);
  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${ev.origin.lat.toFixed(3)}&longitude=${ev.origin.lng.toFixed(3)}` +
    `&start_date=${addDays(day0, -7)}&end_date=${day1}&timezone=UTC` +
    "&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation";
  return JSON.parse(await getText(url));
}

/** conditions averaged over [t0, t0+h]; wind direction is the speed-weighted vector mean */
function conditions(w, ev, h) {
  const times = w.hourly.time.map((s) => Date.parse(`${s}:00Z`));
  const pick = (a, b) => times.map((t, i) => (t >= a && t <= b ? i : -1)).filter((i) => i >= 0);
  const win = pick(ev.t0, ev.t0 + h * HOUR);
  const avg = (arr, ix) => ix.reduce((s, i) => s + (arr[i] ?? 0), 0) / Math.max(1, ix.length);
  let ex = 0;
  let ny = 0;
  for (const i of win) {
    const sp = w.hourly.wind_speed_10m[i] ?? 0;
    ex += sp * Math.sin(rad(w.hourly.wind_direction_10m[i] ?? 0));
    ny += sp * Math.cos(rad(w.hourly.wind_direction_10m[i] ?? 0));
  }
  const rain = pick(ev.t0 - 7 * 86_400_000, ev.t0).reduce((s, i) => s + (w.hourly.precipitation[i] ?? 0), 0);
  return {
    wind: avg(w.hourly.wind_speed_10m, win),
    windDir: ((Math.atan2(ex, ny) * 180) / Math.PI + 360) % 360,
    rh: avg(w.hourly.relative_humidity_2m, win),
    temp: avg(w.hourly.temperature_2m, win),
    rain7d: rain,
  };
}

async function main() {
  const endT = Date.parse(startDate) + DAYS * 86_400_000;
  console.error(`[${label}] downloading VIIRS (SNPP + NOAA-20) ${startDate} +${DAYS}d ...`);
  const pts = await loadDetections();
  console.error(`[${label}] ${pts.length} detections`);
  const idx = buildIndex(pts);
  const events = findEvents(pts, idx, endT);
  console.error(`[${label}] ${events.length} fire events (>= ${MIN_CHAIN} chained detections at 48 h)`);

  const rows = [];
  for (const ev of events) {
    let w;
    try {
      w = await weatherFor(ev);
    } catch {
      continue;
    }
    for (const h of HORIZONS) {
      const obs = ev.members.filter((m) => m.t <= ev.t0 + h * HOUR);
      const far = obs.reduce((b, m) => (km(ev.origin, m) > km(ev.origin, b) ? m : b), obs[0]);
      const observed = km(ev.origin, far);
      if (observed < 0.5) continue; // inside the origin's own pixel footprint
      const c = conditions(w, ev, h);
      const pred = spreadRingsKm(c, h).head;
      const toward = (c.windDir + 180) % 360;
      rows.push({
        h,
        observed,
        pred,
        ratio: observed / pred,
        dir: angDiff(bearing(ev.origin, far), toward),
        wind: c.wind,
        size: ev.members.length,
      });
    }
  }

  console.log(`\n=== ${label}  ${startDate} +${DAYS}d  eventos: ${events.length} ===`);
  console.log("horizonte | n  | obs/modelo (mediana, p25-p75) | error de rumbo mediano | % dentro de 45° | modelo medio km | observado medio km");
  for (const h of HORIZONS) {
    const r = rows.filter((x) => x.h === h);
    if (!r.length) continue;
    const ratios = r.map((x) => x.ratio);
    const within = (r.filter((x) => x.dir <= 45).length / r.length) * 100;
    const avg = (k) => r.reduce((s, x) => s + x[k], 0) / r.length;
    console.log(
      `${String(h).padStart(7)} h | ${String(r.length).padStart(2)} | ${median(ratios).toFixed(2)} (${quart(ratios, 0.25).toFixed(2)}-${quart(ratios, 0.75).toFixed(2)})`.padEnd(52) +
        ` | ${median(r.map((x) => x.dir)).toFixed(0)}°`.padEnd(26) +
        ` | ${within.toFixed(0)}%`.padEnd(17) +
        ` | ${avg("pred").toFixed(1)}`.padEnd(18) +
        ` | ${avg("observed").toFixed(1)}`,
    );
  }
  // multipliers over the model's head ring: what the typical / maximum rings are fitted from
  const BIG = 40; // detections chained at 48 h: a fire that matters, not a field burn
  const q = (r, p) => quart(r.map((x) => x.ratio), p);
  const mult = {};
  console.log(`\nmultiplicador sobre el anillo lineal (todos | grandes >= ${BIG} focos):`);
  for (const h of HORIZONS) {
    const all = rows.filter((x) => x.h === h);
    const big = all.filter((x) => x.size >= BIG);
    if (!all.length) continue;
    mult[h] = { n: all.length, p50: q(all, 0.5), p90: q(all, 0.9), nBig: big.length, bigP50: q(big, 0.5), bigP90: q(big, 0.9) };
    const f = (v) => (Number.isNaN(v) ? " -  " : v.toFixed(2));
    console.log(`  ${String(h).padStart(2)} h  p50 ${f(mult[h].p50)}  p90 ${f(mult[h].p90)}  | grandes n=${big.length} p50 ${f(mult[h].bigP50)}  p90 ${f(mult[h].bigP90)}`);
  }
  console.log("\nJSON " + JSON.stringify({ label, startDate, days: DAYS, events: events.length, mult }));
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
