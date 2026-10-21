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
import type { TerraDraw } from "terra-draw";
import bbox from "@turf/bbox";
import { feature as turfFeature } from "@turf/helpers";
import {
  AR_BOUNDS,
  BASES,
  DASH_FRAMES,
  toCollection,
} from "@/lib/admin/map-config";
import {
  emptyFC,
  fireBeacons,
  routeRibbons,
  sensorPosts,
  zoneVolumes,
  type Wind,
} from "@/lib/admin/map-3d";
import { DEFAULT_SETTINGS } from "@/lib/admin/types";
import type {
  BaseLayer,
  Feat,
  FirePoint,
  Meta,
  OpacityKey,
  Region,
} from "@/lib/admin/types";
import { addDataLayers, buildStyle } from "./map-layers";
import { createDraw } from "./map-draw";

export interface DroneMarker {
  id: string;
  name: string;
  pos: [number, number];
  heading: number;
  selected: boolean;
  altitude: number;
}

export interface UnitMarker {
  id: string;
  name: string;
  kind: string;
  pos: [number, number];
}

export interface MapHandle {
  flyTo: (center: [number, number], zoom?: number) => void;
  fitFeature: (f: Feat) => void;
  resetNorth: () => void;
  getView: () => {
    center: [number, number];
    zoom: number;
    bearing: number;
    pitch: number;
  } | null;
  snapshot: () => string | null;
  getBounds: () => [number, number, number, number] | null;
  project: (lng: number, lat: number) => [number, number] | null;
  zoomBy: (delta: number) => void;
}

export interface ShowLayers {
  fires: boolean;
  heat: boolean;
  zones: boolean;
  lines: boolean;
  routes: boolean;
  sensors: boolean;
  drones: boolean;
  names: boolean;
  spread: boolean;
  forest: boolean;
  buildings: boolean;
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
  opacity: Record<OpacityKey, number>;
  wind: Wind;
  dayLabels: string[];
  show: ShowLayers;
  tool: string | null;
  selectedId: string | null;
  editing: boolean;
  drones: DroneMarker[];
  unitMarkers?: UnitMarker[];
  units: "ha" | "km2";
  onSelect: (id: string | null) => void;
  onCreate: (f: Feat) => void;
  onEdited: (f: Feat) => void;
  onLive: (text: string | null) => void;
  onCenter: (c: [number, number]) => void;
  onCursor?: (c: [number, number] | null) => void;
  onCamera?: (c: { bearing: number; pitch: number; zoom: number }) => void;
}

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const setSource = (
  map: maplibregl.Map,
  id: string,
  data: GeoJSON.FeatureCollection,
) => (map.getSource(id) as maplibregl.GeoJSONSource | undefined)?.setData(data);
const setVis = (map: maplibregl.Map, ids: string[], on: boolean) =>
  ids.forEach(
    (id) =>
      map.getLayer(id) &&
      map.setLayoutProperty(id, "visibility", on ? "visible" : "none"),
  );

/** DOM-only popup content: never interpolates data into HTML. */
function firePopup(
  map: maplibregl.Map,
  at: maplibregl.LngLatLike,
  pr: { frp: number; day: number; hhmm: number; conf: number },
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
  new maplibregl.Popup({
    closeButton: false,
    offset: 12,
    className: "snt-popup",
  })
    .setLngLat(at)
    .setDOMContent(root)
    .addTo(map);
}

