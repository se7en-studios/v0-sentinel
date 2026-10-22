"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadMapPrefs, saveMapPrefs } from "@/lib/admin/map-prefs";
import { buildIncidents } from "@/lib/admin/incident";
import { incidentContaining } from "@/lib/admin/map-popup";
import { translate, type Translate } from "@/lib/admin/i18n";
import { useWorkspace } from "@/lib/admin/store";
import { REGIONS } from "@/lib/admin/types";
import type { Camera, Ctx, PanelSeg, Tab } from "./ctx";
import type { MapHandle } from "./map-view";
import { useClock } from "./hooks/use-clock";
import { useFeatures } from "./hooks/use-features";
import { useFeedExports } from "./hooks/use-feed-exports";
import {
  RULE_ACK_DEFAULT_MIN,
  isAcked,
  ruleKey,
  zoneKey,
  earlyKey,
  pendingEarly,
} from "@/lib/admin/alert-ack";
import {
  applyIncidentChange,
  type IncidentStatus,
} from "@/lib/admin/incident-meta";
import { useEarly } from "./hooks/use-early";
import { useTerrain } from "./hooks/use-terrain";
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
    addNote,
    removeNote,
    setAck,
    setIncidentMeta,
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
  const t = useCallback<Translate>(
    (key, vars) => translate(s.locale, key, vars),
    [s.locale],
  );
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
    early: true,
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
  // remembered layers and 2D/3D: restored after hydration, saved on every change
  // state (not a ref): saving stays off until the restored values are what is rendered, else defaults overwrite them
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  useEffect(() => {
    const p = loadMapPrefs({ show, view });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage only exists on the client
    setShow(p.show);
    setView(p.view);
    setPrefsLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount
  }, []);
  useEffect(() => {
    if (prefsLoaded) saveMapPrefs({ show, view });
  }, [prefsLoaded, show, view]);
  const [hours, setHours] = useState(240);
  const [predH, setPredH] = useState(0);
  const [orbit, setOrbit] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
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
  const ea = useEarly(
    cloud,
    s.earlyAlerts,
    fd.polarRefs,
    ws.features,
    s.bufferKm,
    nowStep,
  );
  const terrainAt = useTerrain(cloud);
  const pb = usePlayback(payload, allFires, fd.range, hours);
  const { fires } = pb;
  // stable identity: the map only repaints the early layer when the detections change
  const earlyOnMap = useMemo(
    () => ea.early.filter((e) => e.status !== "noise"),
    [ea.early],
  );
  // popup "Ver incidente": builds the incident list lazily, once per data change
  const incidentList = useMemo(
    () => (payload ? buildIncidents(allFires, 60) : []),
    [payload, allFires],
  );
  const incidentAt = useCallback(
    (lat: number, lng: number) =>
      incidentContaining(incidentList, lat, lng) !== null,
    [incidentList],
  );

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
  const wr = useWeatherRisk(center, ws.features, clusters, predH, terrainAt);
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
    earlyByZone: ea.earlyByZone,
    earlyOpen: ea.earlyOpen,
    earlyReady: ea.earlyPayload !== null,
    sensors: sim.sensors,
    last24: stats.last24,
    forecast: wr.forecast,
    growth: fd.growth,
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
    t,
    noteLog: ws.noteLog,
    addNote: (text: string, featId?: string) =>
      addNote(text, cloud?.email ?? ws.settings.org ?? "Operador", featId),
    removeNote,
    payload,
    early: ea.early,
    earlyOpen: ea.earlyOpen,
    earlyByZone: ea.earlyByZone,
    earlyError: ea.earlyError,
    terrainAt,
    sources: [...(payload?.sources ?? []), ...(ea.earlyPayload?.sources ?? [])],
    earlyFetchedAt: ea.earlyPayload?.fetchedAt ?? 0,
    firesError,
    loading,
    reload: load,
    fires,
    stats,
    clusters,
    now,
    weather: wr.weather,
    weatherStatus: wr.weatherStatus,
    retryWeather: wr.retryWeather,
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
    // handled (acknowledged or snoozed) zone alerts stop counting until something new happens
    alertCount:
      [...alertIds].filter(
        (id) =>
          !isAcked(ws.alertAck[zoneKey(id)], zoneHits[id]?.recent ?? 0, now),
      ).length +
      // a zone with only an early GOES detection (no polar pass yet) still needs a look
      Object.entries(ea.earlyByZone).filter(
        ([id, list]) =>
          !alertIds.has(id) && pendingEarly(list, ws.alertAck, now).length > 0,
      ).length +
      sim.sensors.filter((x) => x.reading.alert).length,
    alertAck: ws.alertAck,
    ackZoneAlert: (featId: string, detections: number, snoozeMin?: number) => {
      const t = Date.now();
      setAck(zoneKey(featId), {
        t,
        by: cloud?.email ?? ws.settings.org ?? "Operador",
        n: detections,
        ...(snoozeMin ? { until: t + snoozeMin * 60_000 } : {}),
      });
    },
    reopenZoneAlert: (featId: string) => setAck(zoneKey(featId), null),
    unackedRules: [...ruleFirings.keys()].filter(
      (id) => !isAcked(ws.alertAck[ruleKey(id)], 0, now),
    ).length,
    ackRule: (ruleId: string, snoozeMin = RULE_ACK_DEFAULT_MIN) => {
      const t = Date.now();
      setAck(ruleKey(ruleId), {
        t,
        by: cloud?.email ?? ws.settings.org ?? "Operador",
        n: 0,
        until: t + snoozeMin * 60_000,
      });
    },
    reopenRule: (ruleId: string) => setAck(ruleKey(ruleId), null),
    earlyPending: pendingEarly(ea.earlyOpen, ws.alertAck, now),
    ackEarly: (
      e: { lat: number; lng: number },
      snoozeMin = RULE_ACK_DEFAULT_MIN,
    ) => {
      const t = Date.now();
      setAck(earlyKey(e), {
        t,
        by: cloud?.email ?? ws.settings.org ?? "Operador",
        n: 0,
        until: t + snoozeMin * 60_000,
      });
    },
    reopenEarly: (e: { lat: number; lng: number }) => setAck(earlyKey(e), null),
    incidentMeta: ws.incidentMeta,
    updateIncident: (
      id: string,
      patch: { status?: IncidentStatus; assignee?: string },
    ) => {
      setIncidentMeta(
        id,
        applyIncidentChange(
          ws.incidentMeta[id],
          patch,
          cloud?.email ?? ws.settings.org ?? "Operador",
          Date.now(),
        ),
      );
    },
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
    t,
    openShortcuts: () => setShortcutsOpen(true),
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
    shortcutsOpen,
    setShortcutsOpen,
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
    fireInfo: fd.fireInfo,
    earlyOnMap,
    incidentAt,
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
