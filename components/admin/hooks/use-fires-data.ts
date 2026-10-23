import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isModis } from "@/lib/admin/fire-sources";
import type { PolarRef } from "@/lib/admin/early";
import {
  applyCover,
  classifyPoints,
  coverCandidates,
  fireInfoMap,
} from "@/lib/admin/noise";
import { firesInZone } from "@/lib/admin/geo";
import { incidentContaining } from "@/lib/admin/map-popup";
import { buildIncidents, recentGrowth } from "@/lib/admin/incident";
import { nearestPlace } from "@/lib/admin/places";
import { detectionHectares } from "@/lib/admin/history";
import type { Feat, FireCluster, FiresPayload, Settings } from "@/lib/admin/types";
import type { FireStats, HourPoint } from "../ctx";
import type { CloudSession } from "../use-admin";
import { ART_MS, artPerDay, pointTs } from "./fire-time";
import { useCover } from "./use-cover";

const CONF_MIN = { l: 0, n: 1, h: 2 } as const;
const EMPTY_CLUSTERS: FireCluster[] = [];
const EMPTY_ZONES: Feat[] = [];
const COVER_INCIDENTS = 20;
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
  s: Pick<
    Settings,
    "refreshMin" | "minConfidence" | "hideNoise" | "minScore" | "useModis"
  >,
  /** the user's zones: new detections inside them get their land cover checked */
  zones: Feat[] = EMPTY_ZONES,
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
  const baseClassified = useMemo(
    () => classifyPoints(payload?.points ?? []),
    [payload],
  );
  const keeps = useCallback(
    (p: FiresPayload["points"][number], i: number, c: typeof baseClassified) =>
      p[3] >= minConf &&
      (s.useModis || !isModis(p[7])) &&
      c.score[i] >= s.minScore &&
      !(s.hideNoise && c.reason[i]),
    [minConf, s.useModis, s.minScore, s.hideNoise],
  );
  // land cover is only looked up where it matters: incident centres and new detections in zones or incidents
  const coverTargets = useMemo(() => {
    const pts = payload?.points ?? [];
    const base = pts.filter((p, i) => keeps(p, i, baseClassified));
    const incidents = buildIncidents(base, COVER_INCIDENTS);
    const fresh = pts.filter((p, i) => baseClassified.fresh[i] && keeps(p, i, baseClassified));
    const inZones = new Set(zones.flatMap((z) => firesInZone(z, fresh, 0)));
    const relevant = fresh.filter(
      (p) => inZones.has(p) || incidentContaining(incidents, p[0], p[1]),
    );
    return coverCandidates(incidents, relevant);
  }, [payload, baseClassified, keeps, zones]);
  const nonBurnable = useCover(cloud, coverTargets);
  const classified = useMemo(
    () => applyCover(payload?.points ?? [], baseClassified, nonBurnable),
    [payload, baseClassified, nonBurnable],
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
      (payload?.points ?? []).filter((p, i) => keeps(p, i, classified)),
    [payload, classified, keeps],
  );
  // what a GOES detection is checked against: nominal-or-better polar pixels, flagged when they look fixed
  const polarRefs = useMemo<PolarRef[]>(() => {
    if (!payload) return [];
    const out: PolarRef[] = [];
    payload.points.forEach((p, i) => {
      if (p[3] > 0 && (s.useModis || !isModis(p[7])))
        out.push({
          lat: p[0],
          lng: p[1],
          at: pointTs(payload.days, p),
          noise: classified.reason[i] !== null,
        });
    });
    return out;
  }, [payload, classified, s.useModis]);

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
      hectares: Math.round(detectionHectares(allFires)),
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
  // incidents that gained area in the newest day of data, named after the nearest town, for the growth alert rule
  const growth = useMemo(
    () =>
      payload
        ? recentGrowth(
            buildIncidents(allFires, 20),
            payload.days.length - 1,
          ).map((g) => ({
            name: `cerca de ${nearestPlace(g.lat, g.lng).near}`,
            ha: g.ha,
          }))
        : [],
    [payload, allFires],
  );

  return {
    payload,
    firesError,
    loading,
    load,
    noiseCount,
    fireInfo,
    polarRefs,
    allFires,
    stats,
    range,
    series,
    lastDetection,
    clusters,
    growth,
  };
}
