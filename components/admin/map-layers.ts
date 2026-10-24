import type {
  ExpressionSpecification,
  Map as MLMap,
  StyleSpecification,
} from "maplibre-gl";
import { ROLE_COLOR } from "@/lib/admin/types";
import {
  CLUSTER_COLOR_EXPR,
  CLUSTER_LABEL_EXPR,
  CLUSTER_MAX_ZOOM,
  CLUSTER_RADIUS_EXPR,
  CLUSTER_SOURCE,
} from "@/lib/admin/map-cluster";
import {
  BASES,
  DEM_TILES,
  FONT,
  FONT_BOLD,
  GLYPHS,
  OFM_URL,
  colorByRole,
} from "@/lib/admin/map-config";
import type { BaseLayer } from "@/lib/admin/types";

const E: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};
const expr = (e: unknown) => e as ExpressionSpecification;

const ALERT = ["==", ["get", "alert"], 1];
const IS = (r: string) => ["==", ["get", "role"], r] as ExpressionSpecification;

/** Static style: imagery, relief shading and the vector source for buildings/labels. */
export function buildStyle(base: BaseLayer): StyleSpecification {
  const b = BASES[base];
  return {
    version: 8,
    glyphs: GLYPHS,
    sources: {
      base: {
        type: "raster",
        tiles: [b.tiles],
        tileSize: 256,
        maxzoom: b.maxzoom,
        attribution: b.attribution,
      },
      dem: {
        type: "raster-dem",
        tiles: [DEM_TILES],
        encoding: "terrarium",
        tileSize: 256,
        maxzoom: 14,
      },
      ofm: {
        type: "vector",
        url: OFM_URL,
        attribution: "© OpenStreetMap · OpenFreeMap",
      },
    },
    layers: [
      {
        id: "base",
        type: "raster",
        source: "base",
        paint: {
          "raster-resampling": "linear",
          "raster-fade-duration": 250,
          "raster-saturation": 0.08,
          "raster-contrast": 0.04,
        },
      },
      {
        id: "hill",
        type: "hillshade",
        source: "dem",
        paint: {
          "hillshade-method": "multidirectional",
          "hillshade-exaggeration": 0.5,
          "hillshade-shadow-color": "#0e1a14",
          "hillshade-highlight-color": "#fffaf0",
          "hillshade-accent-color": "#1f2e26",
        },
      },
    ],
  };
}

