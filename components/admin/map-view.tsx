"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as maplibregl from "maplibre-gl";
import {
  TerraDraw,
  TerraDrawCircleMode,
  TerraDrawFreehandMode,
  TerraDrawLineStringMode,
  TerraDrawPointMode,
  TerraDrawPolygonMode,
  TerraDrawRectangleMode,
  TerraDrawRenderMode,
  TerraDrawSelectMode,
} from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import bbox from "@turf/bbox";
import { feature as turfFeature } from "@turf/helpers";
import { areaHa, fmtArea, fmtKm, lengthKm } from "@/lib/admin/geo";
import {
  MODE_ROLE,
  ROLE_COLOR,
  type BaseLayer,
  type Feat,
  type FirePoint,
  type Meta,
  type Region,
  type Role,
} from "@/lib/admin/types";

export interface DroneMarker {
  id: string;
  name: string;
  pos: [number, number];
  heading: number;
  selected: boolean;
}

export interface MapHandle {
  flyTo: (center: [number, number], zoom?: number) => void;
  fitFeature: (f: Feat) => void;
  resetNorth: () => void;
  getView: () => { center: [number, number]; zoom: number } | null;
  snapshot: () => string | null;
}

interface Props {
  baseLayer: BaseLayer;
  region: Region;
  view: "2d" | "3d";
  exaggeration: number;
  features: Feat[];
  meta: Record<string, Meta>;
  alertIds: Set<string>;
  fires: FirePoint[];
  spread: GeoJSON.FeatureCollection | null;
  orbit: boolean;
  follow: { pos: [number, number]; heading: number } | null;
  zoneRisk: Record<string, string>;
  dayLabels: string[];
  show: {
    fires: boolean;
    heat: boolean;
    zones: boolean;
    lines: boolean;
    routes: boolean;
    sensors: boolean;
    drones: boolean;
    names: boolean;
    spread: boolean;
  };
  tool: string | null;
  selectedId: string | null;
  editing: boolean;
  drones: DroneMarker[];
  units: "ha" | "km2";
  onSelect: (id: string | null) => void;
  onCreate: (f: Feat) => void;
  onEdited: (f: Feat) => void;
  onToolDone: () => void;
  onLive: (text: string | null) => void;
  onCenter: (c: [number, number]) => void;
}

const DEM =
  "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";
const FONT = ["Noto Sans Regular"];
const AR_BOUNDS: [[number, number], [number, number]] = [
  [-78, -57],
  [-50, -19],
];

function yesterday() {
  return new Date(Date.now() - 36 * 3600 * 1000).toISOString().slice(0, 10);
}

const rasterBase = (
  id: string,
  tiles: string,
  maxzoom: number,
  attribution: string,
) => ({
  id,
  src: {
    type: "raster" as const,
    tiles: [tiles],
    tileSize: 256,
    maxzoom,
    attribution,
  },
});

const BASES: Record<BaseLayer, ReturnType<typeof rasterBase>> = {
  esri: rasterBase(
    "esri",
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    18,
    "Imágenes © Esri, Maxar, Earthstar Geographics",
  ),
  s2: rasterBase(
    "s2",
    "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2023_3857/default/g/{z}/{y}/{x}.jpg",
    13,
    "Sentinel-2 cloudless © EOX, contiene datos Copernicus Sentinel 2023",
  ),
  viirs: rasterBase(
    "viirs",
    `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/${yesterday()}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
    9,
    "NASA GIBS · VIIRS color real (ayer)",
  ),
};

function toCollection(
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
      const label =
        role === "zone"
          ? `${name}\n${fmtArea(areaHa(f), units)}`
          : role === "sensor"
            ? name
            : `${name}\n${fmtKm(lengthKm(f))}`;
      return {
        type: "Feature",
        id: undefined,
        geometry: f.geometry as unknown as GeoJSON.Geometry,
        properties: {
          fid: f.id,
          role,
          label,
          alert: alertIds.has(f.id) ? 1 : 0,
          rcol: risk[f.id] ?? ROLE_COLOR.zone,
        },
      };
    }),
  };
}

const colorByRole = [
  "match",
  ["get", "role"],
  "zone",
  ROLE_COLOR.zone,
  "line",
  ROLE_COLOR.line,
  "route",
  ROLE_COLOR.route,
  ROLE_COLOR.sensor,
] as unknown as maplibregl.ExpressionSpecification;

const drawStyles = (color: string) => ({
  fillColor: color as `#${string}`,
  fillOpacity: 0.25,
  outlineColor: color as `#${string}`,
  outlineWidth: 3,
});

