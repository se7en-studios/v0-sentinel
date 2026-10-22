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
  // a paint change starts MapLibre's default 300 ms transition: apply the small steps instantly
  const instant = { duration: 0, delay: 0 };
  for (const [layer, prop] of [
    ["fires-glow", "circle-opacity-transition"],
    ["route-flow", "line-dasharray-transition"],
  ])
    if (map.getLayer(layer))
      // transition props are valid style-spec paint keys the typings leave out
      map.setPaintProperty(layer, prop as never, instant as never);
  let raf = 0;
  // a map scrolled out of view keeps no animation alive
  let inView = true;
  const watcher =
    typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(([e]) => {
          inView = e?.isIntersecting ?? true;
        });
  watcher?.observe(map.getContainer());
  const tick = (t: number) => {
    raf = requestAnimationFrame(tick);
    // each paint change forces a full map repaint: skip while hidden, off screen or while the map is already moving
    if (document.hidden || !inView || t - last < everyMs || map.isMoving())
      return;
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
  return () => {
    cancelAnimationFrame(raf);
    watcher?.disconnect();
  };
}
