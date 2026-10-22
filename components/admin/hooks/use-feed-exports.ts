import { useEffect, useMemo, type RefObject } from "react";
import { toast } from "sonner";
import { areaHa, fmtArea } from "@/lib/admin/geo";
import { nearestPlace } from "@/lib/admin/places";
import {
  downloadDataUrl,
  downloadFiresCsv,
  printReport,
} from "@/lib/admin/report";
import { FLEET } from "@/lib/admin/sim";
import {
  MODE_ROLE,
  type FireCluster,
  type FirePoint,
  type FiresPayload,
  type Region,
  type Settings,
  type Workspace,
} from "@/lib/admin/types";
import type { Ctx, FeedItem, FireStats, SensorState } from "../ctx";
import type { MapHandle } from "../map-view";
import type { CloudSession } from "../use-admin";
import { pointTs } from "./fire-time";

interface Params {
  ws: Workspace;
  s: Settings;
  region: Region;
  payload: FiresPayload | null;
  allFires: FirePoint[];
  fires: FirePoint[];
  stats: FireStats;
  clusters: FireCluster[];
  zoneHits: Ctx["zoneHits"];
  sensors: SensorState[];
  rtb: Set<string>;
  now: number;
  view: "2d" | "3d";
  setView: (v: "2d" | "3d") => void;
  ready: boolean;
  cloud?: CloudSession;
  mapRef: RefObject<MapHandle | null>;
}

