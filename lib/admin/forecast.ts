import { riskScore } from "./sim";
import { fwiDanger, fwiSeries, type FwiDanger, type FwiWeather } from "./fwi";

export interface DayForecast {
  date: string;
  tmax: number;
  rhmin: number;
  wind: number;
  windDir: number;
  rain: number;
  score: number;
  label: string;
  color: string;
  /** Canadian Fire Weather Index for the day (approximate, see fwiWeatherAt); absent when it could not be computed */
  fwi?: number;
  fwiLabel?: FwiDanger;
}

const FORECAST_DAYS = 7;
/** days of history that warm up the FWI moisture codes (they start from standard values, see fwiSeries) */
const PAST_DAYS = 30;
const NOON = 12;

type Series = (number | null)[] | undefined;
interface OpenMeteoPayload {
  daily: {
    time: string[];
    temperature_2m_max: (number | null)[];
    relative_humidity_2m_min: (number | null)[];
    wind_speed_10m_max: (number | null)[];
    wind_direction_10m_dominant: (number | null)[];
    precipitation_sum: (number | null)[];
  };
  hourly?: {
    temperature_2m?: Series;
    relative_humidity_2m?: Series;
    wind_speed_10m?: Series;
  };
}

const num = (v: number | null | undefined): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

/**
 * Weather the FWI wants for day `i`: local noon temperature, humidity and wind (timezone=auto makes the
 * hourly series local). When the hourly series is missing it falls back to the daily extremes, which
 * are hotter and drier than noon and so push the FWI up. Rain is the 24 h total of the day.
 */
export function fwiWeatherAt(j: OpenMeteoPayload, i: number): FwiWeather {
  const h = j.hourly;
  const at = (hourly: Series, daily: Series, none: number) =>
    num(hourly?.[i * 24 + NOON]) ?? num(daily?.[i]) ?? none;
  return {
    temp: at(h?.temperature_2m, j.daily.temperature_2m_max, NEUTRAL.temp),
    rh: at(h?.relative_humidity_2m, j.daily.relative_humidity_2m_min, NEUTRAL.rh),
    wind: at(h?.wind_speed_10m, j.daily.wind_speed_10m_max, 0),
    rain: num(j.daily.precipitation_sum?.[i]) ?? 0,
  };
}

/** Open-Meteo sends null for some days: a missing value must not read as 0 °C or 0 % humidity (extreme dryness) */
const NEUTRAL = { temp: 15, rh: 50 };
const FETCH_TIMEOUT_MS = 8_000;

const TTL_MS = 30 * 60_000;
const cache = new Map<string, { t: number; v: DayForecast[] | null }>();

/** Open-Meteo daily outlook: 7 days of danger index from forecast temp / min RH / wind / trailing rain. */
export async function fetchForecast(
  lat: number,
  lng: number,
): Promise<DayForecast[] | null> {
  const key = `${lat.toFixed(1)},${lng.toFixed(1)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < TTL_MS) return hit.v;
  let v: DayForecast[] | null = null;
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}` +
        "&daily=temperature_2m_max,relative_humidity_2m_min,wind_speed_10m_max,wind_direction_10m_dominant,precipitation_sum" +
        "&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m" +
        `&past_days=${PAST_DAYS}&forecast_days=${FORECAST_DAYS}&timezone=auto`,
      { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) },
    );
    if (res.ok) {
      const j = (await res.json()) as OpenMeteoPayload;
      const d = j.daily;
      const n = (a: (number | null)[], i: number) => a[i] ?? 0;
      // history length comes from the response, so a shorter window still lines up with the 7 forecast days
      const first = Math.max(0, d.time.length - FORECAST_DAYS);
      const fwis = fwiSeries(
        d.time.map((date, i) => ({ date, weather: fwiWeatherAt(j, i) })),
        lat,
      );
      v = [];
      for (let i = first; i < d.time.length; i++) {
        let rain7d = 0;
        for (let k = Math.max(0, i - 7); k < i; k++)
          rain7d += n(d.precipitation_sum, k);
        const tmax = d.temperature_2m_max[i] ?? NEUTRAL.temp;
        const rhmin = d.relative_humidity_2m_min[i] ?? NEUTRAL.rh;
        const wind = n(d.wind_speed_10m_max, i);
        const fwi = Math.round(fwis[i].fwi * 10) / 10;
        v.push({
          date: d.time[i],
          tmax,
          rhmin,
          wind,
          windDir: n(d.wind_direction_10m_dominant, i),
          rain: n(d.precipitation_sum, i),
          ...riskScore({ temp: tmax, rh: rhmin, wind, rain7d }),
          fwi,
          fwiLabel: fwiDanger(fwi),
        });
      }
    }
  } catch {
    v = null;
  }
  // a failure is remembered for a minute so panning around while offline does not hammer the API
  cache.set(key, { t: v ? Date.now() : Date.now() - (TTL_MS - 60_000), v });
  return v;
}
