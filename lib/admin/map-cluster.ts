import type { ExpressionSpecification } from "maplibre-gl";

/** Below this zoom the fire points are grouped; from it up the per-point layers take over. */
export const CLUSTER_MAX_ZOOM = 9;
export const CLUSTER_RADIUS = 40;

export const CLUSTER_SOURCE = {
  type: "geojson",
  data: { type: "FeatureCollection", features: [] },
  cluster: true,
  clusterRadius: CLUSTER_RADIUS,
  clusterMaxZoom: CLUSTER_MAX_ZOOM,
  // strongest detection inside the cluster, to colour it
  clusterProperties: { maxFrp: ["max", ["get", "frp"]] },
} as const;

const expr = (e: unknown) => e as ExpressionSpecification;

/** Bigger circle for bigger groups; lone points keep a small dot. */
export const CLUSTER_RADIUS_EXPR = expr([
  "step",
  ["coalesce", ["get", "point_count"], 1],
  6,
  2,
  13,
  10,
  17,
  50,
  22,
  200,
  28,
]);

export const CLUSTER_COLOR_EXPR = expr([
  "interpolate",
  ["linear"],
  ["coalesce", ["get", "maxFrp"], ["get", "frp"], 0],
  0,
  "#f5a524",
  15,
  "#ff7a1a",
  50,
  "#d32f1c",
]);

export const CLUSTER_LABEL_EXPR = expr([
  "to-string",
  ["coalesce", ["get", "point_count_abbreviated"], ""],
]);

/** Zoom to reach when a cluster is clicked: never less than a step in, capped at the handover zoom. */
export const clusterTargetZoom = (expansion: number, current: number) =>
  Math.min(CLUSTER_MAX_ZOOM + 0.5, Math.max(expansion, current + 1));
