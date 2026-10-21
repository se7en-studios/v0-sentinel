import { riskScore } from "./sim";

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
}

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
        "&past_days=7&forecast_days=7&timezone=auto",
    );
    if (res.ok) {
      const d = (await res.json()).daily;
      const n = (a: (number | null)[], i: number) => a[i] ?? 0;
      v = [];
      for (let i = 7; i < d.time.length; i++) {
        let rain7d = 0;
        for (let k = i - 7; k < i; k++) rain7d += n(d.precipitation_sum, k);
        const tmax = n(d.temperature_2m_max, i);
        const rhmin = n(d.relative_humidity_2m_min, i);
        const wind = n(d.wind_speed_10m_max, i);
        v.push({
          date: d.time[i],
          tmax,
          rhmin,
          wind,
          windDir: n(d.wind_direction_10m_dominant, i),
          rain: n(d.precipitation_sum, i),
          ...riskScore({ temp: tmax, rh: rhmin, wind, rain7d }),
        });
      }
    }
  } catch {
    v = null;
  }
  if (v) cache.set(key, { t: Date.now(), v });
  return v;
}
