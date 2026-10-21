"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Box,
  Compass,
  Flame,
  LogOut,
  Moon,
  Redo2,
  PanelRight,
  RotateCw,
  Search,
  Sun,
  Undo2,
  Map as MapIcon,
  Plane,
  RefreshCw,
  Settings as Cog,
  Square,
} from "lucide-react";
import { SentinelLogo } from "@/components/sentinel-logo";
import { cn } from "@/lib/utils";
import { alongRoute, distKm, firesInZone } from "@/lib/admin/geo";
import { demoWorkspace } from "@/lib/admin/demo";
import { FLEET, droneTelemetry, riskScore, sensorReading } from "@/lib/admin/sim";
import { useWorkspace } from "@/lib/admin/store";
import { fetchWeather, type Weather } from "@/lib/admin/weather";
import { HA_PER_DETECTION } from "@/lib/admin/history";
import { nearestPlace } from "@/lib/admin/places";
import { HORIZONS, spreadPolygon } from "@/lib/admin/spread";
import { fmtArea, areaHa, centerOf } from "@/lib/admin/geo";
import { downloadDataUrl, downloadFiresCsv, printReport } from "@/lib/admin/report";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
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
import type { Ctx, DroneState, FeedItem, FireStats, SensorState, Tab } from "./ctx";
import type { MapHandle } from "./map-view";
import { GeneralPanel } from "./panel-general";
import { DronesPanel, ZonesPanel } from "./panel-draw";
import { MetricsView } from "./metrics-view";
import { SettingsView } from "./settings-view";
import { Timeline } from "./timeline";
import { Toolbar } from "./toolbar";
import { CommandPalette, type PaletteAction } from "./command-palette";

const MapView = dynamic(() => import("./map-view").then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center bg-background text-xs text-foreground/50">
      Cargando mapa…
    </div>
  ),
});

const TABS: { id: Tab; label: string; Icon: typeof MapIcon }[] = [
  { id: "general", label: "Vista general", Icon: MapIcon },
  { id: "zonas", label: "Zonas", Icon: Square },
  { id: "drones", label: "Drones y sensores", Icon: Plane },
  { id: "metricas", label: "Métricas", Icon: BarChart3 },
  { id: "config", label: "Configuración", Icon: Cog },
];

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