function makeDroneEl(name: string) {
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

export const MapView = forwardRef<MapHandle, Props>(
  function MapView(props, ref) {
    const box = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const drawRef = useRef<TerraDraw | null>(null);
    const markers = useRef(
      new Map<
        string,
        { m: maplibregl.Marker; el: HTMLDivElement; body: HTMLDivElement }
      >(),
    );
    const latest = useRef(props);
    latest.current = props;
    const [ready, setReady] = useState(false);

    useImperativeHandle(ref, () => ({
      flyTo: (center, zoom) =>
        mapRef.current?.flyTo({
          center,
          zoom: zoom ?? 10,
          duration: 1800,
          curve: 1.5,
        }),
      fitFeature: (f) => {
        const [w, s, e, n] = bbox(
          turfFeature(f.geometry as unknown as GeoJSON.Geometry),
        );
        if (w === e && s === n)
          mapRef.current?.flyTo({ center: [w, s], zoom: 13.5, duration: 1500 });
        else
          mapRef.current?.fitBounds(
            [
              [w, s],
              [e, n],
            ],
            { padding: 120, duration: 1500 },
          );
      },
      resetNorth: () =>
        mapRef.current?.easeTo({
          bearing: 0,
          pitch: latest.current.view === "3d" ? 62 : 0,
          duration: 700,
        }),
      getView: () => {
        const m = mapRef.current;
        if (!m) return null;
        const c = m.getCenter();
        return {
          center: [c.lng, c.lat],
          zoom: m.getZoom(),
          bearing: m.getBearing(),
          pitch: m.getPitch(),
        };
      },
      getBounds: () => {
        const b = mapRef.current?.getBounds();
        return b
          ? [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]
          : null;
      },
      project: (lng, lat) => {
        const p = mapRef.current?.project([lng, lat]);
        return p ? [p.x, p.y] : null;
      },
      zoomBy: (delta) =>
        mapRef.current?.easeTo({
          zoom: mapRef.current.getZoom() + delta,
          duration: 350,
        }),
      snapshot: () => {
        const m = mapRef.current;
        if (!m) return null;
        m.triggerRepaint();
        try {
          return m.getCanvas().toDataURL("image/jpeg", 0.88);
        } catch {
          return null;
        }
      },
    }));

    // ---- bootstrap ----
    useEffect(() => {
      if (!box.current) return;
      const p = latest.current;
      // Turbopack cannot bundle the module worker: serve a copy from /public.
      maplibregl.setWorkerUrl(
        `${window.location.origin}/maplibre/maplibre-gl-worker.mjs`,
      );
      const calm = reducedMotion();
      const map = new maplibregl.Map({
        container: box.current,
        canvasContextAttributes: {
          antialias: true,
          preserveDrawingBuffer: true,
        },
        center: p.region.center,
        zoom: calm ? p.region.zoom : Math.max(3.4, p.region.zoom - 1.3),
        maxBounds: AR_BOUNDS,
        minZoom: 3,
        maxPitch: 80,
        renderWorldCopies: false,
        fadeDuration: 200,
        attributionControl: false,
        style: buildStyle(p.baseLayer),
      });
      mapRef.current = map;
      if (process.env.NODE_ENV !== "production")
        (window as unknown as { __snt?: unknown }).__snt = map;
      map.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        "bottom-right",
      );
      map.addControl(
        new maplibregl.ScaleControl({ unit: "metric", maxWidth: 110 }),
        "bottom-left",
      );

      let raf = 0;
      let cursorRaf = 0;

      map.on("load", () => {
        addDataLayers(map);
        try {
          map.setLight({
            anchor: "map",
            position: [1.4, 210, 42],
            color: "#fff4e0",
            intensity: 0.4,
          });
        } catch {
          /* light unsupported */
        }
        drawRef.current = createDraw(map, {
          onCreate: (f) => latest.current.onCreate(f),
          onEdited: (f) => latest.current.onEdited(f),
          onLive: (t) => latest.current.onLive(t),
          units: () => latest.current.units,
        });

        map.on("click", (e) => {
          if (latest.current.tool || latest.current.editing) return;
          const items = map.queryRenderedFeatures(e.point, {
            layers: [
              "sensor-pt",
              "route-flow",
              "path-line",
              "zone-fill",
            ].filter((l) => map.getLayer(l)),
          })[0];
          if (items)
            return latest.current.onSelect(String(items.properties.fid));
          const fire = map.queryRenderedFeatures(e.point, {
            layers: ["fires3d", "fires-pt"].filter((l) => map.getLayer(l)),
          })[0];
          if (fire) {
            firePopup(
              map,
              e.lngLat,
              fire.properties as {
                frp: number;
                day: number;
                hhmm: number;
                conf: number;
              },
              latest.current.dayLabels,
            );
            return;
          }
          latest.current.onSelect(null);
        });
        for (const l of [
          "sensor-pt",
          "route-flow",
          "path-line",
          "zone-fill",
          "fires-pt",
          "fires3d",
        ]) {
          map.on(
            "mouseenter",
            l,
            () =>
              !latest.current.tool &&
              (map.getCanvas().style.cursor = "pointer"),
          );
          map.on("mouseleave", l, () => (map.getCanvas().style.cursor = ""));
        }
        // ponytail: throttled to ~8 fps; each call re-renders the whole admin tree
        let lastCursor = 0;
        map.on("mousemove", (e) => {
          const now = performance.now();
          if (now - lastCursor < 120) return;
          lastCursor = now;
          cancelAnimationFrame(cursorRaf);
          cursorRaf = requestAnimationFrame(() =>
            latest.current.onCursor?.([e.lngLat.lng, e.lngLat.lat]),
          );
        });
        map.on("mouseout", () => latest.current.onCursor?.(null));
        // ponytail: throttled + deduped; each emit re-renders the whole admin tree
        let camRaf = 0;
        let lastCam = 0;
        let prev = { bearing: NaN, pitch: NaN, zoom: NaN };
        const emitCamera = (force = false) => {
          const now = performance.now();
          if (!force && now - lastCam < 120) return;
          lastCam = now;
          cancelAnimationFrame(camRaf);
          camRaf = requestAnimationFrame(() => {
            const c = {
              bearing: map.getBearing(),
              pitch: map.getPitch(),
              zoom: map.getZoom(),
            };
            if (
              Math.abs(c.bearing - prev.bearing) < 0.5 &&
              Math.abs(c.pitch - prev.pitch) < 0.5 &&
              Math.abs(c.zoom - prev.zoom) < 0.05
            )
              return;
            prev = c;
            latest.current.onCamera?.(c);
          });
        };
        map.on("move", () => emitCamera());
        map.on("moveend", () => emitCamera(true));
        emitCamera(true);
        map.on("moveend", () => {
          const c = map.getCenter();
          latest.current.onCenter([c.lng, c.lat]);
        });

        // ambient motion: fire glow pulse + route flow. Skipped for reduced motion.
        if (!calm) {
          let last = 0;
          const tick = (t: number) => {
            raf = requestAnimationFrame(tick);
            if (document.hidden || t - last < 70) return;
            last = t;
            const s = (Math.sin(t / 650) + 1) / 2;
            if (map.getLayer("fires-glow"))
              map.setPaintProperty(
                "fires-glow",
                "circle-opacity",
                (0.3 + 0.32 * s) * (latest.current.opacity?.fires ?? 1),
              );
            if (map.getLayer("route-flow"))
              map.setPaintProperty(
                "route-flow",
                "line-dasharray",
                DASH_FRAMES[Math.floor(t / 80) % DASH_FRAMES.length],
              );
          };
          raf = requestAnimationFrame(tick);
          map.flyTo({
            center: p.region.center,
            zoom: p.region.zoom,
            duration: 3200,
            curve: 1.6,
            essential: false,
          });
        }
        setReady(true);
      });

      const m = markers.current;
      return () => {
        cancelAnimationFrame(raf);
        cancelAnimationFrame(cursorRaf);
        m.forEach(({ m: mk }) => mk.remove());
        m.clear();
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

    // ---- imagery swap (also updates attribution and max zoom) ----
    const appliedBase = useRef<BaseLayer>(props.baseLayer);
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !ready || appliedBase.current === props.baseLayer) return;
      const swap = () => {
        const b = BASES[props.baseLayer];
        if (map.getLayer("base")) map.removeLayer("base");
        if (map.getSource("base")) map.removeSource("base");
        map.addSource("base", {
          type: "raster",
          tiles: [b.tiles],
          tileSize: 256,
          maxzoom: b.maxzoom,
          attribution: b.attribution,
        });
        map.addLayer(
          {
            id: "base",
            type: "raster",
            source: "base",
            paint: {
              "raster-resampling": "linear",
              "raster-fade-duration": 250,
              "raster-saturation": 0.08,
              "raster-contrast": 0.04,
              "raster-opacity": latest.current.opacity?.imagery ?? 1,
            },
          },
          "hill",
        );
        appliedBase.current = props.baseLayer;
      };
      if (map.isStyleLoaded()) swap();
      else map.once("idle", swap);
      return () => {
        map.off("idle", swap);
      };
    }, [props.baseLayer, ready]);

    // ---- 2D / 3D: terrain, camera, sky ----
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !ready) return;
      const apply = () => {
        if (props.view === "3d") {
          map.setTerrain({ source: "dem", exaggeration: props.exaggeration });
          try {
            map.setSky({
              "sky-color": "#86b9e6",
              "horizon-color": "#f4f8fa",
              "fog-color": "#e8eff3",
              "sky-horizon-blend": 0.55,
              "horizon-fog-blend": 0.9,
              "fog-ground-blend": 0.28,
              "atmosphere-blend": [
                "interpolate",
                ["linear"],
                ["zoom"],
                0,
                1,
                12,
                0,
              ],
            });
          } catch {
            /* sky unsupported */
          }
          map.easeTo({
            pitch: 71,
            bearing: map.getBearing() || -24,
            zoom: Math.max(map.getZoom(), 10.2),
            duration: 2200,
            easing: (t) => 1 - Math.pow(1 - t, 3),
          });
        } else {
          map.easeTo({
            pitch: 0,
            bearing: 0,
            duration: 900,
            easing: (t) => 1 - Math.pow(1 - t, 3),
          });
          if (map.getTerrain())
            map.setTerrain(null as unknown as maplibregl.TerrainSpecification);
          try {
            map.setSky(undefined as never);
          } catch {
            /* ignore */
          }
        }
      };
      if (map.isStyleLoaded()) apply();
      else map.once("idle", apply);
      return () => {
        map.off("idle", apply);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps -- exaggeration has its own effect below
    }, [props.view, ready]);

    // slider ticks only retune the terrain, never the camera
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !ready || !map.getTerrain()) return;
      map.setTerrain({ source: "dem", exaggeration: props.exaggeration });
    }, [props.exaggeration, ready]);

    // ---- saved items + selection ----
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !ready) return;
      const visible = props.features.filter(
        (f) => !(props.editing && f.id === props.selectedId),
      );
      setSource(
        map,
        "items",
        toCollection(
          visible,
          props.meta,
          props.alertIds,
          props.units,
          props.zoneRisk,
        ),
      );
      const sel = props.features.find(
        (f) => f.id === props.selectedId && !props.editing,
      );
      setSource(map, "sel", {
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

    // ---- fires (2D layers always, 3D beacons only in 3D) ----
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !ready) return;
      setSource(map, "fires", {
        type: "FeatureCollection",
        features: props.fires.map((q) => ({
          type: "Feature",
          properties: { frp: q[2], conf: q[3], day: q[4], hhmm: q[5] },
          geometry: { type: "Point", coordinates: [q[1], q[0]] },
        })),
      });
    }, [props.fires, ready]);

    useEffect(() => {
      const map = mapRef.current;
      if (!map || !ready) return;
      if (props.view !== "3d") {
        setSource(map, "fires3d", emptyFC());
        return;
      }
      setSource(map, "fires3d", fireBeacons(props.fires, props.wind));
      setSource(map, "routes3d", routeRibbons(props.features));
      setSource(
        map,
        "zones3d",
        zoneVolumes(props.features, props.alertIds, props.zoneRisk),
      );
      setSource(map, "sens3d", sensorPosts(props.features, props.alertIds));
    }, [
      props.fires,
      props.wind,
      props.features,
      props.alertIds,
      props.zoneRisk,
      props.view,
      ready,
    ]);

    // ---- predicted spread ----
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !ready) return;
      setSource(map, "spread", props.spread ?? emptyFC());
    }, [props.spread, ready]);

    // ---- layer visibility ----
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !ready) return;
      const s = props.show;
      const d3 = props.view === "3d";
      setVis(map, ["fires-heat"], s.fires && s.heat);
      setVis(map, ["fires-glow", "fires-pt"], s.fires);
      setVis(map, ["fires3d"], s.fires && d3);
      setVis(map, ["zones3d-vol", "zones3d-wall"], s.zones && d3);
      setVis(map, ["sens3d"], s.sensors && d3);
      setVis(map, ["spread-fill", "spread-line"], s.spread);
      setVis(map, ["zone-fill", "zone-glow", "zone-line"], s.zones);
      setVis(map, ["sensor-halo", "sensor-pt"], s.sensors);
      setVis(map, ["places", "peaks"], s.names);
      setVis(map, ["buildings"], s.buildings);
      setVis(map, ["forest3d"], s.forest && d3);
      setVis(map, ["routes3d-curtain", "routes3d-ribbon"], s.routes && d3);
      setVis(map, ["smoke3d"], s.fires && d3);
      const roles = [s.lines && "line", s.routes && "route"].filter(Boolean);
      map.setFilter("path-case", ["in", ["get", "role"], ["literal", roles]]);
      setVis(map, ["path-line"], s.lines);
      setVis(map, ["route-flow", "route-arrows"], s.routes);
      const lbl = [
        s.zones && "zone",
        s.lines && "line",
        s.routes && "route",
        s.sensors && "sensor",
      ].filter(Boolean);
      map.setFilter("labels", [
        "in",
        ["get", "role"],
        ["literal", s.names ? lbl : []],
      ]);
    }, [props.show, props.view, ready]);

    // ---- camera: orbit and follow-drone ----
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !ready || !props.orbit) return;
      let raf = 0;
      const step = () => {
        map.setBearing(map.getBearing() + 0.1);
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    }, [props.orbit, ready]);

    useEffect(() => {
      const map = mapRef.current;
      if (!map || !ready || !props.follow) return;
      map.easeTo({
        center: props.follow.pos,
        bearing: props.follow.heading,
        pitch: 68,
        zoom: 14.4,
        duration: 1000,
        easing: (t) => t,
      });
    }, [props.follow, ready]);

    // ---- per-layer opacity (layers panel sliders) ----
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !ready) return;
      const o = props.opacity ?? DEFAULT_SETTINGS.opacity;
      const d3 = props.view === "3d";
      const set = (id: string, prop: string, v: unknown) =>
        map.getLayer(id) && map.setPaintProperty(id, prop as never, v as never);
      set("base", "raster-opacity", o.imagery);
      set(
        "hill",
        "hillshade-exaggeration",
        Math.min(1, o.relief * (d3 ? 1.6 : 1)),
      );
      set("tint", "color-relief-opacity", o.tint * (d3 ? 1 : 0.4));
      set("fires-heat", "heatmap-opacity", 0.78 * o.fires);
      set("fires-pt", "circle-opacity", 0.95 * o.fires);
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
      set("path-line", "line-opacity", o.routes);
      set("route-flow", "line-opacity", o.routes);
      set("routes3d-ribbon", "fill-extrusion-opacity", 0.95 * o.routes);
      set("routes3d-curtain", "fill-extrusion-opacity", 0.1 * o.routes);
      for (const id of ["labels", "places", "peaks"])
        set(id, "text-opacity", o.labels);
    }, [props.opacity, props.view, ready]);

    // ---- active draw tool / vertex editing ----
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
          latest.current.onLive(
            "No se puede editar la geometría de este elemento",
          );
        }
      }
      draw.clear();
      draw.setMode("render");
      latest.current.onLive(null);
    }, [props.tool, props.editing, props.selectedId, ready]);

    // ---- drone markers: ground shadow, altitude stem, floating body ----
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !ready) return;
      const seen = new Set<string>();
      if (props.show.drones) {
        for (const d of props.drones) {
          seen.add(d.id);
          let entry = markers.current.get(d.id);
          if (!entry) {
            const { el, body } = makeDroneEl(d.name);
            entry = {
              m: new maplibregl.Marker({ element: el, anchor: "bottom" })
                .setLngLat(d.pos)
                .addTo(map),
              el,
              body,
            };
            markers.current.set(d.id, entry);
          }
          entry.m.setLngLat(d.pos);
          entry.body.style.transform = `rotate(${Math.round(d.heading / 4) * 4}deg)`;
          entry.el.classList.toggle("snt-drone--sel", d.selected);
          entry.el.style.setProperty(
            "--lift",
            `${Math.round(18 + Math.min(34, d.altitude / 4))}px`,
          );
        }
      }
      markers.current.forEach(({ m }, id) => {
        if (!seen.has(id)) {
          m.remove();
          markers.current.delete(id);
        }
      });
    }, [props.drones, props.show.drones, ready]);

    // ---- response unit markers (simulated resources) ----
    const unitEls = useRef(new Map<string, maplibregl.Marker>());
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !ready) return;
      const seen = new Set<string>();
      for (const u of props.unitMarkers ?? []) {
        seen.add(u.id);
        let mk = unitEls.current.get(u.id);
        if (!mk) {
          const el = document.createElement("div");
          el.className = "snt-unit";
          const dot = document.createElement("span");
          dot.className = "snt-unit__dot";
          dot.textContent =
            u.kind === "avion" || u.kind === "helicoptero"
              ? "✈"
              : u.kind === "brigada"
                ? "B"
                : "A";
          const label = document.createElement("span");
          label.className = "snt-unit__label";
          label.textContent = u.name;
          el.append(dot, label);
          mk = new maplibregl.Marker({ element: el, anchor: "center" })
            .setLngLat(u.pos)
            .addTo(map);
          unitEls.current.set(u.id, mk);
        }
        mk.setLngLat(u.pos);
      }
      unitEls.current.forEach((mk, id) => {
        if (!seen.has(id)) {
          mk.remove();
          unitEls.current.delete(id);
        }
      });
    }, [props.unitMarkers, ready]);

    return (
      <div className="absolute inset-0">
        <div ref={box} className="h-full w-full" />
      </div>
    );
  },
);
