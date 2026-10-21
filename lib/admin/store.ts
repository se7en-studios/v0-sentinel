"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_SETTINGS,
  MODE_ROLE,
  type Feat,
  type Meta,
  type Workspace,
} from "./types";

const KEY = "sentinel-admin-workspace-v1";

// ponytail: the workspace lives in this browser's localStorage. Moving it to a
// per-client table (Supabase) is the upgrade once accounts exist.
const EMPTY: Workspace = { features: [], meta: {}, settings: DEFAULT_SETTINGS };

const BASE_LAYERS = ["esri", "s2", "viirs"];
const CONFS = ["l", "n", "h"];
const finite = (c: unknown): boolean =>
  Array.isArray(c) ? c.length > 0 && c.every(finite) : typeof c === "number" && Number.isFinite(c);

const GEOMETRY_FOR = { zone: "Polygon", line: "LineString", route: "LineString", sensor: "Point" } as const;

/** Keeps only features that every renderer can safely handle. */
export function isFeat(f: unknown): f is Feat {
  const x = f as Feat | null;
  const role = MODE_ROLE[String(x?.properties?.mode)];
  return (
    typeof x?.id === "string" &&
    Boolean(role) &&
    x.geometry?.type === GEOMETRY_FOR[role as keyof typeof GEOMETRY_FOR] &&
    finite(x.geometry.coordinates)
  );
}

function load(): Workspace {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as Partial<Workspace>;
    const st = (p.settings ?? {}) as Partial<Workspace["settings"]>;
    const features = Array.isArray(p.features) ? p.features.filter(isFeat) : [];
    const meta = Object.fromEntries(
      features.map((f) => {
        const m = (p.meta ?? {})[f.id];
        return [f.id, { ...m, name: typeof m?.name === "string" ? m.name : f.id }];
      }),
    );
    return {
      features,
      meta,
      settings: {
        ...DEFAULT_SETTINGS,
        ...st,
        baseLayer: BASE_LAYERS.includes(st.baseLayer as string) ? st.baseLayer! : DEFAULT_SETTINGS.baseLayer,
        minConfidence: CONFS.includes(st.minConfidence as string) ? st.minConfidence! : DEFAULT_SETTINGS.minConfidence,
        units: st.units === "km2" ? "km2" : "ha",
        refreshMin: [10, 30, 60].includes(Number(st.refreshMin)) ? Number(st.refreshMin) : DEFAULT_SETTINGS.refreshMin,
        bufferKm: Number.isFinite(Number(st.bufferKm)) ? Number(st.bufferKm) : DEFAULT_SETTINGS.bufferKm,
        valuePerHa: Number.isFinite(Number(st.valuePerHa)) ? Math.max(0, Number(st.valuePerHa)) : 0,
        thresholds: { ...DEFAULT_SETTINGS.thresholds, ...st.thresholds },
        notify: { ...DEFAULT_SETTINGS.notify, ...st.notify },
      },
    };
  } catch {
    return EMPTY;
  }
}

interface Snap {
  features: Feat[];
  meta: Record<string, Meta>;
}
const HISTORY_MAX = 40;

export function useWorkspace() {
  const [ws, setWs] = useState<Workspace>(EMPTY);
  const [ready, setReady] = useState(false);
  const [, bump] = useState(0);
  const skip = useRef(true);
  const latest = useRef(ws);
  latest.current = ws;
  const past = useRef<Snap[]>([]);
  const future = useRef<Snap[]>([]);

  useEffect(() => {
    setWs(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (skip.current) {
      skip.current = false;
      return;
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(ws));
    } catch {
      /* quota or private mode: keep working in memory */
    }
  }, [ws, ready]);

  const remember = useCallback(() => {
    const w = latest.current;
    past.current = [...past.current, { features: w.features, meta: w.meta }].slice(-HISTORY_MAX);
    future.current = [];
    bump((n) => n + 1);
  }, []);

  const setFeatures = useCallback(
    (features: Feat[]) => {
      remember();
      setWs((w) => {
        const ids = new Set(features.map((f) => f.id));
        const meta = Object.fromEntries(Object.entries(w.meta).filter(([id]) => ids.has(id)));
        return { ...w, features, meta };
      });
    },
    [remember],
  );
  const setMeta = useCallback(
    (id: string, patch: Partial<Meta>) =>
      setWs((w) => ({
        ...w,
        meta: { ...w.meta, [id]: { ...w.meta[id], name: w.meta[id]?.name ?? "", ...patch } },
      })),
    [],
  );
  const setSettings = useCallback(
    (patch: Partial<Workspace["settings"]>) => setWs((w) => ({ ...w, settings: { ...w.settings, ...patch } })),
    [],
  );
  const replace = useCallback(
    (next: Workspace) => {
      remember();
      setWs(next);
    },
    [remember],
  );

  const travel = useCallback((from: typeof past, to: typeof past) => {
    const snap = from.current[from.current.length - 1];
    if (!snap) return false;
    const w = latest.current;
    from.current = from.current.slice(0, -1);
    to.current = [...to.current, { features: w.features, meta: w.meta }];
    setWs({ ...w, features: snap.features, meta: snap.meta });
    bump((n) => n + 1);
    return true;
  }, []);
  const undo = useCallback(() => travel(past, future), [travel]);
  const redo = useCallback(() => travel(future, past), [travel]);

  return {
    ws,
    ready,
    setFeatures,
    setMeta,
    setSettings,
    replace,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