/** All data-driven layers, added once the style has loaded. Bottom to top. */
export function addDataLayers(map: MLMap) {
  for (const id of [
    "items",
    "sel",
    "fires",
    "early",
    "spread",
    "fires3d",
    "zones3d",
    "sens3d",
    "routes3d",
  ]) {
    map.addSource(id, { type: "geojson", data: E });
  }
  // grouped detections for low zoom; the per-point layers take over at CLUSTER_MAX_ZOOM
  map.addSource("fires-cl", { ...CLUSTER_SOURCE, data: E });

  // --- context: roads, buildings (OpenFreeMap) ---
  map.addLayer({
    id: "roads",
    type: "line",
    source: "ofm",
    "source-layer": "transportation",
    minzoom: 8,
    filter: expr([
      "in",
      ["get", "class"],
      ["literal", ["motorway", "trunk", "primary", "secondary", "tertiary"]],
    ]),
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "rgba(255,255,255,0.55)",
      "line-width": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        8,
        0.6,
        14,
        3,
        18,
        10,
      ],
    },
  });
  map.addLayer({
    id: "buildings",
    type: "fill-extrusion",
    source: "ofm",
    "source-layer": "building",
    minzoom: 13.5,
    paint: {
      "fill-extrusion-color": expr([
        "interpolate",
        ["linear"],
        ["coalesce", ["get", "render_height"], 6],
        0,
        "#f1ece0",
        40,
        "#dcd5c4",
        120,
        "#c9c1ae",
      ]),
      "fill-extrusion-height": expr(["coalesce", ["get", "render_height"], 6]),
      "fill-extrusion-base": expr([
        "coalesce",
        ["get", "render_min_height"],
        0,
      ]),
      "fill-extrusion-opacity": 0.86,
      "fill-extrusion-vertical-gradient": true,
    },
  });

  // --- relief: hypsometric tint under everything drawn on top, forest canopy volume ---
  map.addLayer(
    {
      id: "tint",
      type: "color-relief",
      source: "dem",
      paint: {
        "color-relief-opacity": 0.3,
        "color-relief-color": expr([
          "interpolate",
          ["linear"],
          ["elevation"],
          0,
          "#2c6a40",
          500,
          "#5d8c4b",
          1100,
          "#9a9c58",
          1700,
          "#b89d6c",
          2300,
          "#c8b8a0",
          3000,
          "#e6e0d6",
          3800,
          "#ffffff",
        ]),
      },
    },
    "roads",
  );
  map.addLayer({
    id: "forest3d",
    type: "fill-extrusion",
    source: "ofm",
    "source-layer": "landcover",
    minzoom: 9,
    filter: expr(["==", ["get", "class"], "wood"]),
    layout: { visibility: "none" },
    paint: {
      "fill-extrusion-color": "#1d5634",
      "fill-extrusion-height": expr([
        "interpolate",
        ["linear"],
        ["zoom"],
        9,
        60,
        14,
        38,
      ]),
      "fill-extrusion-base": 0,
      "fill-extrusion-opacity": 0.42,
      "fill-extrusion-vertical-gradient": true,
    },
  });

  // --- fires: heat, ground glow, points ---
  map.addLayer({
    id: "fires-heat",
    type: "heatmap",
    source: "fires",
    maxzoom: 9,
    paint: {
      "heatmap-weight": [
        "interpolate",
        ["linear"],
        ["get", "frp"],
        0,
        0.2,
        40,
        1,
      ],
      "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 3, 0.6, 9, 2],
      "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 3, 8, 9, 26],
      "heatmap-opacity": 0.78,
      "heatmap-color": [
        "interpolate",
        ["linear"],
        ["heatmap-density"],
        0,
        "rgba(255,106,26,0)",
        0.25,
        "rgba(255,106,26,0.5)",
        0.6,
        "rgba(226,64,31,0.82)",
        1,
        "rgba(255,226,154,0.96)",
      ],
    },
  });
  map.addLayer({
    id: "fires-glow",
    type: "circle",
    source: "fires",
    minzoom: CLUSTER_MAX_ZOOM,
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        5,
        7,
        9,
        ["interpolate", ["linear"], ["get", "frp"], 0, 14, 60, 34],
        13,
        ["interpolate", ["linear"], ["get", "frp"], 0, 44, 60, 110],
      ],
      "circle-color": "#ff6a1a",
      "circle-blur": 1,
      "circle-opacity": 0.42,
    },
  });
  map.addLayer({
    id: "fires-pt",
    type: "circle",
    source: "fires",
    minzoom: CLUSTER_MAX_ZOOM,
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        6,
        2.6,
        12,
        ["interpolate", ["linear"], ["get", "frp"], 0, 5, 60, 12],
      ],
      "circle-color": [
        "interpolate",
        ["linear"],
        ["get", "frp"],
        0,
        "#f5a524",
        15,
        "#ff7a1a",
        50,
        "#d32f1c",
      ],
      "circle-opacity": 0.95,
      "circle-stroke-color": "#fff7e6",
      "circle-stroke-width": 1.2,
    },
  });

  // --- early warning (GOES-19): cyan rings, hollow until a polar satellite confirms ---
  map.addLayer({
    id: "early-halo",
    type: "circle",
    source: "early",
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        4,
        9,
        9,
        20,
        13,
        58,
      ],
      "circle-color": "#22d3ee",
      "circle-blur": 0.8,
      "circle-opacity": ["case", ["==", ["get", "status"], "open"], 0.24, 0.08],
    },
  });
  map.addLayer({
    id: "early-pt",
    type: "circle",
    source: "early",
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 4.5, 12, 9],
      "circle-color": "rgba(34,211,238,0.22)",
      "circle-stroke-color": [
        "case",
        ["==", ["get", "status"], "open"],
        "#22d3ee",
        "#7aa6b3",
      ],
      "circle-stroke-width": [
        "case",
        ["==", ["get", "status"], "open"],
        2.2,
        1.2,
      ],
    },
  });

  map.addLayer({
    id: "fires-cluster",
    type: "circle",
    source: "fires-cl",
    maxzoom: CLUSTER_MAX_ZOOM,
    paint: {
      "circle-radius": CLUSTER_RADIUS_EXPR,
      "circle-color": CLUSTER_COLOR_EXPR,
      "circle-opacity": 0.92,
      "circle-stroke-color": "#fff7e6",
      "circle-stroke-width": 1.5,
    },
  });
  map.addLayer({
    id: "fires-cluster-count",
    type: "symbol",
    source: "fires-cl",
    maxzoom: CLUSTER_MAX_ZOOM,
    filter: ["has", "point_count"],
    layout: {
      "text-field": CLUSTER_LABEL_EXPR,
      "text-font": FONT_BOLD,
      "text-size": 12,
      "text-allow-overlap": true,
    },
    paint: {
      "text-color": "#ffffff",
      "text-halo-color": "rgba(80,20,8,0.7)",
      "text-halo-width": 1.2,
    },
  });

  // --- 3D volumes ---
  const ext = (
    id: string,
    source: string,
    opacity: number,
    filter?: ExpressionSpecification,
  ) =>
    map.addLayer({
      id,
      type: "fill-extrusion",
      source,
      layout: { visibility: "none" },
      ...(filter ? { filter } : {}),
      paint: {
        "fill-extrusion-color": expr(["get", "c"]),
        "fill-extrusion-height": expr(["get", "h"]),
        "fill-extrusion-base": expr(["get", "b"]),
        "fill-extrusion-opacity": opacity,
        "fill-extrusion-vertical-gradient": true,
      },
    });
  ext("zones3d-vol", "zones3d", 0.16, expr(["==", ["get", "k"], "vol"]));
  ext("zones3d-wall", "zones3d", 0.5, expr(["==", ["get", "k"], "wall"]));
  ext(
    "routes3d-curtain",
    "routes3d",
    0.1,
    expr(["==", ["get", "k"], "curtain"]),
  );
  ext(
    "routes3d-ribbon",
    "routes3d",
    0.95,
    expr(["==", ["get", "k"], "ribbon"]),
  );
  ext("smoke3d", "fires3d", 0.4, expr(["==", ["get", "k"], "smoke"]));
  ext("fires3d", "fires3d", 0.94, expr(["==", ["get", "k"], "fire"]));
  ext("sens3d", "sens3d", 0.96);

  // --- spread forecast ---
  map.addLayer({
    id: "spread-fill",
    type: "fill",
    source: "spread",
    filter: ["==", ["get", "k"], "typ"],
    paint: {
      "fill-color": "#ff4d2e",
      "fill-opacity": [
        "interpolate",
        ["linear"],
        ["get", "h"],
        3,
        0.36,
        48,
        0.1,
      ],
    },
  });
  map.addLayer({
    id: "spread-line",
    type: "line",
    source: "spread",
    filter: ["==", ["get", "k"], "typ"],
    paint: {
      "line-color": "#ff7a45",
      "line-width": 1.5,
    },
  });
  // outer outline: where nearly every fire like this stays inside by the chosen horizon
  map.addLayer({
    id: "spread-max",
    type: "line",
    source: "spread",
    filter: ["==", ["get", "k"], "max"],
    paint: {
      "line-color": "#ffb199",
      "line-width": 1.5,
      "line-dasharray": [4, 3],
    },
  });

  // --- user items ---
  map.addLayer({
    id: "zone-fill",
    type: "fill",
    source: "items",
    filter: IS("zone"),
    paint: {
      "fill-color": expr([
        "case",
        ALERT,
        "#d8402f",
        ["coalesce", ["get", "rcol"], ROLE_COLOR.zone],
      ]),
      "fill-opacity": 0.2,
    },
  });
  map.addLayer({
    id: "zone-glow",
    type: "line",
    source: "items",
    filter: IS("zone"),
    layout: { "line-join": "round" },
    paint: {
      "line-color": expr([
        "case",
        ALERT,
        "#ff5a4d",
        ["coalesce", ["get", "rcol"], ROLE_COLOR.zone],
      ]),
      "line-width": 9,
      "line-blur": 7,
      "line-opacity": 0.4,
    },
  });
  map.addLayer({
    id: "zone-line",
    type: "line",
    source: "items",
    filter: IS("zone"),
    layout: { "line-join": "round" },
    paint: {
      "line-color": expr(["case", ALERT, "#ff6f61", "#ffffff"]),
      "line-width": 2,
    },
  });
  const pathFilter = expr(["any", IS("line"), IS("route")]);
  map.addLayer({
    id: "path-case",
    type: "line",
    source: "items",
    filter: pathFilter,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#0c1410", "line-width": 6.5, "line-opacity": 0.5 },
  });
  map.addLayer({
    id: "path-line",
    type: "line",
    source: "items",
    filter: IS("line"),
    layout: { "line-cap": "butt", "line-join": "round" },
    paint: {
      "line-color": colorByRole,
      "line-width": 3,
      "line-dasharray": [2, 1.4],
    },
  });
  map.addLayer({
    id: "route-flow",
    type: "line",
    source: "items",
    filter: IS("route"),
    layout: { "line-cap": "butt", "line-join": "round" },
    paint: {
      "line-color": ROLE_COLOR.route,
      "line-width": 3.4,
      "line-dasharray": [0, 4, 3],
    },
  });
  map.addLayer({
    id: "route-arrows",
    type: "symbol",
    source: "items",
    filter: IS("route"),
    layout: {
      "symbol-placement": "line",
      "symbol-spacing": 90,
      "text-field": "›",
      "text-font": FONT_BOLD,
      "text-size": 22,
      "text-keep-upright": false,
      "text-rotation-alignment": "map",
      "text-allow-overlap": true,
    },
    paint: {
      "text-color": "#ffffff",
      "text-halo-color": ROLE_COLOR.route,
      "text-halo-width": 1.4,
    },
  });
  map.addLayer({
    id: "sensor-halo",
    type: "circle",
    source: "items",
    filter: IS("sensor"),
    paint: {
      "circle-radius": 16,
      "circle-color": expr(["case", ALERT, "#d8402f", ROLE_COLOR.sensor]),
      "circle-opacity": 0.2,
      "circle-blur": 0.6,
    },
  });
  map.addLayer({
    id: "sensor-pt",
    type: "circle",
    source: "items",
    filter: IS("sensor"),
    paint: {
      "circle-radius": 6.5,
      "circle-color": expr(["case", ALERT, "#e5483c", ROLE_COLOR.sensor]),
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2,
    },
  });

  // --- selection ---
  map.addLayer({
    id: "sel-line",
    type: "line",
    source: "sel",
    paint: { "line-color": "#ffffff", "line-width": 4.5, "line-opacity": 0.95 },
  });
  map.addLayer({
    id: "sel-pt",
    type: "circle",
    source: "sel",
    filter: ["==", ["geometry-type"], "Point"],
    paint: {
      "circle-radius": 12,
      "circle-color": "rgba(0,0,0,0)",
      "circle-stroke-color": "#fff",
      "circle-stroke-width": 3,
    },
  });

  // --- labels on top: user items, places, peaks ---
  map.addLayer({
    id: "labels",
    type: "symbol",
    source: "items",
    layout: {
      // minimal: name only when far out, name + measure once zoomed in
      "text-field": expr([
        "step",
        ["zoom"],
        ["format", ["get", "name"], { "text-font": ["literal", FONT_BOLD] }],
        10,
        [
          "format",
          ["get", "name"],
          { "text-font": ["literal", FONT_BOLD] },
          "\n",
          {},
          ["get", "sub"],
          { "font-scale": 0.85 },
        ],
      ]),
      "text-font": FONT,
      "text-size": 12.5,
      "text-anchor": "center",
      "text-max-width": 10,
      "text-padding": 8,
      "text-letter-spacing": 0.01,
    },
    paint: {
      "text-color": "#ffffff",
      "text-halo-color": "rgba(8,16,12,0.85)",
      "text-halo-width": 1.8,
    },
  });
  map.addLayer({
    id: "places",
    type: "symbol",
    source: "ofm",
    "source-layer": "place",
    minzoom: 4,
    filter: expr([
      "in",
      ["get", "class"],
      ["literal", ["city", "town", "village"]],
    ]),
    layout: {
      "text-field": expr(["coalesce", ["get", "name:es"], ["get", "name"]]),
      "text-font": FONT_BOLD,
      "text-size": ["interpolate", ["linear"], ["zoom"], 4, 11, 10, 14, 14, 16],
      "text-max-width": 8,
      "symbol-sort-key": expr(["coalesce", ["get", "rank"], 99]),
    },
    paint: {
      "text-color": "#ffffff",
      "text-halo-color": "rgba(8,16,12,0.8)",
      "text-halo-width": 1.6,
    },
  });
  map.addLayer({
    id: "peaks",
    type: "symbol",
    source: "ofm",
    "source-layer": "mountain_peak",
    minzoom: 9.5,
    filter: expr([">=", ["to-number", ["get", "ele"], 0], 1900]),
    layout: {
      "text-field": expr([
        "format",
        ["concat", "▲ ", ["coalesce", ["get", "name:es"], ["get", "name"], ""]],
        {},
        "\n",
        {},
        ["concat", ["to-string", ["get", "ele"]], " m"],
        { "font-scale": 0.8 },
      ]),
      "text-font": FONT,
      "text-size": 11.5,
      "text-max-width": 9,
      "text-offset": [0, 0.6],
    },
    paint: {
      "text-color": "#fff4d6",
      "text-halo-color": "rgba(8,16,12,0.85)",
      "text-halo-width": 1.6,
    },
  });
}
