"use client";

// State of the "Incendios" tab: which data (live Argentina or a reconstructed
// case), the filter, the selected fire, the replay cursor and its weather.
// Lives in AdminApp so the panel, the dock and the map layers share it.

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { IncidentBundle, LiveBundle, LiveFireMeta } from "@/lib/incident";
import { matchFire, type FireQuery } from "@/lib/live-match";
import { derive, type Derived } from "./derive";
import type { DnbrStats } from "./severity";

export type TrackingSource = "vivo" | "puerto-patriada";
export type FireFilter = "forestales" | "todos" | "agricolas";
export interface TrackingLayers {
  focos: boolean;
  isocronas: boolean;
  frente: boolean;
  vectores: boolean;
  otros: boolean;
  dnbr: boolean;
}
export type Weather = NonNullable<IncidentBundle["weather"]>;
export interface DnbrFile extends DnbrStats {
  bounds: [number, number][];
}

export const CASES: { id: Exclude<TrackingSource, "vivo">; label: string; when: string }[] = [
  { id: "puerto-patriada", label: "Puerto Patriada", when: "Chubut, enero 2026" },
];

const HOUR = 3_600_000;

export function useTracking(active: boolean) {
  const [source, setSource] = useState<TrackingSource>("vivo");
  const [bundles, setBundles] = useState<Partial<Record<TrackingSource, IncidentBundle | LiveBundle>>>({});
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dnbr, setDnbr] = useState<DnbrFile | null>(null);
  const [filter, setFilter] = useState<FireFilter>("forestales");
  const [selected, setSelected] = useState<number | null>(null);
  const [weather, setWeather] = useState<Record<string, Weather>>({});
  const [cur, setCur] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [layers, setLayers] = useState<TrackingLayers>({ focos: true, isocronas: true, frente: true, vectores: true, otros: true, dnbr: false });
  const [pending, setPending] = useState<FireQuery | null>(null);
  // a camera request from outside the map (a province in the dock); n makes repeats count
  const [view, setView] = useState<{ bbox: [number, number, number, number]; n: number } | null>(null);
  const fitTo = useCallback((bbox: [number, number, number, number]) => setView((v) => ({ bbox, n: (v?.n ?? 0) + 1 })), []);

  // a shared link: ?caso=<id> opens a case, ?en=<lat>,<lng> the live fire at that point
  // (by place, not by number: numbers are reassigned on every run)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const caso = q.get("caso");
    if (caso && CASES.some((c) => c.id === caso)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the shared link once, on mount
      setSource(caso as TrackingSource);
      return;
    }
    const en = q.get("en")?.split(",").map(Number);
    if (en?.length === 2 && en.every(Number.isFinite)) {
      const [lat, lng] = en;
      const r = 0.01;
      setPending({ at: [lng, lat], ring: [[lng - r, lat - r], [lng + r, lat - r], [lng + r, lat + r], [lng - r, lat + r]] });
    }
  }, []);

  const bundle = bundles[source] ?? null;
  const live = bundle && "live" in bundle ? (bundle as LiveBundle) : null;

  // load on first visit of each source
  useEffect(() => {
    if (!active || bundles[source]) return;
    let cancelled = false;
    (async () => {
      try {
        if (source === "vivo") {
          const r = await fetch("/api/admin/live");
          if (r.ok) {
            const b = await r.json();
            if (!cancelled) setBundles((x) => ({ ...x, vivo: b }));
            return;
          }
          const why = ((await r.json().catch(() => null)) as { error?: string } | null)?.error ?? `HTTP ${r.status}`;
          setNote(why);
          const s = await fetch("/data/live/snapshot.json");
          if (!s.ok) throw new Error("sin datos en vivo ni instantánea");
          const b = await s.json();
          if (!cancelled) setBundles((x) => ({ ...x, vivo: b }));
        } else {
          const [b, d] = await Promise.all([
            fetch(`/data/${source}/incident.json`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))),
            fetch(`/data/${source}/dnbr.json`).then((r) => (r.ok ? r.json() : null)),
          ]);
          if (cancelled) return;
          setBundles((x) => ({ ...x, [source]: b }));
          setDnbr(d);
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, source, bundles]);

  // a reconstructed case opens straight on its fire
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a reconstructed case opens on its featured fire once its data arrives
    if (bundle && source !== "vivo" && selected === null) setSelected(bundle.featured);
  }, [bundle, source, selected]);

  const meta = useMemo(() => new Map((live?.live.meta ?? []).map((m) => [m.id, m])), [live]);

  // weather for a live fire comes from NASA POWER (CORS-enabled), once per fire
  const wKey = `${source}:${selected}`;
  useEffect(() => {
    if (!live || selected === null || weather[wKey]) return;
    const m = meta.get(selected);
    if (!m) return;
    const day = (t: number) => new Date(t).toISOString().slice(0, 10).replaceAll("-", "");
    const url =
      `https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=T2M,RH2M,WS10M,WD10M,PRECTOTCORR&community=RE` +
      `&longitude=${m.center[0].toFixed(3)}&latitude=${m.center[1].toFixed(3)}&start=${day(live.live.windowStart - 24 * HOUR)}&end=${day(live.live.windowEnd)}&format=JSON&time-standard=UTC`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const p = j?.properties?.parameter;
        if (!p) return;
        const keys = Object.keys(p.T2M).sort();
        const fill = j.header?.fill_value ?? -999;
        const v = (s: Record<string, number>, k: string, f = 1) => (s[k] === fill ? NaN : Math.round(s[k] * f * 10) / 10);
        const k0 = keys[0];
        setWeather((w) => ({
          ...w,
          [wKey]: {
            source: "NASA POWER · MERRA-2 (reanálisis horario, ~50 km, ~2 días de demora)",
            at: m.center,
            t0: Date.UTC(+k0.slice(0, 4), +k0.slice(4, 6) - 1, +k0.slice(6, 8), +k0.slice(8, 10)),
            temp: keys.map((k) => v(p.T2M, k)),
            rh: keys.map((k) => v(p.RH2M, k)),
            windKmh: keys.map((k) => v(p.WS10M, k, 3.6)),
            windDir: keys.map((k) => v(p.WD10M, k)),
            rainMm: keys.map((k) => v(p.PRECTOTCORR, k)),
          },
        }));
      })
      .catch(() => {});
  }, [live, selected, meta, weather, wKey]);

  const d: Derived | null = useMemo(() => {
    if (!bundle || selected === null) return null;
    if (!bundle.fires.some((f) => f.id === selected)) return null;
    const m = meta.get(selected);
    return derive({
      ...bundle,
      featured: selected,
      ...(live && m ? { name: `Incendio #${selected}`, place: m.name } : {}),
      weather: bundle.weather ?? weather[wKey],
    });
  }, [bundle, selected, meta, live, weather, wKey]);

  // a new fire starts at its latest pass (live) or at ignition (a case)
  const dKey = d ? `${d.b.id}:${d.fire.id}` : "";
  useEffect(() => {
    if (!d) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a new fire resets the player to its first or last step
    setPlaying(false);
    setCur(source === "vivo" ? d.lastStep : d.firstStep);
    setLayers((l) => ({ ...l, dnbr: source !== "vivo" && !!dnbr }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dKey]);

  const end = d ? Math.min(d.b.steps.length - 1, d.lastStep + 2) : 0;
  useEffect(() => {
    if (!playing || !d) return;
    const timer = setInterval(() => {
      setCur((c) => {
        if (c >= end) {
          setPlaying(false);
          return c;
        }
        return c + 1;
      });
    }, 900 / speed);
    return () => clearInterval(timer);
  }, [playing, speed, end, d]);

  const play = useCallback(
    (v: boolean) => {
      if (v && d && cur >= end) setCur(d.firstStep);
      setPlaying(v);
    },
    [d, cur, end],
  );

  const pass = useCallback(
    (m: LiveFireMeta) => (filter === "todos" ? true : filter === "forestales" ? m.forestal : !m.forestal),
    [filter],
  );
  const shown = useMemo(() => (live ? live.live.meta.filter(pass) : []), [live, pass]);

  // a fire asked for from another tab (Sentinel's Incidentes): find it once the live data is in
  useEffect(() => {
    if (!pending || !live) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resolves a pending request from the Incidentes tab once the live data is in
    setPending(null);
    const id = matchFire(live, pending);
    if (id === null) {
      toast("Este grupo no está entre los incendios seguidos", {
        description: "El seguimiento cubre la Argentina con los últimos 10 días de NOAA-20 y NOAA-21.",
      });
      return;
    }
    const m = meta.get(id);
    if (m && !pass(m)) setFilter("todos");
    setSelected(id);
  }, [pending, live, meta, pass]);

  const changeSource = useCallback((s: TrackingSource) => {
    setPlaying(false);
    setSelected(null);
    setSource(s);
  }, []);

  const focus = useCallback((q: FireQuery) => {
    setPlaying(false);
    setSelected(null);
    setSource("vivo");
    setPending(q);
  }, []);

  return {
    source,
    setSource: changeSource,
    bundle,
    live,
    meta,
    shown,
    note,
    error,
    dnbr: source === "vivo" ? null : dnbr,
    filter,
    setFilter,
    selected,
    select: setSelected,
    focus,
    view,
    fitTo,
    d,
    cur,
    setCur,
    playing,
    play,
    speed,
    setSpeed,
    layers,
    setLayers,
  };
}

export type Tracking = ReturnType<typeof useTracking>;
