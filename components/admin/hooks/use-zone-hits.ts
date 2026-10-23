import { useMemo } from "react";
import { useBufferReady } from "./use-buffer-ready";
import { firesInZone } from "@/lib/admin/geo";
import { translate } from "@/lib/admin/i18n";
import { nearestPlace } from "@/lib/admin/places";
import {
  MODE_ROLE,
  type FirePoint,
  type FiresPayload,
  type Workspace,
} from "@/lib/admin/types";
import type { Ctx, HourPoint, KeyEvent } from "../ctx";
import { pointTs } from "./fire-time";

/** Detections per zone ("recent" = last 48 h of real time), zones in alert and the timeline's key events. */
export function useZoneHits(
  ws: Workspace,
  payload: FiresPayload | null,
  allFires: FirePoint[],
  series: HourPoint[],
  bufferKm: number,
  nowStep: number,
) {
  const bufferReady = useBufferReady(bufferKm > 0);
  const zoneHits = useMemo(() => {
    const out: Ctx["zoneHits"] = {};
    if (!payload || !bufferReady) return out;
    const since = nowStep * 600_000 - 48 * 3600_000;
    for (const z of ws.features) {
      if (MODE_ROLE[String(z.properties.mode)] !== "zone") continue;
      const hits = firesInZone(z, allFires, bufferKm);
      out[z.id] = {
        total: hits.length,
        recent: hits.filter((p) => pointTs(payload.days, p) >= since).length,
        last: hits.reduce((m, p) => Math.max(m, pointTs(payload.days, p)), 0),
      };
    }
    return out;
  }, [ws.features, allFires, payload, bufferKm, nowStep, bufferReady]);
  const alertIds = useMemo(
    () =>
      new Set(
        Object.entries(zoneHits)
          .filter(([, h]) => h.recent > 0)
          .map(([id]) => id),
      ),
    [zoneHits],
  );

  const events = useMemo<KeyEvent[]>(() => {
    if (!payload || allFires.length === 0) return [];
    const days = payload.days;
    const out: KeyEvent[] = [];
    let first = allFires[0];
    let strongest = allFires[0];
    for (const p of allFires) {
      if (pointTs(days, p) < pointTs(days, first)) first = p;
      if (p[2] > strongest[2]) strongest = p;
    }
    const locale = ws.settings.locale;
    const place = (p: FirePoint) => {
      const n = nearestPlace(p[0], p[1]);
      return translate(locale, "gen.clusterWhere", { km: n.km, near: n.near });
    };
    out.push({
      id: "first",
      t: pointTs(days, first),
      kind: "first",
      title: translate(locale, "ev.first"),
      sub: place(first),
      at: [first[1], first[0]],
    });
    const peak = series.reduce(
      (m, x) => (x.count > m.count ? x : m),
      series[0] ?? { t: 0, count: 0, frp: 0, cum: 0 },
    );
    if (peak.count > 0)
      out.push({
        id: "peak",
        t: peak.t,
        kind: "peak",
        title: translate(locale, "ev.peak"),
        sub: translate(locale, "ev.peakSub", { n: peak.count }),
      });
    out.push({
      id: "frp",
      t: pointTs(days, strongest),
      kind: "frp",
      title: translate(locale, "ev.frp", { n: Math.round(strongest[2]) }),
      sub: place(strongest),
      at: [strongest[1], strongest[0]],
    });
    for (const z of ws.features) {
      const h = zoneHits[z.id];
      if (h?.total)
        out.push({
          id: `z-${z.id}`,
          t: h.last,
          kind: "zone",
          title: translate(locale, "fx.zone", {
            name: ws.meta[z.id]?.name ?? translate(locale, "fx.zoneFallback"),
          }),
          sub: translate(locale, "ev.zoneSub", { n: h.total }),
          featId: z.id,
        });
    }
    return out.sort((a, b) => b.t - a.t);
  }, [payload, allFires, series, ws.features, ws.meta, ws.settings.locale, zoneHits]);

  return { zoneHits, alertIds, events };
}
