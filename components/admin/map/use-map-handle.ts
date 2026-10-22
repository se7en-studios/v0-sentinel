import { useImperativeHandle } from "react";
import type { ForwardedRef, MutableRefObject } from "react";
import type * as maplibregl from "maplibre-gl";
import bbox from "@turf/bbox";
import { feature as turfFeature } from "@turf/helpers";
import type { MapHandle, MapProps } from "./types";

/** Imperative API exposed to the admin shell (camera, snapshot, projection). */
export function useMapHandle(
  ref: ForwardedRef<MapHandle>,
  mapRef: MutableRefObject<maplibregl.Map | null>,
  latest: MutableRefObject<MapProps>,
) {
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
    getMap: () => mapRef.current,
    // captured on the next render: lets the canvas run without preserveDrawingBuffer
    snapshot: () =>
      new Promise<string | null>((resolve) => {
        const m = mapRef.current;
        if (!m) return resolve(null);
        const timer = setTimeout(() => resolve(null), 1500);
        m.once("render", () => {
          clearTimeout(timer);
          try {
            resolve(m.getCanvas().toDataURL("image/jpeg", 0.88));
          } catch {
            resolve(null);
          }
        });
        m.triggerRepaint();
      }),
  }));
}