/** Activity feed, exposure figures, CSV/PDF/PNG exports and view/read-only share links. */
export function useFeedExports({
  ws,
  s,
  region,
  payload,
  allFires,
  fires,
  stats,
  clusters,
  zoneHits,
  sensors,
  rtb,
  now,
  view,
  setView,
  ready,
  cloud,
  mapRef,
}: Params) {
  // ---- activity feed: real detections + zone/sensor events ----
  const feed = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [];
    const days = payload?.days ?? [];
    const cutoff = now - 24 * 3600_000;
    allFires
      .filter((p) => p[3] >= 1 && pointTs(days, p) >= cutoff)
      .sort((a, b) => b[2] - a[2])
      .slice(0, 6)
      .forEach((p) => {
        const near = nearestPlace(p[0], p[1]);
        items.push({
          id: `f-${p[0]}-${p[1]}-${p[5]}`,
          t: pointTs(days, p),
          kind: "fire",
          title: `Foco FRP ${Math.round(p[2])} MW`,
          sub: `${near.km} km de ${near.near} · confianza ${["baja", "nominal", "alta"][p[3]]}`,
          at: [p[1], p[0]],
        });
      });
    for (const z of ws.features) {
      const h = zoneHits[z.id];
      if (!h?.recent) continue;
      items.push({
        id: `z-${z.id}`,
        t: h.last,
        kind: "zone",
        title: `Foco en ${ws.meta[z.id]?.name ?? "zona"}`,
        sub: `${h.recent} detecciones en 48 h (radio ${s.bufferKm} km)`,
        featId: z.id,
      });
    }
    for (const sn of sensors) {
      if (!sn.reading.alert) continue;
      items.push({
        id: `s-${sn.feat.id}`,
        t: now,
        kind: "sensor",
        title: `${sn.meta.name} fuera de umbral`,
        sub: `${sn.reading.value} ${sn.reading.unit}`,
        featId: sn.feat.id,
        sim: true,
      });
    }
    for (const id of rtb) {
      items.push({
        id: `r-${id}`,
        t: now,
        kind: "drone",
        title: `${FLEET.find((d) => d.id === id)?.name} retornando al dock`,
        sub: "Orden manual del operador",
        sim: true,
      });
    }
    return items.sort((a, b) => b.t - a.t);
  }, [
    allFires,
    payload,
    ws.features,
    ws.meta,
    zoneHits,
    sensors,
    rtb,
    now,
    s.bufferKm,
  ]);

  // ---- exposure & exports ----
  const protectedHa = useMemo(
    () =>
      ws.features
        .filter((f) => MODE_ROLE[String(f.properties.mode)] === "zone")
        .reduce((a, z) => a + areaHa(z), 0),
    [ws.features],
  );
  const atRiskHa = useMemo(
    () =>
      ws.features
        .filter((f) => (zoneHits[f.id]?.recent ?? 0) > 0)
        .reduce((a, z) => a + areaHa(z), 0),
    [ws.features, zoneHits],
  );
  const exportCsv = () => payload && downloadFiresCsv(fires, payload.days);
  const exportReport = async () =>
    printReport({
      mapImage: (await mapRef.current?.snapshot()) ?? null,
      org: s.org,
      stats,
      zones: ws.features
        .filter((f) => MODE_ROLE[String(f.properties.mode)] === "zone")
        .map((z) => ({
          name: ws.meta[z.id]?.name ?? "Zona",
          area: fmtArea(areaHa(z), s.units),
          recent: zoneHits[z.id]?.recent ?? 0,
          total: zoneHits[z.id]?.total ?? 0,
        })),
      clusters: clusters.map((c) => ({
        text: `${c.km} km de ${c.near}`,
        count: c.count,
        frp: c.frp,
      })),
      exposure:
        s.valuePerHa > 0
          ? `Valor bajo vigilancia: USD ${Math.round(protectedHa * s.valuePerHa).toLocaleString("es-AR")} (${fmtArea(protectedHa, s.units)} a USD ${s.valuePerHa}/ha). En zonas con focos recientes: USD ${Math.round(atRiskHa * s.valuePerHa).toLocaleString("es-AR")}.`
          : null,
    });

  // restore a shared view (#v=lng,lat,zoom,view)
  useEffect(() => {
    if (!ready) return;
    const m = window.location.hash.match(
      /^#v=(-?[\d.]+),(-?[\d.]+),([\d.]+),(2d|3d)$/,
    );
    if (!m) return;
    const t = setTimeout(() => {
      setView(m[4] as "2d" | "3d");
      mapRef.current?.flyTo([Number(m[1]), Number(m[2])], Number(m[3]));
    }, 1800);
    return () => clearTimeout(t);
  }, [ready, setView, mapRef]);

  function shareView() {
    const v = mapRef.current?.getView();
    if (!v) return toast("Abrí un panel con mapa para compartir la vista");
    const url = `${window.location.origin}/admin#v=${v.center[0].toFixed(4)},${v.center[1].toFixed(4)},${v.zoom.toFixed(2)},${view}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Enlace de la vista copiado"),
      () => toast.error("No se pudo copiar el enlace"),
    );
  }
  // frozen, tokenised copy for people without an account; contacts and settings stay out
  async function shareReadOnly() {
    if (!cloud) return;
    const v = mapRef.current?.getView();
    try {
      const { createShare, SHARE_DAYS } = await import("@/lib/admin/share");
      const { token, expiresAt } = await createShare(cloud.uid, {
        v: 1,
        org: s.org,
        region: {
          name: region.name,
          center: v?.center ?? region.center,
          zoom: v?.zoom ?? region.zoom,
        },
        baseLayer: s.baseLayer,
        features: ws.features,
        meta: ws.meta,
        fires,
        days: payload?.days ?? [],
        createdAt: Date.now(),
      });
      const url = `${window.location.origin}/admin/ver/${token}`;
      await navigator.clipboard.writeText(url);
      toast.success("Enlace de solo lectura copiado", {
        description: `Vence en ${SHARE_DAYS} días (${new Date(expiresAt).toLocaleDateString("es-AR", { day: "numeric", month: "long" })}). Muestra una foto de tus zonas y focos, sin contactos.`,
        duration: 9000,
      });
    } catch {
      toast.error("No se pudo crear el enlace");
    }
  }
  async function revokeLinks() {
    if (!cloud) return;
    try {
      const { revokeShares } = await import("@/lib/admin/share");
      const n = await revokeShares(cloud.uid);
      toast.success(
        n
          ? `${n} ${n === 1 ? "enlace revocado" : "enlaces revocados"}`
          : "No había enlaces activos",
      );
    } catch {
      toast.error("No se pudieron revocar los enlaces");
    }
  }
  async function exportPng() {
    const img = await mapRef.current?.snapshot();
    if (!img) return toast("Abrí un panel con mapa para exportar la imagen");
    downloadDataUrl(
      `sentinel-mapa-${new Date().toISOString().slice(0, 10)}.jpg`,
      img,
    );
    toast.success("Mapa exportado");
  }

  return {
    feed,
    protectedHa,
    atRiskHa,
    exportCsv,
    exportReport,
    shareView,
    shareReadOnly,
    revokeLinks,
    exportPng,
  };
}
