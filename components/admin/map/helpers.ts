import * as maplibregl from "maplibre-gl";
import type { FirePoint } from "@/lib/admin/types";
import type { EarlyView } from "@/lib/admin/early";
import { satLabel } from "@/lib/admin/fire-sources";
import type { FireInfo } from "@/lib/admin/noise";
import { terrainLine, type TerrainInfo } from "@/lib/admin/terrain";

export const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const setSource = (
  map: maplibregl.Map,
  id: string,
  data: GeoJSON.FeatureCollection,
) => (map.getSource(id) as maplibregl.GeoJSONSource | undefined)?.setData(data);

export const setVis = (map: maplibregl.Map, ids: string[], on: boolean) =>
  ids.forEach(
    (id) =>
      map.getLayer(id) &&
      map.setLayoutProperty(id, "visibility", on ? "visible" : "none"),
  );

/** Fire detections as GeoJSON points, shared by the plain and the clustered source. */
export const fireCollection = (
  fires: FirePoint[],
  info?: Map<FirePoint, FireInfo>,
): GeoJSON.FeatureCollection => ({
  type: "FeatureCollection",
  features: fires.map((q) => {
    const i = info?.get(q);
    return {
      type: "Feature",
      properties: {
        frp: q[2],
        conf: q[3],
        day: q[4],
        hhmm: q[5],
        // -1 = unknown; maplibre properties must be primitives
        sat: q[7] ?? -1,
        score: i ? i.score : -1,
        fresh: i ? (i.fresh ? 1 : 0) : -1,
        reason: i?.reason ?? "",
      },
      geometry: { type: "Point", coordinates: [q[1], q[0]] },
    };
  }),
});

export type FireProps = {
  frp: number;
  day: number;
  hhmm: number;
  conf: number;
  sat?: number;
  score?: number;
  fresh?: number;
  reason?: string;
};

const REASON_TEXT: Record<string, string> = {
  static: "Posible fuente fija (más de 5 días en el mismo punto)",
  industrial: "Cerca de una planta o yacimiento conocido",
};

type TerrainLookup = (lat: number, lng: number) => Promise<TerrainInfo | null>;

/** Adds a "Terreno" line that fills in once the lookup answers, and drops itself when it fails. */
function addTerrain(
  root: HTMLElement,
  at: maplibregl.LngLatLike,
  terrainAt: TerrainLookup | undefined,
) {
  if (!terrainAt) return;
  const { lat, lng } = maplibregl.LngLat.convert(at);
  const line = document.createElement("span");
  line.textContent = "Terreno: consultando…";
  root.append(line);
  terrainAt(lat, lng).then((t) => {
    const text = t ? terrainLine(t) : "";
    if (!text) return line.remove();
    line.textContent = `Terreno: ${text}`;
    if (t?.burnable === false) {
      const warn = document.createElement("span");
      warn.textContent =
        "Cobertura no vegetal: puede ser calor urbano o industrial.";
      root.append(warn);
    }
  });
}

/** DOM-only popup content: never interpolates data into HTML. */
export function firePopup(
  map: maplibregl.Map,
  at: maplibregl.LngLatLike,
  pr: FireProps,
  days: string[],
  terrainAt?: TerrainLookup,
) {
  const hh = String(pr.hhmm).padStart(4, "0");
  const root = document.createElement("div");
  root.className = "snt-pop";
  const title = document.createElement("b");
  const sat = satLabel(pr.sat);
  title.textContent = sat ? `Foco térmico (${sat})` : "Foco térmico";
  const l1 = document.createElement("span");
  l1.textContent = `${days[pr.day] ?? ""} · ${hh.slice(0, 2)}:${hh.slice(2)} UTC`;
  const l2 = document.createElement("span");
  l2.textContent = `FRP ${pr.frp} MW · confianza ${["baja", "nominal", "alta"][pr.conf] ?? "—"}`;
  root.append(title, l1, l2);
  if (typeof pr.score === "number" && pr.score >= 0) {
    const l3 = document.createElement("span");
    l3.textContent = `Puntaje de confianza ${pr.score}/100${pr.fresh === 1 ? " · nuevo" : pr.fresh === 0 ? " · ya visto" : ""}`;
    root.append(l3);
  }
  if (pr.reason && REASON_TEXT[pr.reason]) {
    const l4 = document.createElement("span");
    l4.textContent = REASON_TEXT[pr.reason];
    root.append(l4);
  }
  addTerrain(root, at, terrainAt);
  new maplibregl.Popup({
    closeButton: false,
    offset: 12,
    className: "snt-popup",
  })
    .setLngLat(at)
    .setDOMContent(root)
    .addTo(map);
}

