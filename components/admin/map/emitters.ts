import type { Map as MLMap } from "maplibre-gl";
import type { MutableRefObject } from "react";
import type { MapProps } from "./types";

/**
 * Cursor, camera and center emitters toward the admin shell. Returns a cleanup
 * that cancels any pending frame.
 */
export function attachEmitters(
  map: MLMap,
  latest: MutableRefObject<MapProps>,
): () => void {
  let cursorRaf = 0;
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

  return () => {
    cancelAnimationFrame(cursorRaf);
    cancelAnimationFrame(camRaf);
  };
}
