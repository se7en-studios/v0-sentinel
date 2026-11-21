// FWI odds from the ECMWF ensemble (51 members via Open-Meteo, free, no key). Each member is
// one plausible week of weather; running the FWI on every member turns a single number into
// "how many of the 51 futures are dangerous". Same idea as the flood observatory's rainfall
// probability (ECMWF ensemble vs local thresholds), applied to fire weather.

import { fwiSeries, type FwiState } from "./fwi";

/** FWI from which a day counts as dangerous (Muy alto and above, same break as the forecast view). */
export const FWI_DANGER = 20;
/** Below this many usable members the spread is noise: report nothing. */
const MIN_MEMBERS = 10;
const NOON = 12;
const HOURS = 24;

export interface FwiOdds {
  /** share of members with FWI >= FWI_DANGER, 0..1 */
  pDanger: number;
  /** 10th, 50th and 90th percentile of the members' FWI */
  p10: number;
  p50: number;
  p90: number;
  /** usable members behind the numbers */
  members: number;
}

type Series = (number | null)[];
export interface EnsemblePayload {
  hourly?: Record<string, Series | string[]> & { time?: string[] };
}

const VARS = [
  "temperature_2m",
  "relative_humidity_2m",
  "wind_speed_10m",
  "precipitation",
] as const;

/** Member suffixes present in the payload: "" (control run) plus "_member01".."_memberNN". */
function memberSuffixes(h: Record<string, unknown>): string[] {
  const out: string[] = [];
  for (const k of Object.keys(h)) {
    if (k === "temperature_2m") out.push("");
    const m = /^temperature_2m(_member\d+)$/.exec(k);
    if (m) out.push(m[1]);
  }
  return out;
}

const isNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

/** nearest-rank percentile of an ascending array */
const pct = (sorted: number[], p: number) =>
  sorted[
    Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1))
  ];

const round1 = (v: number) => Math.round(v * 10) / 10;

/**
 * FWI odds per forecast day, keyed by ISO date. `start` is the moisture state entering the first
 * ensemble day (taken from the deterministic history run, so every member starts from the same,
 * observed dryness). A member missing any noon value is dropped rather than filled in.
 */
export function ensembleOdds(
  payload: EnsemblePayload,
  start: FwiState,
  lat: number,
): Map<string, FwiOdds> {
  const out = new Map<string, FwiOdds>();
  const h = payload.hourly;
  const time = h?.time;
  if (!h || !Array.isArray(time) || time.length < HOURS) return out;
  const days = Math.floor(time.length / HOURS);
  const dates = Array.from({ length: days }, (_, d) =>
    String(time[d * HOURS]).slice(0, 10),
  );
  const perDay: number[][] = dates.map(() => []);

  for (const sfx of memberSuffixes(h)) {
    const s = Object.fromEntries(
      VARS.map((v) => [v, h[`${v}${sfx}`] as Series | undefined]),
    );
    const input = [];
    for (let d = 0; d < days; d++) {
      const i = d * HOURS + NOON;
      const temp = s.temperature_2m?.[i];
      const rh = s.relative_humidity_2m?.[i];
      const wind = s.wind_speed_10m?.[i];
      if (!isNum(temp) || !isNum(rh) || !isNum(wind)) break;
      let rain = 0;
      for (let k = d * HOURS; k < (d + 1) * HOURS; k++) {
        const r = s.precipitation?.[k];
        if (isNum(r)) rain += r;
      }
      input.push({ date: dates[d], weather: { temp, rh, wind, rain } });
    }
    if (input.length < days) continue;
    fwiSeries(input, lat, start).forEach((r, d) => perDay[d].push(r.fwi));
  }

  perDay.forEach((vals, d) => {
    if (vals.length < MIN_MEMBERS) return;
    const sorted = [...vals].sort((a, b) => a - b);
    out.set(dates[d], {
      pDanger: sorted.filter((v) => v >= FWI_DANGER).length / sorted.length,
      p10: round1(pct(sorted, 0.1)),
      p50: round1(pct(sorted, 0.5)),
      p90: round1(pct(sorted, 0.9)),
      members: sorted.length,
    });
  });
  return out;
}

export const ensembleUrl = (lat: number, lng: number, days: number) =>
  `https://ensemble-api.open-meteo.com/v1/ensemble?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}` +
  `&hourly=${VARS.join(",")}&models=ecmwf_ifs025&forecast_days=${days}&timezone=auto`;
