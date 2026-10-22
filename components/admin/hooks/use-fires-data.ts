import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { classifyPoints, fireInfoMap } from "@/lib/admin/noise";
import { HA_PER_DETECTION } from "@/lib/admin/history";
import type { FireCluster, FiresPayload, Settings } from "@/lib/admin/types";
import type { FireStats, HourPoint } from "../ctx";
import type { CloudSession } from "../use-admin";
import { ART_MS, artPerDay, pointTs } from "./fire-time";

const CONF_MIN = { l: 0, n: 1, h: 2 } as const;
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

/** Satellite payload: polling load, confidence/noise filters, stats and the hourly series. */
export function useFiresData(
  cloud: CloudSession | undefined,
  s: Pick<Settings, "refreshMin" | "minConfidence" | "hideNoise">,
) {
  const [payload, setPayload] = useState<FiresPayload | null>(null);
  const [firesError, setFiresError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load() flips loading synchronously by design
    load();
    const t = setInterval(
      load,
      Math.max(5, Number(s.refreshMin) || 30) * 60_000,
    );
    return () => clearInterval(t);
  }, [load, s.refreshMin]);

  const minConf = CONF_MIN[s.minConfidence];
  // industrial heat (fixed pixels, known sites) is scored apart so the user can see what was left out
  const classified = useMemo(
    () => classifyPoints(payload?.points ?? []),
    [payload],
  );
  const fireInfo = useMemo(
    () => fireInfoMap(payload?.points ?? [], classified),
    [payload, classified],
  );
  const noiseCount = useMemo(
    () =>
      (payload?.points ?? []).filter(
        (p, i) => p[3] >= minConf && classified.reason[i],
      ).length,
    [payload, classified, minConf],
  );
  const allFires = useMemo(
    () =>
      (payload?.points ?? []).filter(
        (p, i) => p[3] >= minConf && !(s.hideNoise && classified.reason[i]),
      ),
    [payload, minConf, classified, s.hideNoise],
  );

  const stats = useMemo<FireStats>(() => {
    if (!payload) return EMPTY_STATS;
    const days = payload.days;
    // eslint-disable-next-line react-hooks/purity -- stats are relative to the render-time clock
    const cutoff = Date.now() - 24 * 3600 * 1000;
    const byDay = new Map<string, { count: number; frp: number }>();
    const perHour = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: 0,
    }));
    let last24 = 0;
    let frp = 0;
    let night = 0;
    const conf = [0, 0, 0];
    for (const p of allFires) {
      const dayKey = new Date(pointTs(days, p) - ART_MS)
        .toISOString()
        .slice(0, 10);
      const e = byDay.get(dayKey) ?? { count: 0, frp: 0 };
      e.count += 1;
      e.frp += p[2];
      byDay.set(dayKey, e);
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
      hectares: Math.round(
        new Set(
          allFires.map(
            (p) => `${Math.round(p[0] / 0.004)}:${Math.round(p[1] / 0.004)}`,
          ),
        ).size * HA_PER_DETECTION,
      ),
      perDay: artPerDay(byDay, days[0]),
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
      // eslint-disable-next-line react-hooks/purity -- timeline range ends at the render-time clock
      : Date.now() - 10 * 864e5;
    // eslint-disable-next-line react-hooks/purity -- timeline range ends at the render-time clock
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

  // newest detection actually received, to tell "no fires" from "no fresh data"
  const lastDetection = useMemo(
    () =>
      payload?.points.reduce(
        (m, p) => Math.max(m, pointTs(payload.days, p)),
        0,
      ) ?? 0,
    [payload],
  );
  const clusters = payload?.clusters ?? EMPTY_CLUSTERS;

  return {
    payload,
    firesError,
    loading,
    load,
    noiseCount,
    fireInfo,
    allFires,
    stats,
    range,
    series,
    lastDetection,
    clusters,
  };
}
