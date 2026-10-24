import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import type * as maplibregl from "maplibre-gl";
import type { TerraDraw } from "terra-draw";
import { BASES, toCollection } from "@/lib/admin/map-config";
import {
  emptyFC,
  fireBeacons,
  routeRibbons,
  sensorPosts,
  zoneVolumes,
} from "@/lib/admin/map-3d";
import { DEFAULT_SETTINGS } from "@/lib/admin/types";
import { uiT } from "@/lib/admin/ui-locale";
import { earlyCollection, fireCollection, setSource, setVis } from "./helpers";
import { applyOpacity } from "./opacity";
import type { MapProps } from "./types";

type MapRef = MutableRefObject<maplibregl.Map | null>;
type Latest = MutableRefObject<MapProps>;

/** Imagery swap (also updates attribution and max zoom). */
function useBaseSwap(
  props: MapProps,
  mapRef: MapRef,
  latest: Latest,
  ready: boolean,
) {
  const appliedBase = useRef(props.baseLayer);
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
    swap(); // not gated on isStyleLoaded(): it never settles under the ambient repaint
  }, [props.baseLayer, ready, mapRef, latest]);
}

/** 2D / 3D: terrain, camera, sky. */
function useViewMode(props: MapProps, mapRef: MapRef, ready: boolean) {
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
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
      // easeTo would cancel the intro flyTo on first load, when there is nothing to reset
      if (map.getPitch() > 0.5 || Math.abs(map.getBearing()) > 0.5)
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
    // `ready` means the style loaded; isStyleLoaded() also tracks tiles and never settles under the ambient repaint
    // eslint-disable-next-line react-hooks/exhaustive-deps -- exaggeration has its own effect below
  }, [props.view, ready, mapRef]);

  // slider ticks only retune the terrain, never the camera
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !map.getTerrain()) return;
    map.setTerrain({ source: "dem", exaggeration: props.exaggeration });
  }, [props.exaggeration, ready, mapRef]);
}

/** Saved items, selection, fires (2D layers always, 3D beacons only in 3D), predicted spread. */
function useDataSources(props: MapProps, mapRef: MapRef, ready: boolean) {
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
    mapRef,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const fc = fireCollection(props.fires, props.fireInfo);
    setSource(map, "fires", fc);
    setSource(map, "fires-cl", fc);
  }, [props.fires, props.fireInfo, ready, mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    setSource(map, "early", earlyCollection(props.early ?? []));
  }, [props.early, ready, mapRef]);

  // `wind` is a fresh object on every parent render: key on its numbers so 2D idles
  const windDir = props.wind.dir;
  const windSpeed = props.wind.speed;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (props.view !== "3d") {
      setSource(map, "fires3d", emptyFC());
      return;
    }
    setSource(
      map,
      "fires3d",
      fireBeacons(props.fires, { dir: windDir, speed: windSpeed }),
    );
    setSource(map, "routes3d", routeRibbons(props.features));
    setSource(
      map,
      "zones3d",
      zoneVolumes(props.features, props.alertIds, props.zoneRisk),
    );
    setSource(map, "sens3d", sensorPosts(props.features, props.alertIds));
  }, [
    props.fires,
    windDir,
    windSpeed,
    props.features,
    props.alertIds,
    props.zoneRisk,
    props.view,
    ready,
    mapRef,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    setSource(map, "spread", props.spread ?? emptyFC());
  }, [props.spread, ready, mapRef]);
}

/** Layer visibility toggles. */
function useVisibility(props: MapProps, mapRef: MapRef, ready: boolean) {
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const s = props.show;
    const d3 = props.view === "3d";
    setVis(map, ["fires-heat"], s.fires && s.heat);
    setVis(map, ["fires-glow", "fires-pt"], s.fires);
    setVis(map, ["early-halo", "early-pt"], s.early);
    setVis(map, ["fires-cluster", "fires-cluster-count"], s.fires);
    setVis(map, ["fires3d"], s.fires && d3);
    setVis(map, ["zones3d-vol", "zones3d-wall"], s.zones && d3);
    setVis(map, ["sens3d"], s.sensors && d3);
    setVis(map, ["spread-fill", "spread-line", "spread-max"], s.spread);
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
  }, [props.show, props.view, ready, mapRef]);
}

/** Camera: orbit and follow-drone. */
function useCamera(props: MapProps, mapRef: MapRef, ready: boolean) {
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !props.orbit) return;
    let raf = 0;
    const step = () => {
      // a hidden tab would keep repainting the whole 3D scene for nobody
      if (!document.hidden) map.setBearing(map.getBearing() + 0.1);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [props.orbit, ready, mapRef]);

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
  }, [props.follow, ready, mapRef]);
}

/** Per-layer opacity (layers panel sliders). */
function useOpacity(props: MapProps, mapRef: MapRef, ready: boolean) {
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    applyOpacity(
      map,
      props.opacity ?? DEFAULT_SETTINGS.opacity,
      props.view === "3d",
    );
  }, [props.opacity, props.view, ready, mapRef]);
}

/** Active draw tool / vertex editing. */
function useDrawMode(
  props: MapProps,
  drawRef: MutableRefObject<TerraDraw | null>,
  latest: Latest,
  ready: boolean,
) {
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
        latest.current.onLive(uiT("map.noEdit"));
      }
    }
    draw.clear();
    draw.setMode("render");
    latest.current.onLive(null);
  }, [props.tool, props.editing, props.selectedId, ready, drawRef, latest]);
}

/** All prop-to-map synchronisation effects, in the order the monolith ran them. */
export function useMapSync(
  props: MapProps,
  mapRef: MapRef,
  drawRef: MutableRefObject<TerraDraw | null>,
  latest: Latest,
  ready: boolean,
) {
  useBaseSwap(props, mapRef, latest, ready);
  useViewMode(props, mapRef, ready);
  useDataSources(props, mapRef, ready);
  useVisibility(props, mapRef, ready);
  useCamera(props, mapRef, ready);
  useOpacity(props, mapRef, ready);
  useDrawMode(props, drawRef, latest, ready);
}
