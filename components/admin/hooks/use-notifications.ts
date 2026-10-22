import { useEffect, useMemo, useRef, type RefObject } from "react";
import { toast } from "sonner";
import { evaluateRules } from "@/lib/admin/rules";
import type { EarlyView } from "@/lib/admin/early";
import type { DayForecast } from "@/lib/admin/forecast";
import {
  MODE_ROLE,
  type FiresPayload,
  type Settings,
  type Workspace,
} from "@/lib/admin/types";
import type { Ctx, PanelSeg, SensorState, Tab } from "../ctx";
import { earlyKey, isAcked, ruleKey, zoneKey } from "@/lib/admin/alert-ack";
import { logActivity } from "./use-activity";
import type { MapHandle } from "../map-view";

interface Params {
  ws: Workspace;
  s: Settings;
  payload: FiresPayload | null;
  firesError: string | null;
  zoneHits: Ctx["zoneHits"];
  alertIds: Set<string>;
  earlyByZone: Record<string, EarlyView[]>;
  /** every open early detection, in a zone or not: the baseline of what was already known */
  earlyOpen: EarlyView[];
  /** the first early pull landed: what was already there does not toast */
  earlyReady: boolean;
  sensors: SensorState[];
  last24: number;
  forecast: DayForecast[] | null;
  /** incidents that gained area in the latest day of data, for the growth rule */
  growth: { name: string; ha: number }[];
  sync: string;
  resolveConflict: (keep: "server" | "mine") => void;
  undo: Ctx["undo"];
  redo: Ctx["redo"];
  goTab: (t: Tab) => void;
  setPanelSeg: (s: PanelSeg) => void;
  setPaletteOpen: (f: (o: boolean) => boolean) => void;
  mapRef: RefObject<MapHandle | null>;
}

/** ~5 km: a spot keeps its toast identity even when its first scan drifts a little between polls */
const EARLY_CELL = 0.05;

const canNotifyBrowser = () =>
  typeof Notification !== "undefined" && Notification.permission === "granted";