export function AdminApp({ authRequired, cloud }: { authRequired: boolean; cloud?: CloudSession }) {
  const { ws, ready, setFeatures, setMeta, setSettings, replace, undo, redo, canUndo, canRedo, sync } = useWorkspace(cloud?.uid);
  const s = ws.settings;
  const mapRef = useRef<MapHandle>(null);

  const [tab, setTab] = useState<Tab>("general");
  const [view, setView] = useState<"2d" | "3d">("2d");
  const [tool, setToolRaw] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditingRaw] = useState(false);
  const [live, setLive] = useState<string | null>(null);
  const [dayFilter, setDayFilter] = useState<number | null>(null);
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
  });
  const [hours, setHours] = useState(240);
  const [predH, setPredH] = useState(0);
  const [dark, setDark] = useState(false);
  const [rtb, setRtb] = useState<Set<string>>(new Set());
  const [orbit, setOrbit] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [followId, setFollowIdRaw] = useState<string | null>(null);
  const [zoneRisk, setZoneRisk] = useState<Ctx["zoneRisk"]>({});
  const [spread, setSpread] = useState<GeoJSON.FeatureCollection | null>(null);
  const [query, setQuery] = useState("");
  const [searchMsg, setSearchMsg] = useState<string | null>(null);
  const windCache = useRef(new Map<string, Weather>());
  const [payload, setPayload] = useState<FiresPayload | null>(null);
  const [firesError, setFiresError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [weather, setWeather] = useState<Weather | null>(null);
  const region = REGIONS.find((r) => r.id === s.regionId) ?? REGIONS[1];
  const [center, setCenter] = useState<[number, number]>(region.center);

  // ---- data loading ----
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = cloud ? await cloud.getToken() : null;
      const res = await fetch("/api/admin/fires", token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
      const j = (await res.json()) as FiresPayload;
      if (!res.ok) throw new Error(j.error ?? "Error al cargar focos");
      setPayload(j);
      setFiresError(null);
    } catch (e) {
      setFiresError(e instanceof Error ? e.message : "Error al cargar focos");
    } finally {
      setLoading(false);
    }
  }, [cloud]);
  useEffect(() => {
    load();
    const t = setInterval(load, Math.max(5, Number(s.refreshMin) || 30) * 60_000);
    return () => clearInterval(t);
  }, [load, s.refreshMin]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(
      () => fetchWeather(center[1], center[0]).then((w) => !cancelled && setWeather(w)),
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
    const cutoff = hours >= 240 ? 0 : Date.now() - hours * 3600_000;
    return allFires.filter(
      (p) =>
        (dayFilter === null || p[4] === dayFilter) &&
        (cutoff === 0 || pointTs(days, p) >= cutoff),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allFires, dayFilter, hours, payload]);

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
      toast.success(`${NAME_PREFIX[role]} creada`, { description: "Podés renombrarla en el panel lateral." });
    },
    [ws.features, setFeatures, setMeta],
  );

  const removeFeature = useCallback(
    (id: string) => {
      setFeatures(ws.features.filter((f) => f.id !== id));
      toast("Elemento eliminado", { action: { label: "Deshacer", onClick: () => undo() } });
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
      features: [...ws.features, ...d.features.filter((f) => !ws.features.some((x) => x.id === f.id))],
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
      if (t && (["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || t.closest("[role=dialog]"))) return;
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
    const out: Record<string, { recent: number; total: number; last: number }> = {};
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
          track: route && !rtb.has(spec.id) ? alongRoute(route, telem.distKm) : null,
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

  // ---- risk per zone: real weather at each zone center ----
  useEffect(() => {
    let cancelled = false;
    const zones = ws.features.filter((f) => MODE_ROLE[String(f.properties.mode)] === "zone");
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
      setZoneRisk(Object.fromEntries(rows.filter((r) => r[1])) as Ctx["zoneRisk"]);
    });
    return () => {
      cancelled = true;
    };
  }, [ws.features]);
  const zoneRiskColors = useMemo(
    () => Object.fromEntries(Object.entries(zoneRisk).map(([id, r]) => [id, r.color])),
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
      return;
    }
    let cancelled = false;
    const hot = clusters.filter((c) => c.count >= 3).slice(0, 6);
    if (hot.length === 0) {
      setSpread((cur) => (cur ? null : cur));
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
            geometry: { type: "Polygon", coordinates: [spreadPolygon(c.lat, c.lng, w, h)] },
          });
        }
      }
      setSpread({ type: "FeatureCollection", features: feats });
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
      items.push({ id: `r-${id}`, t: now, kind: "drone", title: `${FLEET.find((d) => d.id === id)?.name} retornando al dock`, sub: "Orden manual del operador", sim: true });
    }
    return items.sort((a, b) => b.t - a.t);
  }, [allFires, payload, ws.features, ws.meta, zoneHits, sensors, rtb, now, s.bufferKm]);

  // ---- search (coordinates or place name, Argentina only) ----
  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearchMsg(null);
    const m = q.match(/^(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)$/);
    if (m) {
      mapRef.current?.flyTo([Number(m[2]), Number(m[1])], 12);
      return;
    }
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=ar&format=json&limit=1`,
      );
      const j = (await r.json()) as { lat: string; lon: string }[];
      if (!j[0]) return setSearchMsg("Sin resultados en Argentina");
      mapRef.current?.flyTo([Number(j[0].lon), Number(j[0].lat)], 11);
    } catch {
      setSearchMsg("No se pudo buscar");
    }
  };

  // ---- exposure & exports ----
  const protectedHa = ws.features
    .filter((f) => MODE_ROLE[String(f.properties.mode)] === "zone")
    .reduce((a, z) => a + areaHa(z), 0);
  const atRiskHa = ws.features
    .filter((f) => (zoneHits[f.id]?.recent ?? 0) > 0)
    .reduce((a, z) => a + areaHa(z), 0);
  const exportCsv = () => payload && downloadFiresCsv(fires, payload.days);
  const exportReport = () =>
    printReport({
      mapImage: mapRef.current?.snapshot() ?? null,
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
      clusters: clusters.map((c) => ({ text: `${c.km} km de ${c.near}`, count: c.count, frp: c.frp })),
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

  const ctx: Ctx = {
    ws,
    setSettings,
    setMeta,
    setFeatures,
    replaceWorkspace: replace,
    payload,
    firesError,
    loading,
    reload: load,
    fires,
    stats,
    clusters,
    dayFilter,
    setDayFilter,
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
  };

  const isMapTab = tab === "general" || tab === "zonas" || tab === "drones";
  const dayLabels = payload?.days ?? [];
  const fd = followId ? drones.find((d) => d.spec.id === followId) : undefined;
  const followDrone = fd?.track && view === "3d" ? { pos: fd.track.pos, heading: fd.track.heading } : null;
  const droneMarkers = drones
    .filter((d) => d.track)
    .map((d) => ({
      id: d.spec.id,
      name: d.spec.name,
      pos: d.track!.pos,
      heading: d.track!.heading,
      selected: d.route?.id === selectedId,
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
    if (firesError) toast.error("No se pudieron cargar los focos de NASA", { description: firesError });
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
    if (!prev || !s.notify.browser || !s.notify.onZoneHit) return;
    for (const id of alertIds) {
      if (prev.has(id) || typeof Notification === "undefined" || Notification.permission !== "granted") continue;
      new Notification("Sentinel: foco detectado", { body: `${ws.meta[id]?.name ?? "Zona"}: ${zoneHits[id]?.recent ?? 0} focos en 48 h`, tag: id });
    }
  }, [alertIds, payload, s.notify.browser, s.notify.onZoneHit, ws.meta, zoneHits]);

  // restore a shared view (#v=lng,lat,zoom,view)
  useEffect(() => {
    if (!ready) return;
    const m = window.location.hash.match(/^#v=(-?[\d.]+),(-?[\d.]+),([\d.]+),(2d|3d)$/);
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
  function exportPng() {
    const img = mapRef.current?.snapshot();
    if (!img) return toast("Abrí un panel con mapa para exportar la imagen");
    downloadDataUrl(`sentinel-mapa-${new Date().toISOString().slice(0, 10)}.jpg`, img);
    toast.success("Mapa exportado");
  }

  const goTab = (t: Tab) => {
    setTab(t);
    setToolRaw(null);
    setEditingRaw(false);
  };
  const actions: PaletteAction[] = [
    ...TABS.map((t) => ({ id: `tab-${t.id}`, group: "Ir a", label: t.label, run: () => goTab(t.id) })),
    { id: "v2", group: "Vista", label: "Mapa 2D", run: () => setView("2d") },
    { id: "v3", group: "Vista", label: "Mapa 3D con relieve", run: () => setView("3d") },
    { id: "orbit", group: "Vista", label: "Órbita automática", run: () => { setView("3d"); setOrbit((o) => !o); } },
    { id: "panel", group: "Vista", label: "Mostrar u ocultar panel lateral", run: () => setPanelOpen((o) => !o) },
    { id: "theme", group: "Vista", label: dark ? "Modo claro" : "Modo oscuro", run: toggleTheme },
    ...BASES.map((b) => ({ id: `b-${b.id}`, group: "Capa base", label: b.label, run: () => setSettings({ baseLayer: b.id }) })),
    ...REGIONS.map((r) => ({ id: `r-${r.id}`, group: "Volar a", label: r.name, run: () => { goTab("general"); setSettings({ regionId: r.id }); mapRef.current?.flyTo(r.center, r.zoom); } })),
    { id: "p12", group: "Análisis", label: "Predicción de propagación +12 h", run: () => { goTab("general"); setPredH(12); } },
    { id: "p0", group: "Análisis", label: "Apagar predicción", run: () => setPredH(0) },
    { id: "undo", group: "Edición", label: "Deshacer", hint: "Ctrl Z", run: () => undo() },
    { id: "redo", group: "Edición", label: "Rehacer", hint: "Ctrl Shift Z", run: () => redo() },
    { id: "share", group: "Compartir", label: "Copiar enlace de esta vista", run: shareView },
    { id: "png", group: "Reportes", label: "Exportar mapa como imagen", run: exportPng },
    { id: "csv", group: "Reportes", label: "Descargar focos (CSV)", run: exportCsv },
    { id: "pdf", group: "Reportes", label: "Generar reporte PDF", run: exportReport },
    { id: "reload", group: "Datos", label: "Actualizar datos satelitales", run: load },
    { id: "demo", group: "Datos", label: "Cargar zonas, rutas y sensores demo", run: loadDemo },
  ];

  const logout = async () => {
    if (cloud) return cloud.signOut();
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  };

  return (
    <div className={cn("admin-root fixed inset-0 flex flex-col bg-background text-foreground", dark && "admin-dark")}>
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-3 text-foreground sm:gap-5 sm:px-4">
        <a
          href="/"
          className="flex items-center gap-2 py-2.5"
          aria-label="Volver a la landing"
        >
          <SentinelLogo className="h-5 w-auto" />
          <span className="hidden rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-primary sm:inline">
            Cloud
          </span>
        </a>
        <nav
          className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto"
          aria-label="Paneles"
        >
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id);
                setToolRaw(null);
                setEditingRaw(false);
              }}
              aria-current={tab === id ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-3 text-[12.5px] font-medium transition-colors sm:px-3",
                tab === id
                  ? "border-primary text-foreground"
                  : "border-transparent text-foreground/50 hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              <span className="hidden md:inline">{label}</span>
              <span className="md:hidden">{label.split(" ")[0]}</span>
            </button>
          ))}
        </nav>
        <div className="hidden items-center gap-3 text-[11px] text-foreground/60 lg:flex">
          <span className="flex items-center gap-1.5">
            <span
              className={cn(
                "size-1.5 rounded-full",
                firesError ? "bg-[#e5483c]" : "animate-pulse bg-[#4bc182]",
              )}
            />
            {firesError ? "Sin datos NASA" : "NASA FIRMS en vivo"}
          </span>
          <span className="tabular-nums" suppressHydrationWarning>
            {new Date(now).toLocaleTimeString("es-AR", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>
        <div className="hidden items-center md:flex">
          <button type="button" onClick={() => undo()} disabled={!canUndo} aria-label="Deshacer" title="Deshacer (Ctrl Z)" className="grid size-8 place-items-center rounded-md text-foreground/60 hover:bg-foreground/8 disabled:opacity-30">
            <Undo2 className="size-3.5" />
          </button>
          <button type="button" onClick={() => redo()} disabled={!canRedo} aria-label="Rehacer" title="Rehacer (Ctrl Shift Z)" className="grid size-8 place-items-center rounded-md text-foreground/60 hover:bg-foreground/8 disabled:opacity-30">
            <Redo2 className="size-3.5" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          aria-label="Abrir paleta de comandos"
          className="hidden h-8 items-center gap-1.5 rounded-md border border-border px-2 text-[11px] text-foreground/50 hover:bg-foreground/5 md:flex"
        >
          <Search className="size-3" aria-hidden /> Ctrl K
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          className="grid size-8 place-items-center rounded-md text-foreground/60 hover:bg-foreground/8 hover:text-foreground"
        >
          {dark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
        </button>
        <button
          type="button"
          onClick={load}
          aria-label="Actualizar datos"
          className="grid size-8 place-items-center rounded-md text-foreground/60 hover:bg-foreground/8 hover:text-foreground"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
        </button>
        {cloud && (
          <span
            className="hidden max-w-[11rem] items-center gap-1.5 truncate text-[11px] text-foreground/50 xl:flex"
            title={cloud.email ?? ""}
          >
            <span className={cn("size-1.5 shrink-0 rounded-full", sync === "error" ? "bg-[#b83a3a]" : sync === "saved" ? "bg-primary" : "animate-pulse bg-[#c9a300]")} />
            {sync === "saved" ? "Guardado en la nube" : sync === "error" ? "Sin conexión: guardado local" : "Sincronizando…"}
          </span>
        )}
        {authRequired && (
          <button
            type="button"
            onClick={logout}
            aria-label="Cerrar sesión"
            className="grid size-8 place-items-center rounded-md text-foreground/60 hover:bg-foreground/8 hover:text-foreground"
          >
            <LogOut className="size-3.5" />
          </button>
        )}
      </header>
      <Toaster position="bottom-center" />
      <CommandPalette open={paletteOpen} setOpen={setPaletteOpen} actions={actions} />

      {isMapTab ? (
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          <div className="flex min-h-[58vh] flex-1 flex-col lg:min-h-0">
            <div className="relative min-h-0 flex-1">
              {ready && (
                <MapView
                  ref={mapRef}
                  baseLayer={s.baseLayer}
                  region={region}
                  view={view}
                  exaggeration={s.exaggeration}
                  features={ws.features}
                  meta={ws.meta}
                  alertIds={alertIds}
                  fires={fires}
                  dayLabels={dayLabels}
                  show={show}
                  spread={predH ? spread : null}
                  orbit={orbit && view === "3d"}
                  follow={followDrone}
                  zoneRisk={zoneRiskColors}
                  tool={tool}
                  selectedId={selectedId}
                  editing={editing}
                  drones={droneMarkers}
                  units={s.units}
                  onSelect={select}
                  onCreate={(f) => {
                    addFeature(f);
                    setToolRaw(null);
                  }}
                  onEdited={onEdited}
                  onToolDone={() => setToolRaw(null)}
                  onLive={setLive}
                  onCenter={setCenter}
                />
              )}
              <form
                onSubmit={search}
                role="search"
                className="absolute left-1/2 top-3 z-10 hidden w-72 -translate-x-1/2 md:block"
              >
                <Search className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-foreground/50" aria-hidden />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSearchMsg(null);
                  }}
                  aria-label="Buscar ciudad o coordenadas"
                  placeholder="Buscar ciudad o lat, lng…"
                  className="h-8 w-full rounded-md border border-border bg-background/85 pl-8 pr-2 text-[12px] text-foreground outline-none backdrop-blur placeholder:text-foreground/40 focus:border-[#4bc182]"
                />
                {searchMsg && <p className="mt-1 rounded bg-background/90 px-2 py-1 text-[11px] text-[#b83a3a]">{searchMsg}</p>}
              </form>
              {tab === "general" && (
                <div className="pointer-events-none absolute right-3 top-14 flex flex-col items-end gap-1 text-[11px] text-foreground">
                  {[
                    { k: "focos visibles", v: fires.length.toLocaleString("es-AR"), c: "#c2540a" },
                    { k: "FRP promedio", v: `${fires.length ? Math.round(fires.reduce((a, p) => a + p[2], 0) / fires.length) : 0} MW`, c: "#8a6a00" },
                    { k: "alta confianza", v: fires.filter((p) => p[3] === 2).length, c: "#0f7a4f" },
                  ].map((c) => (
                    <span key={c.k} className="rounded-md border border-border bg-background/85 px-2.5 py-1 backdrop-blur">
                      <b style={{ color: c.c }}>{c.v}</b> <span className="text-foreground/60">{c.k}</span>
                    </span>
                  ))}
                </div>
              )}
              <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-2">
                <div className="pointer-events-auto flex overflow-hidden rounded-md border border-border bg-background/85 text-[11.5px] text-foreground backdrop-blur">
                  {(["2d", "3d"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setView(v)}
                      aria-pressed={view === v}
                      className={cn(
                        "flex items-center gap-1 px-3 py-1.5 font-semibold uppercase tracking-wide",
                        view === v ? "bg-primary text-primary-foreground" : "hover:bg-foreground/8",
                      )}
                    >
                      {v === "3d" && <Box className="size-3" aria-hidden />}
                      {v}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => mapRef.current?.resetNorth()}
                    aria-label="Orientar al norte"
                    className="border-l border-white/15 px-2.5 hover:bg-foreground/8"
                  >
                    <Compass className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPanelOpen((o) => !o)}
                    aria-pressed={panelOpen}
                    aria-label="Mostrar u ocultar panel"
                    className="hidden border-l border-border px-2.5 hover:bg-foreground/8 lg:block"
                  >
                    <PanelRight className="size-3.5" />
                  </button>
                  {view === "3d" && (
                    <button
                      type="button"
                      onClick={() => {
                        setOrbit((o) => !o);
                        setFollowIdRaw(null);
                      }}
                      aria-pressed={orbit}
                      aria-label="Orbitar automáticamente"
                      title="Órbita automática"
                      className={cn("border-l border-border px-2.5", orbit ? "bg-primary text-primary-foreground" : "hover:bg-foreground/8")}
                    >
                      <RotateCw className="size-3.5" />
                    </button>
                  )}
                </div>
                <div className="pointer-events-auto flex overflow-hidden rounded-md border border-border bg-background/85 text-[11.5px] text-foreground backdrop-blur">
                  {BASES.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSettings({ baseLayer: b.id })}
                      aria-pressed={s.baseLayer === b.id}
                      className={cn(
                        "px-2.5 py-1.5 font-medium",
                        s.baseLayer === b.id
                          ? "bg-primary"
                          : "hover:bg-foreground/8",
                      )}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              {tab !== "general" && (
                <Toolbar
                  tab={tab}
                  tool={tool}
                  setTool={setTool}
                  editing={editing}
                />
              )}
              {(live || tool) && (
                <div className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 rounded-md bg-background/90 px-3 py-1.5 shadow-sm text-center text-[12px] text-white">
                  {live && <b className="mr-2 text-[#4bc182]">{live}</b>}
                  <span className="text-foreground/65">
                    Click para marcar · doble click para terminar · Esc cancela
                  </span>
                </div>
              )}
              {tab === "general" && (
                <div className="pointer-events-none absolute bottom-20 left-3 hidden w-44 rounded-lg border border-border bg-background/85 p-2.5 text-[10.5px] text-foreground/70 backdrop-blur sm:block" aria-label="Leyenda">
                  <div className="mb-1 font-medium text-foreground/80">Intensidad del foco (FRP)</div>
                  <div className="h-1.5 rounded-full" style={{ background: "linear-gradient(90deg,#f5a524,#e8710a,#c8321e)" }} />
                  <div className="mt-0.5 flex justify-between"><span>baja</span><span>alta</span></div>
                  <div className="mt-2 flex flex-wrap gap-x-2.5 gap-y-1">
                    {[["Riesgo bajo", "#0f7a4f"], ["Moderado", "#c9a300"], ["Alto", "#e8710a"], ["Extremo", "#b83a3a"]].map(([l, c]) => (
                      <span key={l} className="flex items-center gap-1"><span className="size-2 rounded-full" style={{ background: c }} />{l}</span>
                    ))}
                  </div>
                  {view === "3d" && <div className="mt-1.5 text-foreground/50">Altura de columna = intensidad</div>}
                </div>
              )}
              {!firesError && payload && show.fires && (
                <div className="pointer-events-none absolute bottom-10 left-3 hidden rounded bg-background/80 px-2 py-1 text-[10px] text-foreground/70 sm:block">
                  {fires.length.toLocaleString("es-AR")} focos
                  {dayFilter !== null
                    ? ` · ${dayLabels[dayFilter]}`
                    : " · 10 días"}
                </div>
              )}
            </div>
            {tab === "general" && <Timeline ctx={ctx} />}
          </div>
          <aside
            className={cn("w-full shrink-0 border-t border-border bg-background lg:w-[344px] lg:overflow-y-auto lg:border-l lg:border-t-0", !panelOpen && "lg:hidden")}
            aria-label="Panel lateral"
          >
            {tab === "general" && (
              <GeneralPanel ctx={ctx} show={show} setShow={setShow} goTab={goTab} />
            )}
            {tab === "zonas" && <ZonesPanel ctx={ctx} />}
            {tab === "drones" && <DronesPanel ctx={ctx} />}
          </aside>
        </main>
      ) : (
        <main className="min-h-0 flex-1 overflow-y-auto">
          {tab === "metricas" && <MetricsView ctx={ctx} />}
          {tab === "config" && <SettingsView ctx={ctx} />}
        </main>
      )}
    </div>
  );
}
