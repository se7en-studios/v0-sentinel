import type { Map as MLMap } from "maplibre-gl";
import type { OpacityKey } from "@/lib/admin/types";

/** Pushes the per-layer opacity sliders into the map paint properties. */
export function applyOpacity(
  map: MLMap,
  o: Record<OpacityKey, number>,
  d3: boolean,
) {
  const set = (id: string, prop: string, v: unknown) =>
    map.getLayer(id) && map.setPaintProperty(id, prop as never, v as never);
  set("base", "raster-opacity", o.imagery);
  set("hill", "hillshade-exaggeration", Math.min(1, o.relief * (d3 ? 1.6 : 1)));
  set("tint", "color-relief-opacity", o.tint * (d3 ? 1 : 0.4));
  set("fires-heat", "heatmap-opacity", 0.78 * o.fires);
  set("fires-pt", "circle-opacity", 0.95 * o.fires);
  set("fires-cluster", "circle-opacity", 0.92 * o.fires);
  set("fires-cluster", "circle-stroke-opacity", o.fires);
  set("fires-cluster-count", "text-opacity", o.fires);
  set("fires3d", "fill-extrusion-opacity", 0.94 * o.fires);
  set("smoke3d", "fill-extrusion-opacity", 0.4 * o.fires);
  set("zone-fill", "fill-opacity", 0.2 * o.zones);
  set("zone-glow", "line-opacity", 0.4 * o.zones);
  set("zone-line", "line-opacity", o.zones);
  set("zones3d-wall", "fill-extrusion-opacity", 0.5 * o.zones);
  set("zones3d-vol", "fill-extrusion-opacity", 0.16 * o.zones);
  set("spread-fill", "fill-opacity", [
    "interpolate",
    ["linear"],
    ["get", "h"],
    3,
    0.36 * o.spread,
    48,
    0.1 * o.spread,
  ]);
  set("spread-line", "line-opacity", o.spread);
  set("spread-max", "line-opacity", 0.9 * o.spread);
  set("path-line", "line-opacity", o.routes);
  set("route-flow", "line-opacity", o.routes);
  set("routes3d-ribbon", "fill-extrusion-opacity", 0.95 * o.routes);
  set("routes3d-curtain", "fill-extrusion-opacity", 0.1 * o.routes);
  for (const id of ["labels", "places", "peaks"])
    set(id, "text-opacity", o.labels);
}
