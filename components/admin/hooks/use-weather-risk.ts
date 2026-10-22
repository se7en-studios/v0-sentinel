import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { centerOf } from "@/lib/admin/geo";
import { riskScore } from "@/lib/admin/sim";
import { fetchWeather, type Weather, type WeatherStatus } from "@/lib/admin/weather";
import { fetchForecast, type DayForecast } from "@/lib/admin/forecast";
import {
  HORIZONS,
  spreadLevel,
  spreadPolygon,
  spreadRate,
  spreadRingsKm,
} from "@/lib/admin/spread";
import { MODE_ROLE, type FireCluster, type Feat } from "@/lib/admin/types";
import type { Ctx, SpreadInfo } from "../ctx";

interface SpreadResult {
  h: number;
  fc: GeoJSON.FeatureCollection;
  info: SpreadInfo[];
}

/** Weather at the map center, per-zone risk, wind-driven spread prediction and the multi-day outlook. */
export function useWeatherRisk(
  center: [number, number],
  features: Feat[],
  clusters: FireCluster[],
  predH: number,
) {
  const windCache = useRef(new Map<string, Weather>());
  const [weather, setWeather] = useState<Weather | null>(null);
  // null weather alone cannot tell "still loading" from "the request failed"
  const [weatherStatus, setWeatherStatus] = useState<WeatherStatus>("loading");
  const [weatherTry, setWeatherTry] = useState(0);
  const [zoneRisk, setZoneRisk] = useState<Ctx["zoneRisk"]>({});
  const [spreadResult, setSpreadResult] = useState<SpreadResult | null>(null);
  const [forecast, setForecast] = useState<DayForecast[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      setWeatherStatus("loading");
      fetchWeather(center[1], center[0]).then((w) => {
        if (cancelled) return;
        setWeather(w);
        setWeatherStatus(w ? "ready" : "error");
      });
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [center, weatherTry]);
  const retryWeather = useCallback(() => setWeatherTry((n) => n + 1), []);

  // ---- risk per zone: real weather at each zone center ----
  useEffect(() => {
    let cancelled = false;
    const zones = features.filter(
      (f) => MODE_ROLE[String(f.properties.mode)] === "zone",
    );
    Promise.all(
      zones.map(async (z) => {
        const [lng, lat] = centerOf(z);
        const key = `${lat.toFixed(1)},${lng.toFixed(1)}`;
        let w = windCache.current.get(key);
        if (!w) {
          const got = await fetchWeather(lat, lng);
          if (got) windCache.current.set(key, (w = got));
        }
        return [z.id, w ? { ...riskScore(w), wx: w } : null] as const;
      }),
    ).then((rows) => {
      if (cancelled) return;
      setZoneRisk(
        Object.fromEntries(rows.filter((r) => r[1])) as Ctx["zoneRisk"],
      );
    });
    return () => {
      cancelled = true;
    };
  }, [features]);
  const zoneRiskColors = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(zoneRisk).map(([id, r]) => [id, r.color]),
      ),
    [zoneRisk],
  );

  // ---- AI-style spread prediction (wind-driven, demonstrative) ----
  const hot = useMemo(
    () => clusters.filter((c) => c.count >= 3).slice(0, 6),
    [clusters],
  );
  useEffect(() => {
    if (!predH || hot.length === 0) return;
    let cancelled = false;
    Promise.all(
      hot.map(async (c) => {
        const key = `${c.lat.toFixed(1)},${c.lng.toFixed(1)}`;
        let w = windCache.current.get(key);
        if (!w) {
          const got = await fetchWeather(c.lat, c.lng);
          if (got) windCache.current.set(key, (w = got));
        }
        return { c, w };
      }),
    ).then((rows) => {
      if (cancelled) return;
      const feats: GeoJSON.Feature[] = [];
      for (const { c, w } of rows) {
        if (!w) continue;
        for (const h of HORIZONS.filter((x) => x <= predH).reverse()) {
          feats.push({
            type: "Feature",
            properties: { h, label: h === predH ? `+${h} h` : "" },
            geometry: {
              type: "Polygon",
              coordinates: [spreadPolygon(c.lat, c.lng, w, h)],
            },
          });
        }
      }
      setSpreadResult({
        h: predH,
        fc: { type: "FeatureCollection", features: feats },
        info: rows.flatMap(({ c, w }) => {
          if (!w) return [];
          const rate = spreadRate(w);
          return [
            {
              near: c.near,
              wind: w.wind,
              windDir: w.windDir,
              rh: w.rh,
              temp: w.temp,
              rain7d: w.rain7d,
              rate,
              level: spreadLevel(rate),
              reachKm: spreadRingsKm(w, predH).head,
            },
          ];
        }),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [predH, hot]);
  // derived instead of cleared from the effect: off or without hot clusters means nothing to draw
  const shown =
    predH && hot.length > 0 && spreadResult?.h === predH ? spreadResult : null;
  const spread = shown?.fc ?? null;
  const spreadInfo = useMemo(() => shown?.info ?? [], [shown]);

  // the status strip always shows today's risk, so the outlook is always loaded (cached 30 min, debounced while panning)
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(
      () =>
        fetchForecast(center[1], center[0]).then(
          (f) => !cancelled && setForecast(f),
        ),
      800,
    );
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [center]);

  return {
    weather,
    weatherStatus,
    retryWeather,
    zoneRisk,
    zoneRiskColors,
    spread,
    spreadInfo,
    forecast,
  };
}
