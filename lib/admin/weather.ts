/** loading until the request settles; error when Open-Meteo did not answer */
export type WeatherStatus = "loading" | "ready" | "error";

export interface Weather {
  temp: number;
  rh: number;
  wind: number;
  windDir: number;
  rain7d: number;
}

/** Open-Meteo (free, no key). Current conditions + last 7 days of rain. */
export async function fetchWeather(
  lat: number,
  lng: number,
): Promise<Weather | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}` +
      "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m" +
      "&daily=precipitation_sum&past_days=7&forecast_days=1&timezone=auto";
    const res = await fetch(url);
    if (!res.ok) return null;
    const j = await res.json();
    const rain =
      (j.daily?.precipitation_sum as (number | null)[] | undefined) ?? [];
    return {
      temp: j.current.temperature_2m,
      rh: j.current.relative_humidity_2m,
      wind: j.current.wind_speed_10m,
      windDir: j.current.wind_direction_10m,
      rain7d: rain.slice(0, 7).reduce<number>((a, b) => a + (b ?? 0), 0),
    };
  } catch {
    return null;
  }
}

export const compass = (deg: number) =>
  ["N", "NE", "E", "SE", "S", "SO", "O", "NO"][Math.round(deg / 45) % 8];
