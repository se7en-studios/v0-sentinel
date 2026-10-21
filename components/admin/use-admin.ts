"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { alongRoute, distKm, firesInZone } from "@/lib/admin/geo";
import { demoWorkspace } from "@/lib/admin/demo";
import {
  UNITS,
  etaFromBase,
  unitState,
  type Dispatch,
  type OpsEntry,
} from "@/lib/admin/resources";
import {
  FLEET,
  droneTelemetry,
  riskScore,
  sensorReading,
} from "@/lib/admin/sim";
import { useWorkspace } from "@/lib/admin/store";
import { fetchWeather, type Weather } from "@/lib/admin/weather";
import { fetchForecast, type DayForecast } from "@/lib/admin/forecast";
import { evaluateRules } from "@/lib/admin/rules";
import { HA_PER_DETECTION } from "@/lib/admin/history";
import { nearestPlace } from "@/lib/admin/places";
import {
  HORIZONS,
  spreadLevel,
  spreadPolygon,
  spreadRate,
  spreadRingsKm,
} from "@/lib/admin/spread";
import { fmtArea, areaHa, centerOf } from "@/lib/admin/geo";
import {
  downloadDataUrl,
  downloadFiresCsv,
  printReport,
} from "@/lib/admin/report";
import { toast } from "sonner";
import {
  MODE_ROLE,
  REGIONS,
  type BaseLayer,
  type Feat,
  type FireCluster,
  type FirePoint,
  type FiresPayload,
  type Role,
} from "@/lib/admin/types";
import { TABS } from "./tabs";
import type {
  Camera,
  Ctx,
  DroneState,
  FeedItem,
  FireStats,
  HourPoint,
  KeyEvent,
  SensorState,
  SpreadInfo,
  Tab,
  PanelSeg,
} from "./ctx";
import type { MapHandle } from "./map-view";
import type { PaletteAction } from "./command-palette";

const BASES: { id: BaseLayer; label: string }[] = [
  { id: "esri", label: "Satélite HD" },
  { id: "s2", label: "Sentinel-2" },
  { id: "viirs", label: "VIIRS ayer" },
];

const CONF_MIN = { l: 0, n: 1, h: 2 } as const;
const NAME_PREFIX: Record<Role, string> = {
  zone: "Zona",
  line: "Línea",
  route: "Ruta",
  sensor: "Sensor",
};
const EMPTY_CLUSTERS: FireCluster[] = [];
const EMPTY_STATS: FireStats = {
  total: 0,
  last24: 0,
  frp: 0,
  hectares: 0,
  perDay: [],
  perHour: [],
  byConf: [],
  night: 0,
  day: 0,
};

const pointTs = (days: string[], p: FirePoint) => {
  const hh = String(p[5]).padStart(4, "0");
  return Date.parse(`${days[p[4]]}T${hh.slice(0, 2)}:${hh.slice(2)}:00Z`);
};

export interface CloudSession {
  uid: string;
  email: string | null;
  getToken: () => Promise<string>;
  signOut: () => Promise<void>;
}

