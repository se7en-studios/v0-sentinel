"use client";

import { cleanRules } from "./rules";
import { cleanAckMap, type AlertAck } from "./alert-ack";
import { cleanIncidentMeta, type IncidentMeta } from "./incident-meta";
import { EMPTY_OPS, cleanOps, type OpsState } from "./resources";
import type { CloudCopy } from "./cloud";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_SETTINGS,
  MODE_ROLE,
  type Feat,
  type Meta,
  type NoteEntry,
  type Workspace,
} from "./types";

const KEY = "sentinel-admin-workspace-v1";

// ponytail: the workspace lives in this browser's localStorage. Moving it to a
// per-client table (Supabase) is the upgrade once accounts exist.
const EMPTY: Workspace = {
  features: [],
  meta: {},
  settings: DEFAULT_SETTINGS,
  notes: "",
  ops: EMPTY_OPS,
  noteLog: [],
  alertAck: {},
  incidentMeta: {},
};

const BASE_LAYERS = ["esri", "s2", "viirs", "light", "topo"];
const CONFS = ["l", "n", "h"];
const finite = (c: unknown): boolean =>
  Array.isArray(c)
    ? c.length > 0 && c.every(finite)
    : typeof c === "number" && Number.isFinite(c);

const GEOMETRY_FOR = {
  zone: "Polygon",
  line: "LineString",
  route: "LineString",
  sensor: "Point",
} as const;

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

/** What this browser keeps per account: the workspace plus enough to know whether the cloud copy is behind. */
interface Stored {
  ws: Workspace;
  /** ms epoch of the last local edit */
  at: number;
  /** edits not yet confirmed by the cloud */
  dirty: boolean;
  /** cloud revision this copy was based on */
  rev: number;
}

// one key per account: a shared key let the next login adopt (and upload) the previous account's work
const keyFor = (uid?: string) => (uid ? `${KEY}:${uid}` : KEY);

function readStored(key: string): Stored | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const j = JSON.parse(raw);
    if (j && typeof j === "object" && "ws" in j)
      return {
        ws: parseWorkspace(j.ws),
        at: Number(j.at) || 0,
        dirty: j.dirty === true,
        rev: Number(j.rev) || 0,
      };
    return { ws: parseWorkspace(j), at: 0, dirty: false, rev: 0 }; // pre-envelope format
  } catch {
    return null;
  }
}

function writeStored(key: string, v: Stored) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* quota or private mode: keep working in memory */
  }
}

// sized so the log stays near 200 kB: the whole workspace is one Firestore document capped at 900 kB
export const NOTE_LOG_MAX = 200;
export const NOTE_TEXT_MAX = 1000;

/** Untrusted stored notes to a safe list; drops anything malformed, never throws. */
export function cleanNoteLog(input: unknown): NoteEntry[] {
  if (!Array.isArray(input)) return [];
  const out: NoteEntry[] = [];
  for (const n of input) {
    if (!n || typeof n !== "object") continue;
    const { id, t, by, text, featId } = n as Record<string, unknown>;
    if (typeof id !== "string" || typeof text !== "string" || !Number.isFinite(t))
      continue;
    const body = text.trim().slice(0, NOTE_TEXT_MAX);
    if (!body) continue;
    out.push({
      id: id.slice(0, 40),
      t: Number(t),
      by: typeof by === "string" ? by.slice(0, 120) : "",
      text: body,
      ...(typeof featId === "string" && featId ? { featId: featId.slice(0, 60) } : {}),
    });
    if (out.length >= NOTE_LOG_MAX) break;
  }
  return out;
}

