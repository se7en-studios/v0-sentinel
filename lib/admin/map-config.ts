import type { ExpressionSpecification } from "maplibre-gl";
import { areaHa, fmtArea, fmtKm, lengthKm } from "./geo";
import {
  MODE_ROLE,
  ROLE_COLOR,
  type BaseLayer,
  type Feat,
  type Meta,
} from "./types";

export const DEM_TILES =
  "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";
export const GLYPHS =
  "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";
export const OFM_URL = "https://tiles.openfreemap.org/planet";
export const FONT = ["Noto Sans Regular"];
export const FONT_BOLD = ["Noto Sans Bold"];

export const AR_BOUNDS: [[number, number], [number, number]] = [
  [-78, -57],
  [-50, -19],
];

const yesterday = () =>
  new Date(Date.now() - 36 * 3600 * 1000).toISOString().slice(0, 10);

export interface BaseDef {
  label: string;
  hint: string;
  tiles: string;
  maxzoom: number;
  attribution: string;
  /** a small tile over Argentina used as the picker thumbnail */
  thumb: string;
}

export const BASES: Record<BaseLayer, BaseDef> = {
  esri: {
    label: "Satélite HD",
    hint: "Maxar · alta resolución",
    tiles:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    maxzoom: 19,
    attribution: "Imágenes © Esri, Maxar, Earthstar Geographics",
    thumb:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/9/5",
  },
  s2: {
    label: "Sentinel-2",
    hint: "Copernicus · sin nubes",
    tiles:
      "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2023_3857/default/g/{z}/{y}/{x}.jpg",
    maxzoom: 13,
    attribution:
      "Sentinel-2 cloudless © EOX, contiene datos Copernicus Sentinel 2023",
    thumb:
      "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2023_3857/default/g/4/9/5.jpg",
  },
  light: {
    label: "Claro",
    hint: "Cartografía limpia",
    tiles:
      "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
    maxzoom: 19,
    attribution: "© OpenStreetMap · © CARTO",
    thumb: "https://basemaps.cartocdn.com/rastertiles/voyager/4/5/9@2x.png",
  },
  topo: {
    label: "Topográfico",
    hint: "Relieve y curvas",
    tiles:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    maxzoom: 19,
    attribution: "Esri, HERE, Garmin, USGS, NGA",
    thumb:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/4/9/5",
  },
  // One satellite per mosaic: mixing NOAA-20 and NOAA-21 tiles in one source
  // would patch together passes ~50 min apart with different clouds.
  viirs: {
    label: "VIIRS ayer",
    hint: "NASA · color real diario",
    tiles: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_NOAA20_CorrectedReflectance_TrueColor/default/${yesterday()}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
    maxzoom: 9,
    attribution: "NASA GIBS · VIIRS NOAA-20 color real (ayer)",
    thumb: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_NOAA20_CorrectedReflectance_TrueColor/default/${yesterday()}/GoogleMapsCompatible_Level9/4/9/5.jpg`,
  },
};

export const FIRE_RAMP = ["#f5a524", "#ff7a1a", "#e2401f", "#b3260f"];

/** Items (zones, lines, routes, sensors) as one FeatureCollection with display props. */
export function toCollection(
  features: Feat[],
  meta: Record<string, Meta>,
  alertIds: Set<string>,
  units: "ha" | "km2",
  risk: Record<string, string>,
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: features.map((f) => {
      const role = MODE_ROLE[String(f.properties.mode)] ?? "zone";
      const name = meta[f.id]?.name ?? "";
      const sub =
        role === "zone"
          ? fmtArea(areaHa(f), units)
          : role === "sensor"
            ? ""
            : fmtKm(lengthKm(f));
      return {
        type: "Feature",
        geometry: f.geometry as unknown as GeoJSON.Geometry,
        properties: {
          fid: f.id,
          role,
          name,
          sub,
          alert: alertIds.has(f.id) ? 1 : 0,
          rcol: risk[f.id] ?? ROLE_COLOR.zone,
        },
      };
    }),
  };
}

export const colorByRole = [
  "match",
  ["get", "role"],
  "zone",
  ROLE_COLOR.zone,
  "line",
  ROLE_COLOR.line,
  "route",
  ROLE_COLOR.route,
  ROLE_COLOR.sensor,
] as unknown as ExpressionSpecification;

/** Marching-ants dash sequence used to animate route direction. */
export const DASH_FRAMES: number[][] = [
  [0, 4, 3],
  [0.5, 4, 2.5],
  [1, 4, 2],
  [1.5, 4, 1.5],
  [2, 4, 1],
  [2.5, 4, 0.5],
  [3, 4, 0],
  [0, 0.5, 3, 3.5],
  [0, 1, 3, 3],
  [0, 1.5, 3, 2.5],
  [0, 2, 3, 2],
  [0, 2.5, 3, 1.5],
  [0, 3, 3, 1],
  [0, 3.5, 3, 0.5],
];