/** GOES early detections as GeoJSON points; ms timestamps travel as numbers (maplibre keeps primitives). */
export const earlyCollection = (
  early: EarlyView[],
): GeoJSON.FeatureCollection => ({
  type: "FeatureCollection",
  features: early.map((e) => ({
    type: "Feature",
    properties: {
      status: e.status,
      frp: e.frp,
      scans: e.scans,
      firstAt: e.firstAt,
      lastAt: e.lastAt,
      confirmedAt: e.confirmedAt ?? 0,
      sources: e.sources.join("+"),
    },
    geometry: { type: "Point", coordinates: [e.lng, e.lat] },
  })),
});

export type EarlyProps = {
  status: string;
  frp: number;
  scans: number;
  firstAt: number;
  lastAt: number;
  confirmedAt: number;
  sources: string;
};

const SOURCE_NAME: Record<string, string> = { FIRMS: "NASA FIRMS", INPE: "INPE" };
const artTime = (ms: number) =>
  new Date(ms).toLocaleTimeString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

/** DOM-only popup for a GOES early detection. */
export function earlyPopup(
  map: maplibregl.Map,
  at: maplibregl.LngLatLike,
  pr: EarlyProps,
  terrainAt?: TerrainLookup,
) {
  const lines = (...t: string[]) => {
    const root = document.createElement("div");
    root.className = "snt-pop";
    t.forEach((x, i) => {
      const el = document.createElement(i === 0 ? "b" : "span");
      el.textContent = x;
      root.append(el);
    });
    return root;
  };
  const ago = Math.max(0, Math.round((Date.now() - pr.lastAt) / 60_000));
  const status =
    pr.status === "confirmed"
      ? `Confirmado por un satélite polar (${artTime(pr.confirmedAt)} hs)`
      : "Todavía sin confirmar por un satélite polar";
  const root = lines(
    "Alerta temprana (GOES-19)",
    `Visto desde las ${artTime(pr.firstAt)} hs · último escaneo hace ${ago} min`,
    `${pr.scans} ${pr.scans === 1 ? "escaneo" : "escaneos"}${pr.frp > 0 ? ` · FRP máx. ${Math.round(pr.frp)} MW` : ""}`,
    status,
    `Fuente: ${pr.sources.split("+").map((s) => SOURCE_NAME[s] ?? s).join(" y ")}. Píxel de 2 a 4 km: la posición es aproximada.`,
  );
  addTerrain(root, at, terrainAt);
  new maplibregl.Popup({ closeButton: false, offset: 12, className: "snt-popup" })
    .setLngLat(at)
    .setDOMContent(root)
    .addTo(map);
}

export function makeDroneEl(name: string) {
  const el = document.createElement("div");
  el.className = "snt-drone";
  const label = document.createElement("div");
  label.className = "snt-drone__label";
  label.textContent = name;
  const body = document.createElement("div");
  body.className = "snt-drone__body";
  body.innerHTML =
    '<svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><path d="M15 2 L25 26 L15 21 L5 26 Z" stroke-width="2" stroke-linejoin="round"/></svg>';
  const stem = document.createElement("div");
  stem.className = "snt-drone__stem";
  const shadow = document.createElement("div");
  shadow.className = "snt-drone__shadow";
  el.append(label, body, stem, shadow);
  return { el, body };
}
