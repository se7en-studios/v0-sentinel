"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWorkspace } from "@/lib/admin/store";
import { REGIONS } from "@/lib/admin/types";
import type { Camera, Ctx, PanelSeg, Tab } from "./ctx";
import type { MapHandle } from "./map-view";
import { useClock } from "./hooks/use-clock";
import { useFeatures } from "./hooks/use-features";
import { useFeedExports } from "./hooks/use-feed-exports";
import { useFiresData } from "./hooks/use-fires-data";
import { useNotifications } from "./hooks/use-notifications";
import { buildPaletteActions } from "./hooks/palette-actions";
import { usePlayback } from "./hooks/use-playback";
import { useTheme } from "./hooks/use-theme";
import { droneView, useSimulation } from "./hooks/use-simulation";
import { useWeatherRisk } from "./hooks/use-weather-risk";
import { useZoneHits } from "./hooks/use-zone-hits";

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
  const { dark, toggleTheme } = useTheme();
  const mapRef = useRef<MapHandle>(null);

  const [tab, setTab] = useState<Tab>("general");
  const [view, setView] = useState<"2d" | "3d">("2d");
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
  const [orbit, setOrbit] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [tour, setTour] = useState(false);
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only flag, must flip after hydration
  useEffect(() => setMounted(true), []);
  const [followId, setFollowIdRaw] = useState<string | null>(null);
  const [panelSeg, setPanelSeg] = useState<PanelSeg>("Capas");
  const region = REGIONS.find((r) => r.id === s.regionId) ?? REGIONS[1];
  const [center, setCenter] = useState<[number, number]>(region.center);

  // the clock re-renders the whole panel: tick fast only where live telemetry is on screen, pause when hidden
  const tickMs =
    tab === "drones" || tab === "recursos"
      ? 1000
      : tab === "general" || tab === "zonas"
        ? 2000
        : 15_000;
  const { now, nowStep } = useClock(tickMs);

  const fd = useFiresData(cloud, s);
  const { payload, firesError, loading, load, allFires, stats, clusters } = fd;
  const pb = usePlayback(payload, allFires, fd.range, hours);
  const { fires } = pb;

  // fly when the saved region changes (skip first render: the map starts there)
  const firstRegion = useRef(true);
  useEffect(() => {
    if (firstRegion.current) {
      firstRegion.current = false;
      return;
    }
    mapRef.current?.flyTo(region.center, region.zoom);
  }, [region]);

  const ft = useFeatures({
    ws,
    region,
    mapRef,
    setFeatures,
    setMeta,
    replace,
    undo,
    setView,
  });
  const { setToolRaw, setEditingRaw } = ft;
  const { zoneHits, alertIds, events } = useZoneHits(
    ws,
    payload,
    allFires,
    fd.series,
    s.bufferKm,
    nowStep,
  );
  const sim = useSimulation({
    ws,
    payload,
    allFires,
    region,
    thresholds: s.thresholds,
    now,
    nowStep,
    setOps,
  });
  const wr = useWeatherRisk(center, ws.features, clusters, predH);
  const setFollowId = useCallback((id: string | null) => {
    setFollowIdRaw(id);
    if (id) {
      setView("3d");
      setOrbit(false);
    }
  }, []);

  const goTab = useCallback(
    (t: Tab) => {
      setTab(t);
      setToolRaw(null);
      setEditingRaw(false);
    },
    [setToolRaw, setEditingRaw],
  );

  const { ruleFirings } = useNotifications({
    ws,
    s,
    payload,
    firesError,
    zoneHits,
    alertIds,
    sensors: sim.sensors,
    last24: stats.last24,
    forecast: wr.forecast,
    sync,
    resolveConflict,
    undo,
    redo,
    goTab,
    setPanelSeg,
    setPaletteOpen,
    mapRef,
  });
  const fx = useFeedExports({
    ws,
    s,
    region,
    payload,
    allFires,
    fires,
    stats,
    clusters,
    zoneHits,
    sensors: sim.sensors,
    rtb: sim.rtb,
    now,
    view,
    setView,
    ready,
    cloud,
    mapRef,
  });

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
    weather: wr.weather,
    map: mapRef,
    tab,
    tool: ft.tool,
    setTool: ft.setTool,
    selectedId: ft.selectedId,
    select: ft.select,
    editing: ft.editing,
    setEditing: ft.setEditing,
    addFeature: ft.addFeature,
    removeFeature: ft.removeFeature,
    zoneHits,
    drones: sim.drones,
    sensors: sim.sensors,
    center,
    loadDemo: ft.loadDemo,
    hours,
    setHours,
    predH,
    spreadInfo: wr.spreadInfo,
    setPredH,
    feed: fx.feed,
    rtb: sim.rtb,
    toggleRtb: sim.toggleRtb,
    protectedHa: fx.protectedHa,
    atRiskHa: fx.atRiskHa,
    exportCsv: fx.exportCsv,
    exportReport: fx.exportReport,
    zoneRisk: wr.zoneRisk,
    followId,
    setFollowId,
    undo,
    redo,
    canUndo,
    canRedo,
    shareView: fx.shareView,
    exportPng: fx.exportPng,
    goTab,
    range: fd.range,
    cursor: pb.cursor,
    setCursor: pb.setCursor,
    playing: pb.playing,
    setPlaying: pb.setPlaying,
    speed: pb.speed,
    setSpeed: pb.setSpeed,
    series: fd.series,
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
    alertCount:
      alertIds.size + sim.sensors.filter((x) => x.reading.alert).length,
    ruleFirings,
    forecast: wr.forecast,
    lastDetection: fd.lastDetection,
    allFires,
    noiseCount: fd.noiseCount,
    panelSeg,
    setPanelSeg,
    units: sim.units,
    dispatchUnit: sim.dispatchUnit,
    recallUnit: sim.recallUnit,
    opsLog: sim.opsLog,
    activeDrone: sim.activeDrone,
    setActiveDrone: sim.setActiveDrone,
  };

  const isMapTab =
    tab === "general" ||
    tab === "zonas" ||
    tab === "drones" ||
    tab === "recursos";
  const dayLabels = payload?.days ?? [];
  const { followDrone, droneMarkers } = droneView(
    sim.drones,
    followId,
    view,
    ft.selectedId,
  );

  // eslint-disable-next-line react-hooks/refs -- mapRef is only dereferenced inside the palette callbacks
  const actions = buildPaletteActions({
    goTab,
    setTour,
    setView,
    setOrbit,
    setPanelOpen,
    dark,
    toggleTheme,
    setSettings,
    mapRef,
    setPredH,
    undo,
    redo,
    shareView: fx.shareView,
    exportPng: fx.exportPng,
    exportCsv: fx.exportCsv,
    exportReport: fx.exportReport,
    load,
    loadDemo: ft.loadDemo,
  });

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
    shareReadOnly: fx.shareReadOnly,
    revokeLinks: fx.revokeLinks,
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
    tool: ft.tool,
    setTool: ft.setTool,
    selectedId: ft.selectedId,
    editing: ft.editing,
    droneMarkers,
    zoneRiskColors: wr.zoneRiskColors,
    predH,
    setPredH,
    spread: wr.spread,
    orbit,
    setOrbit,
    followDrone,
    weather: wr.weather,
    select: ft.select,
    addFeature: ft.addFeature,
    onEdited: ft.onEdited,
    setToolRaw: ft.setToolRaw,
    live: ft.live,
    setLive: ft.setLive,
    setCenter,
    setCamera,
    camera,
    unitMarkers: sim.unitMarkers,
    setSettings,
    payload,
    panelOpen,
    setPanelOpen,
    mounted,
    actions,
    stats,
  };
}