/** Hotkeys, alert-rule evaluation and every toast / browser notification the panel raises. */
export function useNotifications({
  ws,
  s,
  payload,
  firesError,
  zoneHits,
  alertIds,
  earlyByZone,
  earlyOpen,
  earlyReady,
  sensors,
  last24,
  forecast,
  growth,
  sync,
  resolveConflict,
  undo,
  redo,
  goTab,
  setPanelSeg,
  setPaletteOpen,
  mapRef,
}: Params) {
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
      action: {
        label: "Usar la nube",
        onClick: () => resolveConflict("server"),
      },
      cancel: {
        label: "Mantener lo mío",
        onClick: () => resolveConflict("mine"),
      },
    });
  }, [sync, resolveConflict]);

  // ---- user alert rules ----
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
        last24,
        forecast,
        earlyOpen: Object.fromEntries(
          Object.entries(earlyByZone).map(([id, e]) => [id, e.length]),
        ),
        growth,
      }),
    [
      s.rules,
      ws.features,
      ws.meta,
      zoneHits,
      last24,
      forecast,
      earlyByZone,
      growth,
    ],
  );

  // simulated sensors crossing their threshold: same "only what is new" rule as zone fires
  const seenSensors = useRef<Set<string> | null>(null);
  useEffect(() => {
    const now = new Set(
      sensors.filter((x) => x.reading.alert).map((x) => x.feat.id),
    );
    const prev = seenSensors.current;
    seenSensors.current = now;
    if (!prev || !s.notify.onSensor) return;
    for (const x of sensors) {
      if (!now.has(x.feat.id) || prev.has(x.feat.id)) continue;
      logActivity(
        "sensor",
        x.feat.id,
        `${x.meta.name} fuera de umbral`,
        `${x.reading.value} ${x.reading.unit} · dato simulado`,
      );
      toast.warning(`${x.meta.name} fuera de umbral`, {
        description: `${x.reading.value} ${x.reading.unit} · dato simulado`,
        duration: 10_000,
      });
    }
  }, [sensors, s.notify.onSensor]);

  const seenRules = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!payload) return;
    const prev = seenRules.current;
    seenRules.current = new Set(ruleFirings.keys());
    if (!prev) return;
    for (const [id, detail] of ruleFirings) {
      if (prev.has(id)) continue;
      if (isAcked(ws.alertAck[ruleKey(id)], 0, Date.now())) continue;
      logActivity("rule", id, "Regla de alerta activada", detail);
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
      if (s.notify.browser && canNotifyBrowser())
        new Notification("Sentinel: regla de alerta", {
          body: detail,
          tag: `rule-${id}`,
        });
    }
  }, [ruleFirings, payload, s.notify.browser, ws.alertAck, goTab, setPanelSeg]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPaletteOpen]);

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
      if (isAcked(ws.alertAck[zoneKey(id)], hits, Date.now())) continue;
      const zone = ws.features.find((f) => f.id === id);
      logActivity(
        "zone",
        id,
        `Foco nuevo en ${name}`,
        `${hits} ${hits === 1 ? "detección" : "detecciones"} satelitales en 48 h`,
      );
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
      if (s.notify.browser && canNotifyBrowser())
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
    ws.features,
    ws.alertAck,
    zoneHits,
    goTab,
    mapRef,
  ]);

  // GOES saw heat inside (or next to) a zone and no polar satellite has confirmed it yet
  // "seen" covers every open spot, not only those inside a zone: zones that load late, a
  // switch turned off and on, or a polar pass re-opening a spot must not replay old news
  const seenEarly = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!earlyReady || !s.earlyAlerts) return;
    const cell = (e: EarlyView) =>
      `${Math.round(e.lat / EARLY_CELL)},${Math.round(e.lng / EARLY_CELL)}`;
    const known = new Set(earlyOpen.map(cell));
    const prev = seenEarly.current;
    seenEarly.current = new Set([...(prev ?? []), ...known]);
    if (!prev || !s.notify.onZoneHit) return;
    const now = new Map<string, { zoneId: string; e: EarlyView }>();
    for (const [zoneId, list] of Object.entries(earlyByZone))
      for (const e of list)
        if (!now.has(cell(e))) now.set(cell(e), { zoneId, e });
    for (const [k, { zoneId, e }] of now) {
      if (prev.has(k)) continue;
      // handled (acknowledged or snoozed) spots stay quiet
      if (isAcked(ws.alertAck[earlyKey(e)], 0, Date.now())) continue;
      const name = ws.meta[zoneId]?.name ?? "Zona";
      const min = Math.max(0, Math.round((Date.now() - e.lastAt) / 60_000));
      logActivity(
        "early",
        k,
        `Posible foco cerca de ${name}`,
        `GOES-19 vio calor hace ${min} min; ningún satélite polar lo confirmó todavía.`,
      );
      toast.warning(`Posible foco cerca de ${name}`, {
        description: `GOES-19 vio calor hace ${min} min y ningún satélite polar lo confirmó todavía.`,
        duration: 15_000,
        action: {
          label: "Ver",
          onClick: () => {
            goTab("general");
            mapRef.current?.flyTo([e.lng, e.lat], 11);
          },
        },
      });
      if (s.notify.browser && canNotifyBrowser())
        new Notification("Sentinel: alerta temprana", {
          body: `${name}: calor detectado por GOES-19 hace ${min} min`,
          tag: `early-${k}`,
        });
    }
  }, [
    earlyByZone,
    earlyOpen,
    earlyReady,
    s.earlyAlerts,
    s.notify.onZoneHit,
    s.notify.browser,
    ws.meta,
    ws.alertAck,
    goTab,
    mapRef,
  ]);

  return { ruleFirings };
}