/** Turns untrusted stored data (localStorage or cloud) into a safe Workspace. */
export function parseWorkspace(input: unknown): Workspace {
  try {
    const p = (input ?? {}) as Partial<Workspace>;
    const st = (p.settings ?? {}) as Partial<Workspace["settings"]>;
    const features = Array.isArray(p.features) ? p.features.filter(isFeat) : [];
    const meta = Object.fromEntries(
      features.map((f) => {
        const m = (p.meta ?? {})[f.id];
        return [
          f.id,
          { ...m, name: typeof m?.name === "string" ? m.name : f.id },
        ];
      }),
    );
    return {
      features,
      meta,
      notes: typeof p.notes === "string" ? p.notes.slice(0, 20_000) : "",
      ops: cleanOps(p.ops),
      noteLog: cleanNoteLog(p.noteLog),
      alertAck: cleanAckMap(p.alertAck),
      incidentMeta: cleanIncidentMeta(p.incidentMeta),
      settings: {
        ...DEFAULT_SETTINGS,
        ...st,
        baseLayer: BASE_LAYERS.includes(st.baseLayer as string)
          ? st.baseLayer!
          : DEFAULT_SETTINGS.baseLayer,
        minConfidence: CONFS.includes(st.minConfidence as string)
          ? st.minConfidence!
          : DEFAULT_SETTINGS.minConfidence,
        hideNoise: st.hideNoise !== false,
        useModis: st.useModis !== false,
        earlyAlerts: st.earlyAlerts !== false,
        minScore: Number.isFinite(Number(st.minScore))
          ? Math.min(90, Math.max(0, Math.round(Number(st.minScore))))
          : 0,
        units: st.units === "km2" ? "km2" : "ha",
        refreshMin: [10, 30, 60].includes(Number(st.refreshMin))
          ? Number(st.refreshMin)
          : DEFAULT_SETTINGS.refreshMin,
        bufferKm: Number.isFinite(Number(st.bufferKm))
          ? Number(st.bufferKm)
          : DEFAULT_SETTINGS.bufferKm,
        valuePerHa: Number.isFinite(Number(st.valuePerHa))
          ? Math.max(0, Number(st.valuePerHa))
          : 0,
        opacity: Object.fromEntries(
          Object.entries(DEFAULT_SETTINGS.opacity).map(([k, d]) => {
            const v = Number(
              (st.opacity as Record<string, unknown> | undefined)?.[k],
            );
            return [k, Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : d];
          }),
        ) as Workspace["settings"]["opacity"],
        thresholds: { ...DEFAULT_SETTINGS.thresholds, ...st.thresholds },
        notify: { ...DEFAULT_SETTINGS.notify, ...st.notify },
        rules: cleanRules(st.rules),
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

export type SyncState =
  | "local"
  | "loading"
  | "saving"
  | "saved"
  | "error"
  | "conflict";

export function useWorkspace(uid?: string) {
  const [ws, setWs] = useState<Workspace>(EMPTY);
  const [ready, setReady] = useState(false);
  const [, bump] = useState(0);
  const [loadTick, setLoadTick] = useState(0);
  const [sync, setSync] = useState<SyncState>(uid ? "loading" : "local");
  const dirty = useRef(false);
  const loadFailed = useRef(false);
  const conflicted = useRef(false);
  const conflictRemote = useRef<CloudCopy | null>(null);
  const rev = useRef(0);
  const editedAt = useRef(0);
  const inflight = useRef(false);
  const queued = useRef(false);
  const skip = useRef(true);
  const latest = useRef(ws);
  latest.current = ws;
  const past = useRef<Snap[]>([]);
  const future = useRef<Snap[]>([]);
  const prevUid = useRef<string | undefined>(uid);

  useEffect(() => {
    if (prevUid.current !== uid) {
      // another account in the same tab: nothing of the previous one may reach it
      prevUid.current = uid;
      dirty.current = false;
      rev.current = 0;
      queued.current = false;
      editedAt.current = 0;
      past.current = [];
      future.current = [];
      skip.current = true;
      setReady(false);
      setWs(EMPTY);
    }
    loadFailed.current = false;
    conflicted.current = false;
    conflictRemote.current = null;
    if (!uid) {
      setWs(readStored(KEY)?.ws ?? EMPTY);
      setReady(true);
      return;
    }
    // cloud account: the server copy wins unless this browser holds newer edits it never managed to upload
    let cancelled = false;
    (async () => {
      let pushNow = false;
      try {
        const { loadCloud } = await import("./cloud");
        const remote = await loadCloud(uid);
        if (cancelled) return;
        const mine = readStored(keyFor(uid));
        loadFailed.current = false;
        conflicted.current = false;
        conflictRemote.current = null;
        if (remote) {
          const alreadyUp = mine?.dirty && mine.at === remote.clientAt;
          // while a conflict is open keep the base this browser edited from, so a reload cannot silently overwrite the server
          const diverged = mine?.dirty && !alreadyUp && mine.rev !== remote.rev;
          rev.current = diverged ? mine.rev : remote.rev;
          if (alreadyUp) {
            // the upload landed but the tab died before it could say so
            const next = parseWorkspace(remote.data);
            writeStored(keyFor(uid), { ws: next, at: mine.at, dirty: false, rev: remote.rev });
            setWs(next);
          } else if (mine?.dirty && !diverged) {
            setWs(mine.ws);
            pushNow = true;
          } else if (diverged) {
            // both sides changed since they last agreed: let the user choose
            setWs(mine.ws);
            conflicted.current = true;
            conflictRemote.current = remote;
            dirty.current = true;
            setSync("conflict");
          } else {
            setWs(parseWorkspace(remote.data));
          }
        } else {
          rev.current = 0;
          let seed = mine?.ws;
          if (!seed || !seed.features.length) {
            // first login on this browser: adopt the pre-account workspace once, then drop it so no other account can
            const legacy = readStored(KEY);
            if (legacy && legacy.ws.features.length) {
              seed = legacy.ws;
              writeStored(keyFor(uid), { ws: seed, at: Date.now(), dirty: true, rev: 0 });
              try {
                localStorage.removeItem(KEY);
              } catch {
                /* private mode */
              }
            }
          }
          seed = seed ?? EMPTY;
          setWs(seed);
          pushNow = seed.features.length > 0;
        }
        if (pushNow) dirty.current = true;
        skip.current = !pushNow;
        if (!conflicted.current) setSync(pushNow ? "saving" : "saved");
      } catch {
        if (cancelled) return;
        setWs(readStored(keyFor(uid))?.ws ?? EMPTY);
        loadFailed.current = true; // never overwrite the server copy we couldn't read
        setSync("error");
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, loadTick]);

  const push = useCallback(
    async (force = false) => {
      if (!uid || loadFailed.current || conflicted.current) return;
      if (!dirty.current && !force) return;
      if (inflight.current) {
        queued.current = true;
        return;
      }
      inflight.current = true;
      const w = latest.current;
      const at = editedAt.current || Date.now();
      setSync("saving");
      try {
        const cloud = await import("./cloud");
        try {
          rev.current = await cloud.saveCloud(uid, w, rev.current, at, force);
          const key = keyFor(uid);
          const cur = readStored(key);
          // only mark clean if nothing was edited while the request was in flight
          if (cur)
            writeStored(key, { ...cur, rev: rev.current, dirty: cur.at !== at });
          if (editedAt.current === at) dirty.current = false;
          setSync(dirty.current ? "saving" : "saved");
        } catch (e) {
          if (!(e instanceof cloud.ConflictError)) throw e;
          conflicted.current = true;
          conflictRemote.current = await cloud.loadCloud(uid).catch(() => null);
          setSync("conflict");
        }
      } catch {
        setSync("error"); // offline, or the chunk failed to load: the next edit or "Reintentar" tries again
      } finally {
        inflight.current = false;
        if (queued.current) {
          queued.current = false;
          void push();
        }
      }
    },
    [uid],
  );

  useEffect(() => {
    if (!ready) return;
    if (skip.current) {
      skip.current = false;
      return;
    }
    editedAt.current = Date.now();
    writeStored(keyFor(uid), {
      ws,
      at: editedAt.current,
      dirty: Boolean(uid),
      rev: rev.current,
    });
    if (!uid || loadFailed.current || conflicted.current) return;
    dirty.current = true;
    setSync("saving");
    const t = setTimeout(() => void push(), 1200);
    return () => clearTimeout(t);
  }, [ws, ready, uid, push]);

  // closing or hiding the tab inside the debounce window must not lose the last edits
  useEffect(() => {
    if (!uid) return;
    const flush = () => {
      if (document.visibilityState === "hidden" && dirty.current) void push();
    };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, [uid, push]);

  const retry = useCallback(() => {
    if (loadFailed.current) setLoadTick((n) => n + 1);
    else void push(true);
  }, [push]);

  const resolveConflict = useCallback(
    (choice: "server" | "mine") => {
      const remote = conflictRemote.current;
      if (choice === "server" && !remote) {
        conflicted.current = false;
        setLoadTick((n) => n + 1);
        return;
      }
      conflicted.current = false;
      conflictRemote.current = null;
      if (remote) rev.current = remote.rev;
      if (choice === "server" && remote) {
        const next = parseWorkspace(remote.data);
        dirty.current = false;
        skip.current = true;
        writeStored(keyFor(uid), {
          ws: next,
          at: Date.now(),
          dirty: false,
          rev: remote.rev,
        });
        setWs(next);
        setSync("saved");
      } else {
        dirty.current = true;
        void push(true);
      }
    },
    [uid, push],
  );

  const remember = useCallback(() => {
    const w = latest.current;
    past.current = [
      ...past.current,
      { features: w.features, meta: w.meta },
    ].slice(-HISTORY_MAX);
    future.current = [];
    bump((n) => n + 1);
  }, []);

  const setFeatures = useCallback(
    (features: Feat[]) => {
      remember();
      setWs((w) => {
        const ids = new Set(features.map((f) => f.id));
        const meta = Object.fromEntries(
          Object.entries(w.meta).filter(([id]) => ids.has(id)),
        );
        return { ...w, features, meta };
      });
    },
    [remember],
  );
  const setMeta = useCallback(
    (id: string, patch: Partial<Meta>) =>
      setWs((w) => ({
        ...w,
        meta: {
          ...w.meta,
          [id]: { ...w.meta[id], name: w.meta[id]?.name ?? "", ...patch },
        },
      })),
    [],
  );
  const setSettings = useCallback(
    (patch: Partial<Workspace["settings"]>) =>
      setWs((w) => ({ ...w, settings: { ...w.settings, ...patch } })),
    [],
  );
  const setNotes = useCallback(
    (notes: string) => setWs((w) => ({ ...w, notes: notes.slice(0, 20_000) })),
    [],
  );
  const addNote = useCallback((text: string, by: string, featId?: string) => {
    const body = text.trim().slice(0, NOTE_TEXT_MAX);
    if (!body) return;
    const id = (
      globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
    ).slice(0, 12);
    const entry: NoteEntry = {
      id,
      t: Date.now(),
      by: by.slice(0, 120),
      text: body,
      ...(featId ? { featId } : {}),
    };
    setWs((w) => ({ ...w, noteLog: [entry, ...w.noteLog].slice(0, NOTE_LOG_MAX) }));
  }, []);
  const removeNote = useCallback(
    (id: string) =>
      setWs((w) => ({ ...w, noteLog: w.noteLog.filter((n) => n.id !== id) })),
    [],
  );
  const setAck = useCallback(
    (key: string, entry: AlertAck | null) =>
      setWs((w) => {
        const next = { ...w.alertAck };
        if (entry) next[key] = entry;
        else delete next[key];
        return { ...w, alertAck: next };
      }),
    [],
  );
  const setIncidentMeta = useCallback(
    (id: string, entry: IncidentMeta) =>
      setWs((w) => ({ ...w, incidentMeta: { ...w.incidentMeta, [id]: entry } })),
    [],
  );
  const setOps = useCallback(
    (update: (o: OpsState) => OpsState) =>
      setWs((w) => ({ ...w, ops: update(w.ops) })),
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
    setNotes,
    addNote,
    removeNote,
    setAck,
    setIncidentMeta,
    setOps,
    undo,
    redo,
    sync,
    retry,
    resolveConflict,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
