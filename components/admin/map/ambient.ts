import type { Map as MLMap } from "maplibre-gl";
import type { MutableRefObject } from "react";
import { DASH_FRAMES } from "@/lib/admin/map-config";
import type { MapProps } from "./types";

/**
 * Ambient motion: fire glow pulse + route flow dash, then the intro flyTo.
 * The caller skips it entirely under prefers-reduced-motion. Returns a cleanup.
 */
export function startAmbient(
  map: MLMap,
  latest: MutableRefObject<MapProps>,
  region: MapProps["region"],
): () => void {
  let last = 0;
  let lastGlow = -1;
  let lastDash = -1;
  // touch devices are the ones that overheat: half the repaint rate there
  const everyMs = window.matchMedia("(pointer: coarse)").matches ? 180 : 90;
  let raf = 0;
  const tick = (t: number) => {
    raf = requestAnimationFrame(tick);
    // each paint change forces a full map repaint: skip while hidden or while the map is already moving
    if (document.hidden || t - last < everyMs || map.isMoving()) return;
    last = t;
    const s = (Math.sin(t / 650) + 1) / 2;
    const glow = Math.round(s * 12) / 12;
    const firesOn =
      latest.current.show.fires && (latest.current.opacity?.fires ?? 1) > 0;
    if (firesOn && glow !== lastGlow && map.getLayer("fires-glow")) {
      lastGlow = glow;
      map.setPaintProperty(
        "fires-glow",
        "circle-opacity",
        (0.3 + 0.32 * glow) * (latest.current.opacity?.fires ?? 1),
      );
    }
    const dash = Math.floor(t / 110) % DASH_FRAMES.length;
    if (
      dash !== lastDash &&
      map.getLayer("route-flow") &&
      latest.current.show.routes
    ) {
      lastDash = dash;
      map.setPaintProperty("route-flow", "line-dasharray", DASH_FRAMES[dash]);
    }
  };
  raf = requestAnimationFrame(tick);
  map.flyTo({
    center: region.center,
    zoom: region.zoom,
    duration: 3200,
    curve: 1.6,
    essential: false,
  });
  return () => cancelAnimationFrame(raf);
}
