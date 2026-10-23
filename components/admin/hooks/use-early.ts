import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resolveEarly, type EarlyView, type PolarRef } from "@/lib/admin/early";
import { firesInZone } from "@/lib/admin/geo";
import { useBufferReady } from "./use-buffer-ready";
import {
  MODE_ROLE,
  type EarlyPayload,
  type FirePoint,
  type Feat,
} from "@/lib/admin/types";
import type { CloudSession } from "../use-admin";
import { isEarlyPayload } from "@/lib/admin/payload-guard";
import { adminJson } from "@/lib/admin/admin-fetch";
import { useRecover } from "./use-recover";

const POLL_MS = 5 * 60_000;
/** a spot GOES stopped seeing this long ago is no longer news (burnt out, or hidden by cloud) */
const ACTIVE_MS = 90 * 60_000;
const NO_EARLY: EarlyView[] = [];

/**
 * GOES-19 early warning: polls the fast endpoint every 5 minutes (the polar data refreshes every
 * 30), resolves each spot against the polar detections and tells which ones still need acting on.
 */
export function useEarly(
  cloud: CloudSession | undefined,
  enabled: boolean,
  polar: PolarRef[],
  zones: Feat[],
  bufferKm: number,
  nowStep: number,
) {
  const [payload, setPayload] = useState<EarlyPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const mine = ++seq.current;
    try {
      const j = await adminJson<EarlyPayload>("/api/admin/early", cloud?.getToken, {
        errorMessage: "Error al cargar alertas tempranas",
      });
      if (!isEarlyPayload(j)) throw new Error("Respuesta de alertas tempranas inválida");
      if (mine !== seq.current) return;
      setPayload(j);
      setError(null);
    } catch (e) {
      if (mine !== seq.current) return;
      setError(
        e instanceof Error ? e.message : "Error al cargar alertas tempranas",
      );
    }
  }, [cloud]);

  useEffect(() => {
    if (!enabled) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load() resolves into state by design
    load();
    const t = setInterval(() => {
      if (!document.hidden) load();
    }, POLL_MS);
    return () => clearInterval(t);
  }, [enabled, load]);

  useRecover(load, enabled && error !== null);

  const early = useMemo(
    () => (enabled && payload ? resolveEarly(payload.early, polar) : NO_EARLY),
    [enabled, payload, polar],
  );
  // open and still showing: what an operator should look at
  const earlyOpen = useMemo(
    () =>
      early.filter(
        (e) => e.status === "open" && e.lastAt >= nowStep * 600_000 - ACTIVE_MS,
      ),
    [early, nowStep],
  );
  // open spots inside (or within the alert radius of) each zone
  const bufferReady = useBufferReady(bufferKm > 0);
  const earlyByZone = useMemo(() => {
    const out: Record<string, EarlyView[]> = {};
    if (earlyOpen.length === 0 || !bufferReady) return out;
    const pseudo = new Map<FirePoint, EarlyView>(
      earlyOpen.map((e) => [[e.lat, e.lng, e.frp, 1, 0, 0, 0], e]),
    );
    const pts = [...pseudo.keys()];
    for (const z of zones) {
      if (MODE_ROLE[String(z.properties.mode)] !== "zone") continue;
      const hits = firesInZone(z, pts, bufferKm).map((p) => pseudo.get(p)!);
      if (hits.length) out[z.id] = hits;
    }
    return out;
  }, [earlyOpen, zones, bufferKm, bufferReady]);

  return {
    earlyPayload: payload,
    earlyError: error,
    refreshEarly: load,
    early,
    earlyOpen,
    earlyByZone,
  };
}
