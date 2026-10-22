import * as maplibregl from "maplibre-gl";
import type { FirePoint } from "@/lib/admin/types";
import type { FireInfo } from "@/lib/admin/noise";

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
  score?: number;
  fresh?: number;
  reason?: string;
};

const REASON_TEXT: Record<string, string> = {
  static: "Posible fuente fija (más de 5 días en el mismo punto)",
  industrial: "Cerca de una planta o yacimiento conocido",
};

/** DOM-only popup content: never interpolates data into HTML. */
export function firePopup(
  map: maplibregl.Map,
  at: maplibregl.LngLatLike,
  pr: FireProps,
  days: string[],
) {
  const hh = String(pr.hhmm).padStart(4, "0");
  const root = document.createElement("div");
  root.className = "snt-pop";
  const title = document.createElement("b");
  title.textContent = "Foco térmico (VIIRS)";
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
  new maplibregl.Popup({
    closeButton: false,
    offset: 12,
    className: "snt-popup",
  })
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