export function useAdmin(authRequired: boolean, cloud?: CloudSession) {
  const {
    ws,
    ready,
    setFeatures,
    setMeta,
    setSettings,
    replace,
    setNotes,
    setOps,
    undo,
    redo,
    canUndo,
    canRedo,
    sync,
    retry: retrySync,
    resolveConflict,
  } = useWorkspace(cloud?.uid);
  const s = ws.settings;
  const mapRef = useRef<MapHandle>(null);

  const [tab, setTab] = useState<Tab>("general");
  const [view, setView] = useState<"2d" | "3d">("2d");
  const [tool, setToolRaw] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditingRaw] = useState(false);
  const [live, setLive] = useState<string | null>(null);
  const orders = ws.ops.orders;
  const setOrders = useCallback(
    (f: (o: Record<string, Dispatch>) => Record<string, Dispatch>) =>
      setOps((o) => ({ ...o, orders: f(o.orders) })),
    [setOps],
  );
  const ordersRef = useRef(orders);
  ordersRef.current = orders;
  const opsLog = ws.ops.log;
  const setOpsLog = useCallback(
    (f: (l: OpsEntry[]) => OpsEntry[]) =>
      setOps((o) => ({ ...o, log: f(o.log) })),
    [setOps],
  );
  const [activeDrone, setActiveDrone] = useState<string | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [camera, setCamera] = useState<Camera>({
    bearing: 0,
    pitch: 0,
    zoom: 8,
  });
  const [show, setShow] = useState({
    fires: true,
    heat: true,
    zones: true,
    lines: true,
    routes: true,
    sensors: true,
    drones: true,
    names: true,
    spread: true,
    forest: true,
    buildings: true,
  });
  const [hours, setHours] = useState(240);
  const [predH, setPredH] = useState(0);
  const [dark, setDark] = useState(false);
  const [rtb, setRtb] = useState<Set<string>>(new Set());
  const [orbit, setOrbit] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [tour, setTour] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [followId, setFollowIdRaw] = useState<string | null>(null);
  const [zoneRisk, setZoneRisk] = useState<Ctx["zoneRisk"]>({});
  const [spread, setSpread] = useState<GeoJSON.FeatureCollection | null>(null);
  const [spreadInfo, setSpreadInfo] = useState<SpreadInfo[]>([]);
  const windCache = useRef(new Map<string, Weather>());
  const [payload, setPayload] = useState<FiresPayload | null>(null);
  const [firesError, setFiresError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [weather, setWeather] = useState<Weather | null>(null);
  const region = REGIONS.find((r) => r.id === s.regionId) ?? REGIONS[1];
  const [center, setCenter] = useState<[number, number]>(region.center);

  // ---- data loading ----
  const loadSeq = useRef(0);
  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    setLoading(true);
    try {
      const token = cloud ? await cloud.getToken() : null;
      const res = await fetch(
        "/api/admin/fires",
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
      );
      const j = (await res.json()) as FiresPayload;
      if (!res.ok) throw new Error(j.error ?? "Error al cargar focos");
      if (seq !== loadSeq.current) return;
      setPayload(j);
      setFiresError(null);
    } catch (e) {
      if (seq !== loadSeq.current) return;
      setFiresError(e instanceof Error ? e.message : "Error al cargar focos");
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, [cloud]);
  useEffect(() => {
    load();
    const t = setInterval(
      load,
      Math.max(5, Number(s.refreshMin) || 30) * 60_000,
    );
    return () => clearInterval(t);
  }, [load, s.refreshMin]);

  // the clock re-renders the whole panel: tick fast only where live telemetry is on screen, pause when hidden
  const tickMs =
    tab === "drones" || tab === "recursos"
      ? 1000
      : tab === "general" || tab === "zonas"
        ? 2000
        : 15_000;
  useEffect(() => {
    const t = setInterval(() => {
      if (!document.hidden) setNow(Date.now());
    }, tickMs);
    return () => clearInterval(t);
  }, [tickMs]);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(
      () =>
        fetchWeather(center[1], center[0]).then(
          (w) => !cancelled && setWeather(w),
        ),
      700,
    );
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [center]);

  // fly when the saved region changes (skip first render: the map starts there)
  const firstRegion = useRef(true);
  useEffect(() => {
    if (firstRegion.current) {
      firstRegion.current = false;
      return;
    }
    mapRef.current?.flyTo(region.center, region.zoom);
  }, [region]);

  // ---- derived fire data ----
  const minConf = CONF_MIN[s.minConfidence];
  const allFires = useMemo(
    () => (payload?.points ?? []).filter((p) => p[3] >= minConf),
    [payload, minConf],
  );
  const fires = useMemo(() => {
    const days = payload?.days ?? [];
    const end = cursor === null ? Infinity : cursor;
    const start =
      hours >= 240 ? -Infinity : (cursor ?? Date.now()) - hours * 3600_000;
    return allFires.filter((p) => {
      const t = pointTs(days, p);
      return t <= end && t >= start;
    });
  }, [allFires, cursor, hours, payload]);

  const stats = useMemo<FireStats>(() => {
    if (!payload) return EMPTY_STATS;
    const days = payload.days;
    const cutoff = Date.now() - 24 * 3600 * 1000;
    const perDay = days.map((d, i) => ({
      day: d,
      label: d.slice(8) + "/" + d.slice(5, 7),
      count: 0,
      frp: 0,
      i,
    }));
    const perHour = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: 0,
    }));
    let last24 = 0;
    let frp = 0;
    let night = 0;
    const conf = [0, 0, 0];
    for (const p of allFires) {
      perDay[p[4]].count += 1;
      perDay[p[4]].frp += p[2];
      frp += p[2];
      if (p[6]) night += 1;
      const hh = Math.floor(p[5] / 100);
      perHour[(hh + 21) % 24].count += 1; // UTC -> ART
      conf[p[3]] += 1;
      if (
        Date.parse(
          `${days[p[4]]}T${String(hh).padStart(2, "0")}:${String(p[5] % 100).padStart(2, "0")}:00Z`,
        ) >= cutoff
      )
        last24 += 1;
    }
    return {
      total: allFires.length,
      last24,
      frp: Math.round(frp),
      hectares: Math.round(allFires.length * HA_PER_DETECTION),
      perDay: perDay.map(({ day, label, count, frp: f }) => ({
        day,
        label,
        count,
        frp: Math.round(f),
      })),
      perHour,
      byConf: [
        { name: "Baja", value: conf[0] },
        { name: "Nominal", value: conf[1] },
        { name: "Alta", value: conf[2] },
      ],
      night,
      day: allFires.length - night,
    };
  }, [payload, allFires]);

  // ---- timeline: range, hourly series ----
  const range = useMemo(() => {
    const t0 = payload?.days.length
      ? Date.parse(`${payload.days[0]}T00:00:00Z`)
      : Date.now() - 10 * 864e5;
    return { t0, t1: Math.max(Date.now(), t0 + 864e5) };
  }, [payload]);
  const series = useMemo<HourPoint[]>(() => {
    if (!payload) return [];
    const n = Math.ceil((range.t1 - range.t0) / 3600_000);
    const arr: HourPoint[] = Array.from({ length: n + 1 }, (_, i) => ({
      t: range.t0 + i * 3600_000,
      count: 0,
      frp: 0,
      cum: 0,
    }));
    for (const p of allFires) {
      const i = Math.floor((pointTs(payload.days, p) - range.t0) / 3600_000);
      if (arr[i]) {
        arr[i].count += 1;
        arr[i].frp += p[2];
      }
    }
    let c = 0;
    for (const a of arr) {
      c += a.count;
      a.cum = c;
      a.frp = Math.round(a.frp);
    }
    return arr;
  }, [payload, allFires, range]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const next = (cursorRef.current ?? range.t0) + speed * 1.2 * 3600_000;
      if (next >= range.t1) {
        cursorRef.current = null;
        setCursor(null);
        setPlaying(false);
        return;
      }
      cursorRef.current = next;
      setCursor(next);
    }, 100);
    return () => clearInterval(id);
  }, [playing, speed, range]);

  // ---- features ----
  const addFeature = useCallback(
    (f: Feat, roleIn?: Role) => {
      const role = roleIn ?? MODE_ROLE[String(f.properties.mode)] ?? "zone";
      const n =
        ws.features.filter(
          (x) => (MODE_ROLE[String(x.properties.mode)] ?? "zone") === role,
        ).length + 1;
      setFeatures([...ws.features, f]);
      setMeta(f.id, {
        name: `${NAME_PREFIX[role]} ${n}`,
        ...(role === "sensor"
          ? {
              sensorType: (["temp", "humidity", "smoke", "wind"] as const)[
                (n - 1) % 4
              ],
            }
          : {}),
      });
      setSelectedId(f.id);
      toast.success(`${NAME_PREFIX[role]} creada`, {
        description: "Podés renombrarla en el panel lateral.",
      });
    },
    [ws.features, setFeatures, setMeta],
  );

  const removeFeature = useCallback(
    (id: string) => {
      setFeatures(ws.features.filter((f) => f.id !== id));
      toast("Elemento eliminado", {
        action: { label: "Deshacer", onClick: () => undo() },
      });
      setSelectedId((cur) => (cur === id ? null : cur));
      setEditingRaw(false);
    },
    [ws.features, setFeatures, undo],
  );

  const onEdited = useCallback(
    (f: Feat) =>
      setFeatures(
        ws.features.map((x) =>
          x.id === f.id ? { ...x, geometry: f.geometry } : x,
        ),
      ),
    [ws.features, setFeatures],
  );

  const loadDemo = useCallback(() => {
    const d = demoWorkspace(
      region.id === "ar" ? REGIONS[1].center : region.center,
    );
    replace({
      ...ws,
      features: [
        ...ws.features,
        ...d.features.filter((f) => !ws.features.some((x) => x.id === f.id)),
      ],
      meta: { ...ws.meta, ...d.meta },
    });
    mapRef.current?.flyTo(
      region.id === "ar" ? REGIONS[1].center : region.center,
      10.4,
    );
    toast.success("Demo cargado: zonas, rutas y sensores de ejemplo");
  }, [region, ws, replace]);

  const setTool = useCallback((t: string | null) => {
    setToolRaw(t);
    if (t) {
      setView("2d");
      setEditingRaw(false);
    } else setLive(null);
  }, []);
  const setEditing = useCallback((v: boolean) => {
    setEditingRaw(v);
    if (v) {
      setView("2d");
      setToolRaw(null);
    }
  }, []);
  const select = useCallback((id: string | null) => {
    setSelectedId(id);
    setEditingRaw(false);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) ||
          t.closest("[role=dialog]"))
      )
        return;
      setToolRaw(null);
      setEditingRaw(false);
      setSelectedId(null);
      setLive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---- zone hits (time independent) ----
  const zoneHits = useMemo(() => {
    const out: Record<string, { recent: number; total: number; last: number }> =
      {};
    if (!payload) return out;
    const lastDay = payload.days.length - 1;
    for (const z of ws.features) {
      if (MODE_ROLE[String(z.properties.mode)] !== "zone") continue;
      const hits = firesInZone(z, allFires, s.bufferKm);
      out[z.id] = {
        total: hits.length,
        recent: hits.filter((p) => p[4] >= lastDay - 1).length,
        last: hits.reduce((m, p) => Math.max(m, pointTs(payload.days, p)), 0),
      };
    }
    return out;
  }, [ws.features, allFires, payload, s.bufferKm]);
  const alertIds = useMemo(
    () =>
      new Set(
        Object.entries(zoneHits)
          .filter(([, h]) => h.recent > 0)
          .map(([id]) => id),
      ),
    [zoneHits],
  );

  // ---- simulated drones & sensors ----
  const drones = useMemo<DroneState[]>(
    () =>
      FLEET.map((spec) => {
        const route = ws.features.find(
          (f) =>
            MODE_ROLE[String(f.properties.mode)] === "route" &&
            ws.meta[f.id]?.droneId === spec.id,
        );
        const telem = droneTelemetry(spec, now);
        return {
          spec,
          route,
          telem,
          track:
            route && !rtb.has(spec.id) ? alongRoute(route, telem.distKm) : null,
        };
      }),
    [ws.features, ws.meta, now, rtb],
  );

  const recentFires = useMemo(() => {
    const last = (payload?.days.length ?? 1) - 1;
    return allFires.filter((p) => p[4] === last && p[3] >= 1);
  }, [allFires, payload]);
  const sensors = useMemo<SensorState[]>(
    () =>
      ws.features
        .filter((f) => MODE_ROLE[String(f.properties.mode)] === "sensor")
        .map((feat) => {
          const [lng, lat] = feat.geometry.coordinates as [number, number];
          let fireKm: number | null = null;
          for (const p of recentFires) {
            if (Math.abs(p[0] - lat) > 0.2 || Math.abs(p[1] - lng) > 0.25)
              continue;
            const d = distKm([lng, lat], [p[1], p[0]]);
            if (fireKm === null || d < fireKm) fireKm = d;
          }
          const meta = ws.meta[feat.id] ?? { name: feat.id };
          const type = meta.sensorType ?? "temp";
          return {
            feat,
            meta,
            type,
            fireKm,
            reading: sensorReading(feat.id, type, now, fireKm, s.thresholds),
          };
        }),
    [ws.features, ws.meta, recentFires, now, s.thresholds],
  );

  const events = useMemo<KeyEvent[]>(() => {
    if (!payload || allFires.length === 0) return [];
    const days = payload.days;
    const out: KeyEvent[] = [];
    let first = allFires[0];
    let strongest = allFires[0];
    for (const p of allFires) {
      if (pointTs(days, p) < pointTs(days, first)) first = p;
      if (p[2] > strongest[2]) strongest = p;
    }
    const place = (p: FirePoint) => {
      const n = nearestPlace(p[0], p[1]);
      return `${n.km} km de ${n.near}`;
    };
    out.push({
      id: "first",
      t: pointTs(days, first),
      kind: "first",
      title: "Primer foco detectado",
      sub: place(first),
      at: [first[1], first[0]],
    });
    const peak = series.reduce(
      (m, x) => (x.count > m.count ? x : m),
      series[0] ?? { t: 0, count: 0, frp: 0, cum: 0 },
    );
    if (peak.count > 0)
      out.push({
        id: "peak",
        t: peak.t,
        kind: "peak",
        title: "Pico de actividad",
        sub: `${peak.count} focos en una hora`,
      });
    out.push({
      id: "frp",
      t: pointTs(days, strongest),
      kind: "frp",
      title: `Mayor potencia: ${Math.round(strongest[2])} MW`,
      sub: place(strongest),
      at: [strongest[1], strongest[0]],
    });
    for (const z of ws.features) {
      const h = zoneHits[z.id];
      if (h?.total)
        out.push({
          id: `z-${z.id}`,
          t: h.last,
          kind: "zone",
          title: `Foco en ${ws.meta[z.id]?.name ?? "zona"}`,
          sub: `${h.total} detecciones en 10 días`,
          featId: z.id,
        });
    }
    return out.sort((a, b) => b.t - a.t);
  }, [payload, allFires, series, ws.features, ws.meta, zoneHits]);

  // ---- risk per zone: real weather at each zone center ----
  useEffect(() => {
    let cancelled = false;
    const zones = ws.features.filter(
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
  }, [ws.features]);
  const zoneRiskColors = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(zoneRisk).map(([id, r]) => [id, r.color]),
      ),
    [zoneRisk],
  );
  const setFollowId = useCallback((id: string | null) => {
    setFollowIdRaw(id);
    if (id) {
      setView("3d");
      setOrbit(false);
    }
  }, []);

  // ---- AI-style spread prediction (wind-driven, demonstrative) ----
  const clusters = payload?.clusters ?? EMPTY_CLUSTERS;
  useEffect(() => {
    if (!predH) {
      setSpread(null);
      setSpreadInfo([]);
      return;
    }
    let cancelled = false;
    const hot = clusters.filter((c) => c.count >= 3).slice(0, 6);
    if (hot.length === 0) {
      setSpread((cur) => (cur ? null : cur));
      setSpreadInfo((cur) => (cur.length ? [] : cur));
      return;
    }
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
      setSpread({ type: "FeatureCollection", features: feats });
      setSpreadInfo(
        rows.flatMap(({ c, w }) => {
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
      );
    });
    return () => {
      cancelled = true;
    };
  }, [predH, clusters]);

  // ---- activity feed: real detections + zone/sensor events ----
  const feed = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [];
    const days = payload?.days ?? [];
    const cutoff = now - 24 * 3600_000;
    allFires
      .filter((p) => p[3] >= 1 && pointTs(days, p) >= cutoff)
      .sort((a, b) => b[2] - a[2])
      .slice(0, 6)
      .forEach((p) => {
        const near = nearestPlace(p[0], p[1]);
        items.push({
          id: `f-${p[0]}-${p[1]}-${p[5]}`,
          t: pointTs(days, p),
          kind: "fire",
          title: `Foco FRP ${Math.round(p[2])} MW`,
          sub: `${near.km} km de ${near.near} · confianza ${["baja", "nominal", "alta"][p[3]]}`,
          at: [p[1], p[0]],
        });
      });
    for (const z of ws.features) {
      const h = zoneHits[z.id];
      if (!h?.recent) continue;
      items.push({
        id: `z-${z.id}`,
        t: h.last,
        kind: "zone",
        title: `Foco en ${ws.meta[z.id]?.name ?? "zona"}`,
        sub: `${h.recent} detecciones en 48 h (radio ${s.bufferKm} km)`,
        featId: z.id,
      });
    }
    for (const sn of sensors) {
      if (!sn.reading.alert) continue;
      items.push({
        id: `s-${sn.feat.id}`,
        t: now,
        kind: "sensor",
        title: `${sn.meta.name} fuera de umbral`,
        sub: `${sn.reading.value} ${sn.reading.unit}`,
        featId: sn.feat.id,
        sim: true,
      });
    }
    for (const id of rtb) {
      items.push({
        id: `r-${id}`,
        t: now,
        kind: "drone",
        title: `${FLEET.find((d) => d.id === id)?.name} retornando al dock`,
        sub: "Orden manual del operador",
        sim: true,
      });
    }
    return items.sort((a, b) => b.t - a.t);
  }, [
    allFires,
    payload,
    ws.features,
    ws.meta,
    zoneHits,
    sensors,
    rtb,
    now,
    s.bufferKm,
  ]);

  // ---- exposure & exports ----
  const protectedHa = useMemo(
    () =>
      ws.features
        .filter((f) => MODE_ROLE[String(f.properties.mode)] === "zone")
        .reduce((a, z) => a + areaHa(z), 0),
    [ws.features],
  );
  const atRiskHa = useMemo(
    () =>
      ws.features
        .filter((f) => (zoneHits[f.id]?.recent ?? 0) > 0)
        .reduce((a, z) => a + areaHa(z), 0),
    [ws.features, zoneHits],
  );
  const exportCsv = () => payload && downloadFiresCsv(fires, payload.days);
  const exportReport = async () =>
    printReport({
      mapImage: (await mapRef.current?.snapshot()) ?? null,
      org: s.org,
      stats,
      zones: ws.features
        .filter((f) => MODE_ROLE[String(f.properties.mode)] === "zone")
        .map((z) => ({
          name: ws.meta[z.id]?.name ?? "Zona",
          area: fmtArea(areaHa(z), s.units),
          recent: zoneHits[z.id]?.recent ?? 0,
          total: zoneHits[z.id]?.total ?? 0,
        })),
      clusters: clusters.map((c) => ({
        text: `${c.km} km de ${c.near}`,
        count: c.count,
        frp: c.frp,
      })),
      exposure:
        s.valuePerHa > 0
          ? `Valor bajo vigilancia: USD ${Math.round(protectedHa * s.valuePerHa).toLocaleString("es-AR")} (${fmtArea(protectedHa, s.units)} a USD ${s.valuePerHa}/ha). En zonas con focos recientes: USD ${Math.round(atRiskHa * s.valuePerHa).toLocaleString("es-AR")}.`
          : null,
    });

  useEffect(() => {
    try {
      const v = localStorage.getItem("sentinel-admin-theme");
      if (v) setDark(v === "dark");
    } catch {}
  }, []);
  const toggleTheme = () =>
    setDark((d) => {
      try {
        localStorage.setItem("sentinel-admin-theme", d ? "light" : "dark");
      } catch {}
      return !d;
    });

  // ---- simulated response units ----
  const units = useMemo(
    () => UNITS.map((u) => unitState(u, region.center, orders[u.id], now)),
    [region, orders, now],
  );
  const dispatchUnit = useCallback(
    (id: string, target: [number, number], label: string) => {
      const spec = UNITS.find((u) => u.id === id);
      if (!spec) return;
      const t = Date.now();
      setOrders((o) => ({ ...o, [id]: { target, label, since: t } }));
      const eta = etaFromBase(spec, region.center, target);
      setOpsLog((l) =>
        [
          {
            id: `${id}-${t}`,
            t,
            text: `${spec.name} despachada a ${label} · ETA ${eta} min`,
          },
          ...l,
        ].slice(0, 40),
      );
      toast.success(`${spec.name} despachada`, {
        description: `${label} · ETA ${eta} min (simulado)`,
      });
    },
    [region],
  );
  const recallUnit = useCallback((id: string) => {
    const t = Date.now();
    if (ordersRef.current[id]?.recalledAt || !ordersRef.current[id]) return;
    setOrders((o) =>
      o[id] && !o[id].recalledAt
        ? { ...o, [id]: { ...o[id], recalledAt: t } }
        : o,
    );
    const spec = UNITS.find((u) => u.id === id);
    if (spec)
      setOpsLog((l) =>
        [
          { id: `${id}-r-${t}`, t, text: `${spec.name} regresa a base` },
          ...l,
        ].slice(0, 40),
      );
  }, []);
  const unitMarkers = useMemo(
    () =>
      units
        .filter((u) => u.status !== "disponible")
        .map((u) => ({
          id: u.spec.id,
          name: u.spec.name,
          kind: u.spec.kind,
          pos: u.pos,
        })),
    [units],
  );

  // two devices (or tabs) edited the same account: never overwrite silently
  useEffect(() => {
    if (sync !== "conflict") {
      toast.dismiss("sync-conflict");
      return;
    }
    toast.warning("Tu espacio de trabajo cambió en otro dispositivo", {
      id: "sync-conflict",
      description:
        "Hay cambios nuevos en la nube y también cambios tuyos sin subir. Elegí cuáles conservar.",
      duration: Infinity,
      dismissible: false,
      action: { label: "Usar la nube", onClick: () => resolveConflict("server") },
      cancel: { label: "Mantener lo mío", onClick: () => resolveConflict("mine") },
    });
  }, [sync, resolveConflict]);

  // ---- user alert rules ----
  const [panelSeg, setPanelSeg] = useState<PanelSeg>("Capas");
  const [forecast, setForecast] = useState<DayForecast[] | null>(null);
  const needsForecast = s.rules.some((r) => r.kind === "risk" && r.enabled);
  useEffect(() => {
    if (!needsForecast) return;
    let cancelled = false;
    fetchForecast(center[1], center[0]).then(
      (f) => !cancelled && setForecast(f),
    );
    return () => {
      cancelled = true;
    };
  }, [needsForecast, center]);
  const ruleFirings = useMemo(
    () =>
      evaluateRules(s.rules, {
        zones: ws.features
          .filter((f) => MODE_ROLE[String(f.properties.mode)] === "zone")
          .map((z) => ({
            id: z.id,
            name: ws.meta[z.id]?.name ?? "Zona",
            recent: zoneHits[z.id]?.recent ?? 0,
          })),
        last24: stats.last24,
        forecast,
      }),
    [s.rules, ws.features, ws.meta, zoneHits, stats.last24, forecast],
  );
  const seenRules = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!payload) return;
    const prev = seenRules.current;
    seenRules.current = new Set(ruleFirings.keys());
    if (!prev) return;
    for (const [id, detail] of ruleFirings) {
      if (prev.has(id)) continue;
      toast.warning("Regla de alerta activada", {
        description: detail,
        duration: 12_000,
        action: {
          label: "Ver reglas",
          onClick: () => {
            goTab("general");
            setPanelSeg("Alertas");
          },
        },
      });
      if (
        s.notify.browser &&
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      )
        new Notification("Sentinel: regla de alerta", {
          body: detail,
          tag: `rule-${id}`,
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruleFirings, payload, s.notify.browser]);

  const ctx: Ctx = {
    ws,
    setSettings,
    setMeta,
    setFeatures,
    replaceWorkspace: replace,
    setNotes,
    payload,
    firesError,
    loading,
    reload: load,
    fires,
    stats,
    clusters,
    now,
    weather,
    map: mapRef,
    tab,
    tool,
    setTool,
    selectedId,
    select,
    editing,
    setEditing,
    addFeature,
    removeFeature,
    zoneHits,
    drones,
    sensors,
    center,
    loadDemo,
    hours,
    setHours,
    predH,
    spreadInfo,
    setPredH,
    feed,
    rtb,
    toggleRtb: (id: string) =>
      setRtb((cur) => {
        const n = new Set(cur);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      }),
    protectedHa,
    atRiskHa,
    exportCsv,
    exportReport,
    zoneRisk,
    followId,
    setFollowId,
    undo,
    redo,
    canUndo,
    canRedo,
    shareView,
    exportPng,
    goTab,
    range,
    cursor,
    setCursor,
    playing,
    setPlaying,
    speed,
    setSpeed,
    series,
    events,
    view,
    setView,
    show,
    setShow,
    orbit,
    setOrbit,
    panelOpen,
    setPanelOpen,
    camera,
    alertCount: alertIds.size + sensors.filter((x) => x.reading.alert).length,
    ruleFirings,
    panelSeg,
    setPanelSeg,
    units,
    dispatchUnit,
    recallUnit,
    opsLog,
    activeDrone,
    setActiveDrone,
  };

  const isMapTab =
    tab === "general" ||
    tab === "zonas" ||
    tab === "drones" ||
    tab === "recursos";
  const dayLabels = payload?.days ?? [];
  const fd = followId ? drones.find((d) => d.spec.id === followId) : undefined;
  const followDrone =
    fd?.track && view === "3d"
      ? { pos: fd.track.pos, heading: fd.track.heading }
      : null;
  const droneMarkers = drones
    .filter((d) => d.track)
    .map((d) => ({
      id: d.spec.id,
      name: d.spec.name,
      pos: d.track!.pos,
      heading: d.track!.heading,
      selected: d.route?.id === selectedId,
      altitude: d.telem.altitude,
    }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (firesError)
      toast.error("No se pudieron cargar los focos de NASA", {
        description: firesError,
      });
  }, [firesError]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        if (!undo()) toast("Nada para deshacer");
      } else if ((k === "z" && e.shiftKey) || k === "y") {
        e.preventDefault();
        if (!redo()) toast("Nada para rehacer");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  // browser notification when a zone gets a new fire alert
  const seenAlerts = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!payload) return;
    const prev = seenAlerts.current;
    seenAlerts.current = new Set(alertIds);
    if (!prev || !s.notify.onZoneHit) return;
    for (const id of alertIds) {
      if (prev.has(id)) continue;
      const name = ws.meta[id]?.name ?? "Zona";
      const hits = zoneHits[id]?.recent ?? 0;
      const zone = ws.features.find((f) => f.id === id);
      toast.warning(`Foco nuevo en ${name}`, {
        description: `${hits} ${hits === 1 ? "detección" : "detecciones"} satelitales en 48 h`,
        duration: 12_000,
        action: zone
          ? {
              label: "Ver",
              onClick: () => {
                goTab("general");
                mapRef.current?.fitFeature(zone);
              },
            }
          : undefined,
      });
      if (
        s.notify.browser &&
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      )
        new Notification("Sentinel: foco detectado", {
          body: `${name}: ${hits} focos en 48 h`,
          tag: id,
        });
    }
  }, [
    alertIds,
    payload,
    s.notify.browser,
    s.notify.onZoneHit,
    ws.meta,
    zoneHits,
  ]);

  // restore a shared view (#v=lng,lat,zoom,view)
  useEffect(() => {
    if (!ready) return;
    const m = window.location.hash.match(
      /^#v=(-?[\d.]+),(-?[\d.]+),([\d.]+),(2d|3d)$/,
    );
    if (!m) return;
    const t = setTimeout(() => {
      setView(m[4] as "2d" | "3d");
      mapRef.current?.flyTo([Number(m[1]), Number(m[2])], Number(m[3]));
    }, 1800);
    return () => clearTimeout(t);
  }, [ready]);

  function shareView() {
    const v = mapRef.current?.getView();
    if (!v) return toast("Abrí un panel con mapa para compartir la vista");
    const url = `${window.location.origin}/admin#v=${v.center[0].toFixed(4)},${v.center[1].toFixed(4)},${v.zoom.toFixed(2)},${view}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Enlace de la vista copiado"),
      () => toast.error("No se pudo copiar el enlace"),
    );
  }
  // frozen, tokenised copy for people without an account; contacts and settings stay out
  async function shareReadOnly() {
    if (!cloud) return;
    const v = mapRef.current?.getView();
    try {
      const { createShare, SHARE_DAYS } = await import("@/lib/admin/share");
      const { token, expiresAt } = await createShare(cloud.uid, {
        v: 1,
        org: s.org,
        region: {
          name: region.name,
          center: v?.center ?? region.center,
          zoom: v?.zoom ?? region.zoom,
        },
        baseLayer: s.baseLayer,
        features: ws.features,
        meta: ws.meta,
        fires,
        days: payload?.days ?? [],
        createdAt: Date.now(),
      });
      const url = `${window.location.origin}/admin/ver/${token}`;
      await navigator.clipboard.writeText(url);
      toast.success("Enlace de solo lectura copiado", {
        description: `Vence en ${SHARE_DAYS} días (${new Date(expiresAt).toLocaleDateString("es-AR", { day: "numeric", month: "long" })}). Muestra una foto de tus zonas y focos, sin contactos.`,
        duration: 9000,
      });
    } catch {
      toast.error("No se pudo crear el enlace");
    }
  }
  async function revokeLinks() {
    if (!cloud) return;
    try {
      const { revokeShares } = await import("@/lib/admin/share");
      const n = await revokeShares(cloud.uid);
      toast.success(
        n
          ? `${n} ${n === 1 ? "enlace revocado" : "enlaces revocados"}`
          : "No había enlaces activos",
      );
    } catch {
      toast.error("No se pudieron revocar los enlaces");
    }
  }
  async function exportPng() {
    const img = await mapRef.current?.snapshot();
    if (!img) return toast("Abrí un panel con mapa para exportar la imagen");
    downloadDataUrl(
      `sentinel-mapa-${new Date().toISOString().slice(0, 10)}.jpg`,
      img,
    );
    toast.success("Mapa exportado");
  }

  function goTab(t: Tab) {
    setTab(t);
    setToolRaw(null);
    setEditingRaw(false);
  }
  const actions: PaletteAction[] = [
    ...TABS.map((t) => ({
      id: `tab-${t.id}`,
      group: "Ir a",
      label: t.label,
      run: () => goTab(t.id),
    })),
    {
      id: "tour",
      group: "Vista",
      label: "Recorrido guiado",
      run: () => setTour(true),
    },
    { id: "v2", group: "Vista", label: "Mapa 2D", run: () => setView("2d") },
    {
      id: "v3",
      group: "Vista",
      label: "Mapa 3D con relieve",
      run: () => setView("3d"),
    },
    {
      id: "orbit",
      group: "Vista",
      label: "Órbita automática",
      run: () => {
        setView("3d");
        setOrbit((o) => !o);
      },
    },
    {
      id: "panel",
      group: "Vista",
      label: "Mostrar u ocultar panel lateral",
      run: () => setPanelOpen((o) => !o),
    },
    {
      id: "theme",
      group: "Vista",
      label: dark ? "Modo claro" : "Modo oscuro",
      run: toggleTheme,
    },
    ...BASES.map((b) => ({
      id: `b-${b.id}`,
      group: "Capa base",
      label: b.label,
      run: () => setSettings({ baseLayer: b.id }),
    })),
    ...REGIONS.map((r) => ({
      id: `r-${r.id}`,
      group: "Volar a",
      label: r.name,
      run: () => {
        goTab("general");
        setSettings({ regionId: r.id });
        mapRef.current?.flyTo(r.center, r.zoom);
      },
    })),
    {
      id: "p12",
      group: "Análisis",
      label: "Predicción de propagación +12 h",
      run: () => {
        goTab("general");
        setPredH(12);
      },
    },
    {
      id: "p0",
      group: "Análisis",
      label: "Apagar predicción",
      run: () => setPredH(0),
    },
    {
      id: "undo",
      group: "Edición",
      label: "Deshacer",
      hint: "Ctrl Z",
      run: () => undo(),
    },
    {
      id: "redo",
      group: "Edición",
      label: "Rehacer",
      hint: "Ctrl Shift Z",
      run: () => redo(),
    },
    {
      id: "share",
      group: "Compartir",
      label: "Copiar enlace de esta vista",
      run: shareView,
    },
    {
      id: "png",
      group: "Reportes",
      label: "Exportar mapa como imagen",
      run: exportPng,
    },
    {
      id: "csv",
      group: "Reportes",
      label: "Descargar focos (CSV)",
      run: exportCsv,
    },
    {
      id: "pdf",
      group: "Reportes",
      label: "Generar reporte PDF",
      run: exportReport,
    },
    {
      id: "reload",
      group: "Datos",
      label: "Actualizar datos satelitales",
      run: load,
    },
    {
      id: "demo",
      group: "Datos",
      label: "Cargar zonas, rutas y sensores demo",
      run: loadDemo,
    },
  ];

  const logout = async () => {
    if (cloud) return cloud.signOut();
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  };

  return {
    ctx,
    tab,
    goTab,
    isMapTab,
    retrySync,
    resolveConflict,
    firesError,
    now,
    dark,
    toggleTheme,
    canShare: Boolean(cloud),
    shareReadOnly,
    revokeLinks,
    undo,
    redo,
    canUndo,
    canRedo,
    setPaletteOpen,
    paletteOpen,
    tour,
    setTour,
    load,
    loading,
    authRequired,
    logout,
    cloud,
    sync,
    ready,
    mapRef,
    s,
    region,
    view,
    setView,
    ws,
    alertIds,
    fires,
    dayLabels,
    show,
    setShow,
    tool,
    setTool,
    selectedId,
    editing,
    droneMarkers,
    zoneRiskColors,
    predH,
    setPredH,
    spread,
    orbit,
    setOrbit,
    followDrone,
    weather,
    select,
    addFeature,
    onEdited,
    setToolRaw,
    live,
    setLive,
    setCenter,
    setCamera,
    camera,
    unitMarkers,
    setSettings,
    payload,
    panelOpen,
    setPanelOpen,
    mounted,
    actions,
    stats,
  };
}
