import { useEffect } from "react";
import type { MutableRefObject, RefObject, Dispatch, SetStateAction } from "react";
import * as maplibregl from "maplibre-gl";
import type { TerraDraw } from "terra-draw";
import { AR_BOUNDS } from "@/lib/admin/map-config";
import { addDataLayers, buildStyle } from "../map-layers";
import { createDraw } from "../map-draw";
import { attachEmitters } from "./emitters";
import { startAmbient } from "./ambient";
import { attachInteractions } from "./interactions";
import { reducedMotion } from "./helpers";
import { watchTileErrors } from "./tile-errors";
import type { MarkerStore } from "./use-map-markers";
import type { MapProps } from "./types";

interface Refs {
  box: RefObject<HTMLDivElement | null>;
  mapRef: MutableRefObject<maplibregl.Map | null>;
  drawRef: MutableRefObject<TerraDraw | null>;
  latest: MutableRefObject<MapProps>;
  markers: MarkerStore;
  setReady: Dispatch<SetStateAction<boolean>>;
}

/** Creates the map once, wires draw / interactions / emitters / ambient motion and tears it all down. */
export function useMapBootstrap({
  box,
  mapRef,
  drawRef,
  latest,
  markers,
  setReady,
}: Refs) {
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
      },
      // high-DPI screens multiply fill-rate (terrain + extrusions); 1.75 looks the same at a fraction of the cost
      pixelRatio: Math.min(window.devicePixelRatio || 1, 1.75),
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
    watchTileErrors(map);

    let stopEmitters = () => {};
    let stopAmbient = () => {};

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
      attachInteractions(map, latest);
      stopEmitters = attachEmitters(map, latest);
      if (!calm) stopAmbient = startAmbient(map, latest, p.region);
      setReady(true);
    });

    return () => {
      stopAmbient();
      stopEmitters();
      markers.clear();
      drawRef.current = null;
      try {
        map.remove();
      } catch {
        /* map already torn down */
      }
      mapRef.current = null;
      setReady(false);
    };
    // runs once: everything it reads goes through refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
