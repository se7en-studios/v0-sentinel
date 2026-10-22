import type { Map as MLMap } from "maplibre-gl";
import { toast } from "sonner";
import { createTileErrorTracker } from "@/lib/admin/map-tile-errors";

const TOAST_ID = "map-base-down";

/**
 * Watches the raster base for failing tiles. A burst of failures raises a
 * single toast; the next loaded tile re-arms it. Never throws.
 * Listeners die with `map.remove()`.
 */
export function watchTileErrors(map: MLMap) {
  const tracker = createTileErrorTracker();
  map.on("error", (e) => {
    try {
      // tile errors carry the source id at runtime, typings only expose `error`
      if ((e as { sourceId?: string }).sourceId !== "base") return;
      if (!tracker.fail(Date.now())) return;
      toast.error("El mapa base no responde", {
        id: TOAST_ID,
        description:
          "No se pudieron cargar las imágenes. Revisá la conexión o probá otro mapa base.",
      });
    } catch {
      /* a notification must never break the map */
    }
  });
  map.on("sourcedata", (e) => {
    if (e.sourceId !== "base" || !("tile" in e) || !e.tile) return;
    tracker.ok();
    try {
      toast.dismiss(TOAST_ID);
    } catch {
      /* no toaster mounted */
    }
  });
}
