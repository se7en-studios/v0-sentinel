import type { Map as MLMap } from "maplibre-gl";
import type { MutableRefObject } from "react";
import { DASH_FRAMES } from "@/lib/admin/map-config";
import { MODE_ROLE } from "@/lib/admin/types";
import type { MapProps } from "./types";

/**
 * Ambient motion: the route flow dash, then the intro flyTo.
 * Every paint change forces a full map repaint, so the dash only runs while a drone route is drawn
 * and shown: an idle map with no routes repaints nothing. The fire glow used to pulse here too; on a
 * panel with thousands of detections that was ~10 full repaints a second of pure decoration, so the
 * glow is now static (map-layers.ts, opacity.ts).
 * The caller skips it entirely under prefers-reduced-motion. Returns a cleanup.
 */
export function startAmbient(
  map: MLMap,
  latest: MutableRefObject<MapProps>,
  region: MapProps["region"],
): () => void {
  let lastDash = -1;
  // touch devices are the ones that overheat: half the repaint rate there
  const everyMs = window.matchMedia("(pointer: coarse)").matches ? 220 : 110;
  // a paint change starts MapLibre's default 300 ms transition: apply the small steps instantly
  if (map.getLayer("route-flow"))
    // transition props are valid style-spec paint keys the typings leave out
    map.setPaintProperty("route-flow", "line-dasharray-transition" as never, { duration: 0, delay: 0 } as never);
  // a map scrolled out of view keeps no animation alive
  let inView = true;
  const watcher =
    typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(([e]) => {
          inView = e?.isIntersecting ?? true;
        });
  watcher?.observe(map.getContainer());
  const hasRoutes = () =>
    latest.current.show.routes &&
    latest.current.features.some((f) => MODE_ROLE[String(f.properties.mode)] === "route");
  // a timer, not a frame loop: an idle panel should not wake the CPU on every display frame (60-170/s)
  // just to find there is nothing to animate; MapLibre schedules its own frame for each paint change
  const tick = () => {
    if (document.hidden || !inView || map.isMoving()) return;
    if (!map.getLayer("route-flow") || !hasRoutes()) return;
    const t = performance.now();
    const dash = Math.floor(t / everyMs) % DASH_FRAMES.length;
    if (dash === lastDash) return;
    lastDash = dash;
    map.setPaintProperty("route-flow", "line-dasharray", DASH_FRAMES[dash]);
  };
  const timer = setInterval(tick, everyMs);
  map.flyTo({
    center: region.center,
    zoom: region.zoom,
    duration: 3200,
    curve: 1.6,
    essential: false,
  });
  return () => {
    clearInterval(timer);
    watcher?.disconnect();
  };
}
