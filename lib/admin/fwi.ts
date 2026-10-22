// Canadian Forest Fire Weather Index system (Van Wagner & Pickett 1985; Van Wagner 1987).
// Pure daily-step functions from local-noon weather. Inputs are clamped to physical ranges.

export interface FwiState {
  ffmc: number;
  dmc: number;
  dc: number;
}

export interface FwiWeather {
  /** noon temperature, °C */
  temp: number;
  /** noon relative humidity, % */
  rh: number;
  /** noon wind speed, km/h */
  wind: number;
  /** 24 h rain, mm */
  rain: number;
}

export interface FwiResult {
  state: FwiState;
  isi: number;
  bui: number;
  fwi: number;
}

/** Standard start-up values after snow melt. */
export const FWI_START: FwiState = { ffmc: 85, dmc: 6, dc: 15 };

export type FwiDanger = "Bajo" | "Moderado" | "Alto" | "Muy alto" | "Extremo";

/**
 * Generic FWI classes (upper bounds exclusive): Bajo < 5, Moderado < 10,
 * Alto < 20, Muy alto < 30, Extremo >= 30. These are the commonly used Canadian
 * breaks, not locally calibrated for Argentina; tune against observed fires.
 */
export function fwiDanger(fwiValue: number): FwiDanger {
  if (fwiValue < 5) return "Bajo";
  if (fwiValue < 10) return "Moderado";
  if (fwiValue < 20) return "Alto";
  if (fwiValue < 30) return "Muy alto";
  return "Extremo";
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

// Day-length adjustment Le for DMC, by month (Jan..Dec), northern hemisphere.
const LE_NORTH = [6.5, 7.5, 9, 12.8, 13.9, 13.9, 12.4, 10.9, 9.2, 8, 7, 6];
const LE_SUBTROPIC = [
  7.9, 8.4, 8.9, 9.5, 9.9, 10.2, 10.1, 9.7, 9.1, 8.6, 8.1, 7.8,
];
const LE_EQUATOR = 9;
// Seasonal term Lf for DC, by month, northern hemisphere.
const LF_NORTH = [
  -1.6, -1.6, -1.6, 0.9, 3.8, 5.8, 6.4, 5, 2.4, 0.4, -1.6, -1.6,
];
const LF_EQUATOR = 1.4;

/** Southern hemisphere seasons are 6 months out of phase. */
const seasonal = (table: number[], month: number, lat: number) =>
  table[(clamp(Math.round(month), 1, 12) - 1 + (lat < 0 ? 6 : 0)) % 12];

export function dayLength(month: number, lat: number): number {
  const a = Math.abs(lat);
  if (a <= 10) return LE_EQUATOR;
  return seasonal(a > 30 ? LE_NORTH : LE_SUBTROPIC, month, lat);
}

export function dryingFactor(month: number, lat: number): number {
  return Math.abs(lat) <= 10 ? LF_EQUATOR : seasonal(LF_NORTH, month, lat);
}

export function nextFfmc(prev: number, w: FwiWeather): number {
  const T = w.temp;
  const H = clamp(w.rh, 0, 100);
  const W = Math.max(0, w.wind);
  let mo = (147.2 * (101 - prev)) / (59.5 + prev);
  if (w.rain > 0.5) {
    const rf = w.rain - 0.5;
    mo += 42.5 * rf * Math.exp(-100 / (251 - mo)) * (1 - Math.exp(-6.93 / rf));
    if (mo > 150) mo += 0.0015 * (mo - 150) ** 2 * Math.sqrt(rf);
    mo = Math.min(mo, 250);
  }
  const ed =
    0.942 * H ** 0.679 +
    11 * Math.exp((H - 100) / 10) +
    0.18 * (21.1 - T) * (1 - Math.exp(-0.115 * H));
  let m = mo;
  if (mo > ed) {
    const ko =
      0.424 * (1 - (H / 100) ** 1.7) +
      0.0694 * Math.sqrt(W) * (1 - (H / 100) ** 8);
    m = ed + (mo - ed) * 10 ** -(ko * 0.581 * Math.exp(0.0365 * T));
  } else {
    const ew =
      0.618 * H ** 0.753 +
      10 * Math.exp((H - 100) / 10) +
      0.18 * (21.1 - T) * (1 - Math.exp(-0.115 * H));
    if (mo < ew) {
      const k1 =
        0.424 * (1 - ((100 - H) / 100) ** 1.7) +
        0.0694 * Math.sqrt(W) * (1 - ((100 - H) / 100) ** 8);
      m = ew - (ew - mo) * 10 ** -(k1 * 0.581 * Math.exp(0.0365 * T));
    }
  }
  return clamp((59.5 * (250 - m)) / (147.2 + m), 0, 101);
}

export function nextDmc(
  prev: number,
  w: FwiWeather,
  month: number,
  lat: number,
): number {
  const H = clamp(w.rh, 0, 100);
  let p = prev;
  if (w.rain > 1.5) {
    const re = 0.92 * w.rain - 1.27;
    const mo = 20 + Math.exp(5.6348 - prev / 43.43);
    const b =
      prev <= 33
        ? 100 / (0.5 + 0.3 * prev)
        : prev <= 65
          ? 14 - 1.3 * Math.log(prev)
          : 6.2 * Math.log(prev) - 17.2;
    const mr = mo + (1000 * re) / (48.77 + b * re);
    p = Math.max(0, 244.72 - 43.43 * Math.log(mr - 20));
  }
  const k =
    1.894 *
    (Math.max(w.temp, -1.1) + 1.1) *
    (100 - H) *
    dayLength(month, lat) *
    1e-4;
  return p + k;
}

export function nextDc(
  prev: number,
  w: FwiWeather,
  month: number,
  lat: number,
): number {
  let d = prev;
  if (w.rain > 2.8) {
    const rd = 0.83 * w.rain - 1.27;
    const qr = 800 * Math.exp(-prev / 400) + 3.937 * rd;
    d = Math.max(0, 400 * Math.log(800 / qr));
  }
  const v = Math.max(
    0,
    0.36 * (Math.max(w.temp, -2.8) + 2.8) + dryingFactor(month, lat),
  );
  return d + 0.5 * v;
}

export function isi(ffmc: number, wind: number): number {
  const m = (147.2 * (101 - ffmc)) / (59.5 + ffmc);
  const fF = 91.9 * Math.exp(-0.1386 * m) * (1 + m ** 5.31 / 4.93e7);
  return 0.208 * Math.exp(0.05039 * Math.max(0, wind)) * fF;
}

export function bui(dmc: number, dc: number): number {
  if (dmc <= 0 && dc <= 0) return 0;
  if (dmc <= 0.4 * dc) return (0.8 * dmc * dc) / (dmc + 0.4 * dc);
  const u =
    dmc - (1 - (0.8 * dc) / (dmc + 0.4 * dc)) * (0.92 + (0.0114 * dmc) ** 1.7);
  return Math.max(0, u);
}

export function fwi(isiValue: number, buiValue: number): number {
  const fD =
    buiValue <= 80
      ? 0.626 * buiValue ** 0.809 + 2
      : 1000 / (25 + 108.64 * Math.exp(-0.023 * buiValue));
  const b = 0.1 * isiValue * fD;
  return b > 1 ? Math.exp(2.72 * (0.434 * Math.log(b)) ** 0.647) : b;
}

/** Advances the three moisture codes one day and derives ISI, BUI and FWI. `month` is 1-12. */
export function fwiStep(
  prev: FwiState,
  w: FwiWeather,
  month: number,
  lat: number,
): FwiResult {
  const state: FwiState = {
    ffmc: nextFfmc(prev.ffmc, w),
    dmc: nextDmc(prev.dmc, w, month, lat),
    dc: nextDc(prev.dc, w, month, lat),
  };
  const i = isi(state.ffmc, w.wind);
  const b = bui(state.dmc, state.dc);
  return { state, isi: i, bui: b, fwi: fwi(i, b) };
}
