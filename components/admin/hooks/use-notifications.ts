import { useEffect, useMemo, useRef, type RefObject } from "react";
import { toast } from "sonner";
import { evaluateRules } from "@/lib/admin/rules";
import { translate, type Translate } from "@/lib/admin/i18n";
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
  // toasts fire from effects that must not re-run when the language changes: read it through a ref
  const tRef = useRef<Translate>((k, v) => translate(s.locale, k, v));
  useEffect(() => {
    tRef.current = (k, v) => translate(s.locale, k, v);
  }, [s.locale]);
  // two devices (or tabs) edited the same account: never overwrite silently
  useEffect(() => {
    if (sync !== "conflict") {
      toast.dismiss("sync-conflict");
      return;
    }
    const t = tRef.current;
    toast.warning(t("nt.conflictTitle"), {
      id: "sync-conflict",
      description: t("nt.conflictDesc"),
      duration: Infinity,
      dismissible: false,
      action: {
        label: t("sync.useCloud"),
        onClick: () => resolveConflict("server"),
      },
      cancel: {
        label: t("sync.keepMine"),
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
            name: ws.meta[z.id]?.name ?? translate(s.locale, "res.zone"),
            recent: zoneHits[z.id]?.recent ?? 0,
          })),
        last24,
        forecast,
        earlyOpen: Object.fromEntries(
          Object.entries(earlyByZone).map(([id, e]) => [id, e.length]),
        ),
        growth,
      }, s.locale),
    [
      s.locale,
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
      const t = tRef.current;
      const desc = t("nt.sensorDesc", { v: x.reading.value, unit: x.reading.unit });
      logActivity("sensor", x.feat.id, t("fx.sensorOut", { name: x.meta.name }), desc);
      toast.warning(t("fx.sensorOut", { name: x.meta.name }), {
        description: desc,
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
      const t = tRef.current;
      logActivity("rule", id, t("nt.ruleTitle"), detail);
      toast.warning(t("nt.ruleTitle"), {
        description: detail,
        duration: 12_000,
        action: {
          label: t("nt.ruleView"),
          onClick: () => {
            goTab("general");
            setPanelSeg("Alertas");
          },
        },
      });
      if (s.notify.browser && canNotifyBrowser())
        new Notification(t("nt.ruleBrowser"), {
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
      toast.error(tRef.current("nt.nasaFail"), {
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
        if (!undo()) toast(tRef.current("nt.nothingUndo"));
      } else if ((k === "z" && e.shiftKey) || k === "y") {
        e.preventDefault();
        if (!redo()) toast(tRef.current("nt.nothingRedo"));
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
      const t = tRef.current;
      const name = ws.meta[id]?.name ?? t("res.zone");
      const hits = zoneHits[id]?.recent ?? 0;
      if (isAcked(ws.alertAck[zoneKey(id)], hits, Date.now())) continue;
      const zone = ws.features.find((f) => f.id === id);
      const desc = t(hits === 1 ? "nt.zoneDesc1" : "nt.zoneDescN", { n: hits });
      logActivity("zone", id, t("nt.zoneTitle", { name }), desc);
      toast.warning(t("nt.zoneTitle", { name }), {
        description: desc,
        duration: 12_000,
        action: zone
          ? {
              label: t("nt.view"),
              onClick: () => {
                goTab("general");
                mapRef.current?.fitFeature(zone);
              },
            }
          : undefined,
      });
      if (s.notify.browser && canNotifyBrowser())
        new Notification(t("nt.zoneBrowser"), {
          body: t("nt.zoneBrowserBody", { name, n: hits }),
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
      const t = tRef.current;
      const name = ws.meta[zoneId]?.name ?? t("res.zone");
      const min = Math.max(0, Math.round((Date.now() - e.lastAt) / 60_000));
      logActivity("early", k, t("nt.earlyTitle", { name }), t("nt.earlyAct", { n: min }));
      toast.warning(t("nt.earlyTitle", { name }), {
        description: t("nt.earlyDesc", { n: min }),
        duration: 15_000,
        action: {
          label: t("nt.view"),
          onClick: () => {
            goTab("general");
            mapRef.current?.flyTo([e.lng, e.lat], 11);
          },
        },
      });
      if (s.notify.browser && canNotifyBrowser())
        new Notification(t("nt.earlyBrowser"), {
          body: t("nt.earlyBrowserBody", { name, n: min }),
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
