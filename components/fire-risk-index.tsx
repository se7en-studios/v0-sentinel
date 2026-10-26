// Licensing note (team decision, not made here): the free Open-Meteo API is
// for non-commercial use only; a commercial site needs their paid plan and
// CC BY 4.0 attribution (link kept in the footer note below).

export interface Location {
  name: string;
  province: string;
  lat: number;
  lon: number;
}

export const locations: Location[] = [
  { name: "Bariloche", province: "Río Negro", lat: -41.1335, lon: -71.3103 },
  { name: "El Bolsón", province: "Río Negro", lat: -41.9667, lon: -71.5333 },
  {
    name: "San Martín de los Andes",
    province: "Neuquén",
    lat: -40.1576,
    lon: -71.3468,
  },
  { name: "Esquel", province: "Chubut", lat: -42.9083, lon: -71.3197 },
];

export interface Reading {
  location: Location;
  temperature: number;
  humidity: number;
  windSpeed: number;
  time: string; // Open-Meteo local time of the reading, e.g. 2026-10-26T14:15
}

export async function fetchReading(location: Location): Promise<Reading | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=auto`;
    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      location,
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      time: String(data.current.time ?? ""),
    };
  } catch {
    return null;
  }
}