export const MapView = forwardRef<MapHandle, Props>(
  function MapView(props, ref) {
    const box = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const drawRef = useRef<TerraDraw | null>(null);
    const markers = useRef<
      Map<string, { m: maplibregl.Marker; el: HTMLDivElement }>
    >(new Map());
    const latest = useRef(props);
    latest.current = props;
    const [ready, setReady] = useState(false);
    const [coord, setCoord] = useState<[number, number] | null>(null);

    useImperativeHandle(ref, () => ({
      flyTo: (center, zoom) =>
        mapRef.current?.flyTo({ center, zoom: zoom ?? 10, duration: 1400 }),
      fitFeature: (f) => {
        const [w, s, e, n] = bbox(
          turfFeature(f.geometry as unknown as GeoJSON.Geometry),
        );
        if (w === e && s === n)
          mapRef.current?.flyTo({ center: [w, s], zoom: 13 });
        else
          mapRef.current?.fitBounds(
            [
              [w, s],
              [e, n],
            ],
            { padding: 90, duration: 1200 },
          );
      },
      resetNorth: () =>
        mapRef.current?.easeTo({
          bearing: 0,
          pitch: latest.current.view === "3d" ? 62 : 0,
        }),
      getView: () => {
      const m = mapRef.current;
      if (!m) return null;
      const c = m.getCenter();
      return { center: [c.lng, c.lat], zoom: m.getZoom() };
    },
    snapshot: () => {
      const m = mapRef.current;
      if (!m) return null;
      m.triggerRepaint();
      try {
        return m.getCanvas().toDataURL("image/jpeg", 0.85);
      } catch {
        return null;
      }
    },
  }));

    // --- map + draw bootstrap ---
    useEffect(() => {
      if (!box.current) return;
      const p = latest.current;
      const base = BASES[p.baseLayer];
      // Turbopack cannot bundle the module worker: serve a copy from /public.
    maplibregl.setWorkerUrl(`${window.location.origin}/maplibre/maplibre-gl-worker.mjs`);
    const map = new maplibregl.Map({
        container: box.current,
      canvasContextAttributes: { preserveDrawingBuffer: true },
        center: p.region.center,
        zoom: p.region.zoom,
        maxBounds: AR_BOUNDS,
        minZoom: 3,
        maxPitch: 75,
        attributionControl: { compact: true },
        style: {
          version: 8,
          glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
          sources: {
            base: base.src,
            names: {
              type: "raster",
              tiles: [
                "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
              ],
              tileSize: 256,
              maxzoom: 16,
            },
            dem: {
              type: "raster-dem",
              tiles: [DEM],
              encoding: "terrarium",
              tileSize: 256,
              maxzoom: 12,
            },
          },
          layers: [
            { id: "base", type: "raster", source: "base" },
            {
              id: "hill",
              type: "hillshade",
              source: "dem",
              paint: {
                "hillshade-exaggeration": 0.35,
                "hillshade-shadow-color": "#0c0b09",
              },
            },
            {
              id: "names",
              type: "raster",
              source: "names",
              paint: { "raster-opacity": 0.9 },
            },
          ],
        },
      });
      mapRef.current = map;
      map.addControl(
        new maplibregl.ScaleControl({ unit: "metric" }),
        "bottom-left",
      );

      map.on("load", () => {
        const empty: GeoJSON.FeatureCollection = {
          type: "FeatureCollection",
          features: [],
        };
        map.addSource("items", { type: "geojson", data: empty });
        map.addSource("sel", { type: "geojson", data: empty });
        map.addSource("fires", { type: "geojson", data: empty });
        map.addSource("spread", { type: "geojson", data: empty });
        for (const id of ["fires3d", "zones3d", "sens3d"]) {
          map.addSource(id, { type: "geojson", data: empty });
        }

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
            "heatmap-intensity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              3,
              0.6,
              9,
              2,
            ],
            "heatmap-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              3,
              8,
              9,
              26,
            ],
            "heatmap-opacity": 0.75,
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(232,113,10,0)",
              0.25,
              "rgba(232,113,10,0.55)",
              0.6,
              "rgba(220,60,30,0.8)",
              1,
              "rgba(255,230,160,0.95)",
            ],
          },
        });
        map.addLayer({
          id: "fires-pt",
          type: "circle",
          source: "fires",
          minzoom: 6,
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              6,
              3,
              12,
              ["interpolate", ["linear"], ["get", "frp"], 0, 7, 60, 16],
            ],
            "circle-color": [
              "interpolate",
              ["linear"],
              ["get", "frp"],
              0,
              "#f5a524",
              15,
              "#e8710a",
              50,
              "#c8321e",
            ],
            "circle-opacity": 0.85,
            "circle-stroke-color": "#fff",
            "circle-stroke-width": 1,
          },
        });

        map.addLayer({
          id: "zones3d",
          type: "fill-extrusion",
          source: "zones3d",
          layout: { visibility: "none" },
          paint: {
            "fill-extrusion-color": ["get", "c"],
            "fill-extrusion-height": ["get", "h"],
            "fill-extrusion-base": 0,
            "fill-extrusion-opacity": 0.28,
          },
        });
        map.addLayer({
          id: "fires3d",
          type: "fill-extrusion",
          source: "fires3d",
          layout: { visibility: "none" },
          paint: {
            "fill-extrusion-color": ["interpolate", ["linear"], ["get", "frp"], 0, "#f5a524", 20, "#e8710a", 60, "#c8321e"],
            "fill-extrusion-height": ["get", "h"],
            "fill-extrusion-base": 0,
            "fill-extrusion-opacity": 0.9,
            "fill-extrusion-vertical-gradient": true,
          },
        });
        map.addLayer({
          id: "sens3d",
          type: "fill-extrusion",
          source: "sens3d",
          layout: { visibility: "none" },
          paint: {
            "fill-extrusion-color": ["get", "c"],
            "fill-extrusion-height": 120,
            "fill-extrusion-base": 0,
            "fill-extrusion-opacity": 0.95,
          },
        });
        map.addLayer({
          id: "spread-fill",
          type: "fill",
          source: "spread",
          paint: {
            "fill-color": "#ff4d2e",
            "fill-opacity": ["interpolate", ["linear"], ["get", "h"], 3, 0.34, 48, 0.1],
          },
        });
        map.addLayer({
          id: "spread-line",
          type: "line",
          source: "spread",
          paint: { "line-color": "#ff7a45", "line-width": 1.6, "line-dasharray": [3, 2] },
        });
        map.addLayer({
          id: "zone-fill",
          type: "fill",
          source: "items",
          filter: ["==", ["get", "role"], "zone"],
          paint: {
            "fill-color": [
              "case",
              ["==", ["get", "alert"], 1],
              "#b83a3a",
              ["coalesce", ["get", "rcol"], ROLE_COLOR.zone],
            ],
            "fill-opacity": 0.24,
          },
        });
        map.addLayer({
          id: "zone-line",
          type: "line",
          source: "items",
          filter: ["==", ["get", "role"], "zone"],
          paint: {
            "line-color": [
              "case",
              ["==", ["get", "alert"], 1],
              "#ff5a4d",
              "#4bc182",
            ],
            "line-width": 2.5,
          },
        });
        map.addLayer({
          id: "path-case",
          type: "line",
          source: "items",
          filter: [
            "any",
            ["==", ["get", "role"], "line"],
            ["==", ["get", "role"], "route"],
          ],
          paint: {
            "line-color": "#0c0b09",
            "line-width": 6,
            "line-opacity": 0.55,
          },
          layout: { "line-cap": "round", "line-join": "round" },
        });
        map.addLayer({
          id: "path-line",
          type: "line",
          source: "items",
          filter: [
            "any",
            ["==", ["get", "role"], "line"],
            ["==", ["get", "role"], "route"],
          ],
          paint: {
            "line-color": colorByRole,
            "line-width": 3.2,
            "line-dasharray": [2, 1.4],
          },
          layout: { "line-cap": "round", "line-join": "round" },
        });
        map.addLayer({
          id: "sensor-halo",
          type: "circle",
          source: "items",
          filter: ["==", ["get", "role"], "sensor"],
          paint: {
            "circle-radius": 14,
            "circle-color": [
              "case",
              ["==", ["get", "alert"], 1],
              "#b83a3a",
              ROLE_COLOR.sensor,
            ],
            "circle-opacity": 0.22,
          },
        });
        map.addLayer({
          id: "sensor-pt",
          type: "circle",
          source: "items",
          filter: ["==", ["get", "role"], "sensor"],
          paint: {
            "circle-radius": 6.5,
            "circle-color": [
              "case",
              ["==", ["get", "alert"], 1],
              "#e5483c",
              ROLE_COLOR.sensor,
            ],
            "circle-stroke-color": "#fff",
            "circle-stroke-width": 2,
          },
        });
        map.addLayer({
          id: "sel-line",
          type: "line",
          source: "sel",
          paint: {
            "line-color": "#ffffff",
            "line-width": 4.5,
            "line-opacity": 0.95,
          },
        });
        map.addLayer({
          id: "sel-pt",
          type: "circle",
          source: "sel",
          filter: ["==", ["geometry-type"], "Point"],
          paint: {
            "circle-radius": 11,
            "circle-color": "rgba(0,0,0,0)",
            "circle-stroke-color": "#fff",
            "circle-stroke-width": 3,
          },
        });
        map.addLayer({
          id: "labels",
          type: "symbol",
          source: "items",
          layout: {
            "text-field": ["get", "label"],
            "text-font": FONT,
            "text-size": 12,
            "text-anchor": "center",
            "text-max-width": 10,
          },
          paint: {
            "text-color": "#ffffff",
            "text-halo-color": "rgba(12,11,9,0.85)",
            "text-halo-width": 1.6,
          },
        });

        // --- Terra Draw: only creates shapes and edits the selected one ---
        const adapter = new TerraDrawMapLibreGLAdapter({ map });
        const st = (role: Role) => drawStyles(ROLE_COLOR[role]);
        const flag = (role: Role, resizable = false) => ({
          feature: {
            draggable: true,
            rotateable: role !== "sensor",
            scaleable: role !== "sensor",
            coordinates:
              role === "sensor"
                ? undefined
                : {
                    midpoints: !resizable,
                    draggable: true,
                    deletable: true,
                    resizable: resizable
                      ? ("center-fixed" as const)
                      : undefined,
                  },
          },
        });
        const draw = new TerraDraw({
          adapter,
          modes: [
            new TerraDrawRenderMode({
              modeName: "render",
              styles: { pointColor: "#ffffff" as `#${string}` },
            }),
            new TerraDrawPolygonMode({
              modeName: "zone-polygon",
              styles: { ...st("zone"), closingPointColor: "#ffffff" },
            }),
            new TerraDrawCircleMode({
              modeName: "zone-circle",
              projection: "globe",
              styles: st("zone"),
            }),
            new TerraDrawRectangleMode({
              modeName: "zone-rect",
              styles: st("zone"),
            }),
            new TerraDrawFreehandMode({
              modeName: "zone-free",
              styles: st("zone"),
            }),
            new TerraDrawLineStringMode({
              modeName: "line",
              styles: {
                lineStringColor: ROLE_COLOR.line as `#${string}`,
                lineStringWidth: 4,
              },
            }),
            new TerraDrawLineStringMode({
              modeName: "route",
              styles: {
                lineStringColor: ROLE_COLOR.route as `#${string}`,
                lineStringWidth: 4,
              },
            }),
            new TerraDrawPointMode({
              modeName: "sensor",
              styles: {
                pointColor: ROLE_COLOR.sensor as `#${string}`,
                pointWidth: 8,
                pointOutlineColor: "#ffffff" as `#${string}`,
                pointOutlineWidth: 2,
              },
            }),
            new TerraDrawSelectMode({
              modeName: "select",
              flags: {
                "zone-polygon": flag("zone"),
                "zone-circle": flag("zone", true),
                "zone-rect": flag("zone", true),
                "zone-free": flag("zone"),
                line: flag("line"),
                route: flag("route"),
                sensor: flag("sensor"),
              },
            }),
          ],
        });
        draw.start();
        draw.setMode("render");
        drawRef.current = draw;

        draw.on("finish", (id, ctx) => {
          const snap = draw.getSnapshotFeature(id);
          if (!snap) return;
          const f = { ...snap, id: String(snap.id) } as unknown as Feat;
          if (ctx.action === "draw") {
            draw.removeFeatures([id]);
            latest.current.onLive(null);
            latest.current.onCreate(f);
          } else {
            latest.current.onEdited(f);
          }
        });
        draw.on("change", (ids, type) => {
          if (type !== "update" && type !== "create") return;
          const s = draw.getSnapshotFeature(ids[0]);
          if (!s?.properties.currentlyDrawing) return;
          const f = { ...s, id: String(s.id) } as unknown as Feat;
          try {
            latest.current.onLive(
              s.geometry.type === "LineString"
                ? `Largo ${fmtKm(lengthKm(f))}`
                : s.geometry.type === "Polygon"
                  ? `Área ${fmtArea(areaHa(f), latest.current.units)}`
                  : null,
            );
          } catch {
            /* geometry still degenerate while drawing */
          }
        });

        // --- interactions on saved items ---
        map.on("click", (e) => {
          if (latest.current.tool || latest.current.editing) return;
          const hit = map.queryRenderedFeatures(e.point, {
            layers: ["sensor-pt", "path-line", "zone-fill"].filter((l) =>
              map.getLayer(l),
            ),
          })[0];
          if (hit) return latest.current.onSelect(String(hit.properties.fid));
          const fire = map.queryRenderedFeatures(e.point, {
            layers: ["fires-pt"],
          })[0];
          if (fire) {
            const pr = fire.properties as {
              frp: number;
              day: number;
              hhmm: number;
              conf: number;
            };
            const date = latest.current.dayLabels[pr.day] ?? "";
            const hh = String(pr.hhmm).padStart(4, "0");
            new maplibregl.Popup({ closeButton: false, offset: 10 })
              .setLngLat(e.lngLat)
              .setHTML(
                `<div style="font:12px/1.5 Inter,sans-serif;color:#1a1812"><b>Foco térmico</b><br/>${date} · ${hh.slice(0, 2)}:${hh.slice(2)} UTC<br/>FRP ${pr.frp} MW · confianza ${["baja", "nominal", "alta"][pr.conf]}</div>`,
              )
              .addTo(map);
            return;
          }
          latest.current.onSelect(null);
        });
        for (const l of ["sensor-pt", "path-line", "zone-fill", "fires-pt"]) {
          map.on(
            "mouseenter",
            l,
            () =>
              !latest.current.tool &&
              (map.getCanvas().style.cursor = "pointer"),
          );
          map.on("mouseleave", l, () => (map.getCanvas().style.cursor = ""));
        }

        let raf = 0;
        map.on("mousemove", (e) => {
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() =>
            setCoord([e.lngLat.lng, e.lngLat.lat]),
          );
        });
        map.on("moveend", () => {
          const c = map.getCenter();
          latest.current.onCenter([c.lng, c.lat]);
        });
        setReady(true);
      });

      return () => {
        markers.current.forEach(({ m }) => m.remove());
        markers.current.clear();
        drawRef.current = null;
        try {
          map.remove();
        } catch {
          /* map already torn down */
        }
        mapRef.current = null;
        setReady(false);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- base layer swap ---
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !ready) return;
      const src = map.getSource("base") as
        maplibregl.RasterTileSource | undefined;
      const b = BASES[props.baseLayer];
      src?.setTiles(b.src.tiles);
    }, [props.baseLayer, ready]);

    // --- 2D / 3D ---
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !ready) return;
      const apply = () => {
        if (props.view === "3d") {
          map.setTerrain({ source: "dem", exaggeration: props.exaggeration });
          map.easeTo({ pitch: 62, bearing: map.getBearing() || -18, duration: 1100 });
        } else {
          map.easeTo({ pitch: 0, bearing: 0, duration: 800 });
          if (map.getTerrain()) map.setTerrain(null as unknown as maplibregl.TerrainSpecification);
        }
      };
      if (map.isStyleLoaded()) apply();
      else map.once("idle", apply);
      return () => {
        map.off("idle", apply);
      };
    }, [props.view, props.exaggeration, ready]);

    // --- saved items + selection ---
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !ready) return;
      const visible = props.features.filter(
        (f) => !(props.editing && f.id === props.selectedId),
      );
      (map.getSource("items") as maplibregl.GeoJSONSource).setData(
        toCollection(visible, props.meta, props.alertIds, props.units, props.zoneRisk),
      );
      const sel = props.features.find(
        (f) => f.id === props.selectedId && !props.editing,
      );
      (map.getSource("sel") as maplibregl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features: sel
          ? [
              {
                type: "Feature",
                properties: {},
                geometry: sel.geometry as unknown as GeoJSON.Geometry,
              },
            ]
          : [],
      });
    }, [
      props.features,
      props.meta,
      props.alertIds,
      props.zoneRisk,
      props.selectedId,
      props.editing,
      props.units,
      ready,
    ]);

    // --- fires ---
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !ready) return;
      (map.getSource("fires") as maplibregl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features: props.fires.map((p) => ({
          type: "Feature",
          properties: { frp: p[2], conf: p[3], day: p[4], hhmm: p[5] },
          geometry: { type: "Point", coordinates: [p[1], p[0]] },
        })),
      });
    }, [props.fires, ready]);

    // --- 3D volumes: fire columns, zone volumes, sensor posts ---
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !ready || props.view !== "3d") return;
      const sq = (lat: number, lng: number, km: number): GeoJSON.Position[] => {
        const dLat = km / 111;
        const dLng = km / (111 * Math.cos((lat * Math.PI) / 180));
        return [[lng - dLng, lat - dLat], [lng + dLng, lat - dLat], [lng + dLng, lat + dLat], [lng - dLng, lat + dLat], [lng - dLng, lat - dLat]];
      };
      const top = [...props.fires].sort((a, b) => b[2] - a[2]).slice(0, 2500);
      (map.getSource("fires3d") as maplibregl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features: top.map((p) => ({
          type: "Feature",
          properties: { frp: p[2], h: Math.min(3500, 260 + p[2] * 55) },
          geometry: { type: "Polygon", coordinates: [sq(p[0], p[1], 0.17)] },
        })),
      });
      const zones = props.features.filter((f) => MODE_ROLE[String(f.properties.mode)] === "zone" && f.geometry.type === "Polygon");
      (map.getSource("zones3d") as maplibregl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features: zones.map((f) => ({
          type: "Feature" as const,
          properties: { h: 220, c: props.alertIds.has(f.id) ? "#b83a3a" : props.zoneRisk[f.id] ?? ROLE_COLOR.zone },
          geometry: f.geometry as unknown as GeoJSON.Geometry,
        })),
      });
      const sens = props.features.filter((f) => MODE_ROLE[String(f.properties.mode)] === "sensor");
      (map.getSource("sens3d") as maplibregl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features: sens.map((f) => {
          const [lng, lat] = f.geometry.coordinates as [number, number];
          return {
            type: "Feature",
            properties: { c: props.alertIds.has(f.id) ? "#e5483c" : ROLE_COLOR.sensor },
            geometry: { type: "Polygon", coordinates: [sq(lat, lng, 0.03)] },
          };
        }),
      });
    }, [props.fires, props.features, props.alertIds, props.zoneRisk, props.view, ready]);

    useEffect(() => {
      const map = mapRef.current;
      if (!map || !ready) return;
      const on = props.view === "3d";
      const set = (id: string, v: boolean) =>
        map.getLayer(id) && map.setLayoutProperty(id, "visibility", v && on ? "visible" : "none");
      set("fires3d", props.show.fires);
      set("zones3d", props.show.zones);
      set("sens3d", props.show.sensors);
      try {
        map.setSky(
          on
            ? { "sky-color": "#a9cbe8", "horizon-color": "#eef3f6", "fog-color": "#eef3f6", "sky-horizon-blend": 0.6, "horizon-fog-blend": 0.7, "fog-ground-blend": 0.5 }
            : (undefined as never),
        );
      } catch {
        /* sky unsupported: ignore */
      }
    }, [props.view, props.show.fires, props.show.zones, props.show.sensors, ready]);

    // --- camera: auto-orbit and follow-drone ---
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !ready || !props.orbit) return;
      let raf = 0;
      const step = () => {
        map.setBearing(map.getBearing() + 0.12);
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    }, [props.orbit, ready]);

    useEffect(() => {
      const map = mapRef.current;
      if (!map || !ready || !props.follow) return;
      map.easeTo({ center: props.follow.pos, bearing: props.follow.heading, pitch: 66, zoom: 14.2, duration: 1000, easing: (t) => t });
    }, [props.follow, ready]);

    // --- predicted spread ---
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !ready) return;
      (map.getSource("spread") as maplibregl.GeoJSONSource).setData(
        props.spread ?? { type: "FeatureCollection", features: [] },
      );
    }, [props.spread, ready]);

    // --- layer visibility ---
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !ready) return;
      const s = props.show;
      const vis = (ids: string[], on: boolean) =>
        ids.forEach(
          (id) =>
            map.getLayer(id) &&
            map.setLayoutProperty(id, "visibility", on ? "visible" : "none"),
        );
      vis(["fires-heat"], s.fires && s.heat);
      vis(["spread-fill", "spread-line"], s.spread);
      vis(["fires-pt"], s.fires);
      vis(["zone-fill", "zone-line"], s.zones);
      vis(["sensor-halo", "sensor-pt"], s.sensors);
      vis(["names"], s.names);
      vis(["hill"], props.view === "3d" || props.baseLayer !== "s2");
      // path layers are shared by lines and routes: filter instead of hiding
      const roles = [s.lines && "line", s.routes && "route"].filter(Boolean);
      const pathFilter: maplibregl.FilterSpecification = [
        "in",
        ["get", "role"],
        ["literal", roles],
      ];
      map.setFilter("path-case", pathFilter);
      map.setFilter("path-line", pathFilter);
      const lbl = ["zone", "line", "route", "sensor"].filter((r) =>
        r === "zone"
          ? s.zones
          : r === "line"
            ? s.lines
            : r === "route"
              ? s.routes
              : s.sensors,
      );
      map.setFilter("labels", [
        "in",
        ["get", "role"],
        ["literal", s.names ? lbl : []],
      ]);
    }, [props.show, props.view, props.baseLayer, ready]);

    // --- active tool / edit mode ---
    useEffect(() => {
      const draw = drawRef.current;
      if (!draw || !ready) return;
      if (props.tool) {
        draw.clear();
        draw.setMode(props.tool);
        return;
      }
      if (props.editing && props.selectedId) {
        const f = latest.current.features.find(
          (x) => x.id === latest.current.selectedId,
        );
        if (f) {
          draw.clear();
          draw.setMode("select");
          try {
            const res = draw.addFeatures([f as never]);
            if (res[0]?.valid) {
              draw.selectFeature(f.id);
              return;
            }
          } catch {
            /* geometry Terra Draw cannot edit: fall through to render mode */
          }
          latest.current.onLive("No se puede editar la geometría de este elemento");
        }
      }
      draw.clear();
      draw.setMode("render");
      latest.current.onLive(null);
    }, [props.tool, props.editing, props.selectedId, ready]);

    // --- drone markers ---
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !ready) return;
      const seen = new Set<string>();
      if (props.show.drones) {
        for (const d of props.drones) {
          seen.add(d.id);
          let entry = markers.current.get(d.id);
          if (!entry) {
            const el = document.createElement("div");
            el.style.cssText =
              "display:flex;flex-direction:column;align-items:center;pointer-events:none";
            entry = {
              m: new maplibregl.Marker({
                element: el,
                rotationAlignment: "map",
              })
                .setLngLat(d.pos)
                .addTo(map),
              el,
            };
            markers.current.set(d.id, entry);
          }
          entry.m.setLngLat(d.pos);
          const ring = d.selected ? "#fff" : "rgba(255,255,255,0.8)";
          const html = `<svg width="30" height="30" viewBox="0 0 30 30" style="transform:rotate(${Math.round(d.heading / 5) * 5}deg);filter:drop-shadow(0 2px 4px rgba(0,0,0,.6))"><path d="M15 2 L25 26 L15 21 L5 26 Z" fill="${d.selected ? "#e8710a" : "#0f7a4f"}" stroke="${ring}" stroke-width="2" stroke-linejoin="round"/></svg><span style="margin-top:2px;padding:1px 6px;border-radius:4px;background:rgba(12,11,9,.82);color:#fff;font:600 10px Inter,sans-serif;letter-spacing:.04em">${d.name.replace(/[<>&"']/g, "")}</span>`;
          if (entry.el.dataset.h !== html) {
            entry.el.dataset.h = html;
            entry.el.innerHTML = html;
          }
        }
      }
      markers.current.forEach(({ m }, id) => {
        if (!seen.has(id)) {
          m.remove();
          markers.current.delete(id);
        }
      });
    }, [props.drones, props.show.drones, ready]);

    return (
      <div className="absolute inset-0">
        <div ref={box} className="h-full w-full" />
        {coord && (
          <div className="pointer-events-none absolute bottom-3 right-3 rounded bg-background/80 px-2 py-1 font-mono text-[10px] text-foreground/70">
            {coord[1].toFixed(4)}°, {coord[0].toFixed(4)}°
          </div>
        )}
      </div>
    );
  },
);
