import type { Map as MLMap, GeoJSONSource } from "maplibre-gl";
import type { MutableRefObject } from "react";
import { clusterTargetZoom } from "@/lib/admin/map-cluster";
import { MEASURING_ATTR } from "@/lib/admin/map-measure";
import {
  earlyPopup,
  firePopup,
  reducedMotion,
  type EarlyProps,
  type FireProps,
} from "./helpers";
import type { MapProps } from "./types";

const SELECTABLE = ["sensor-pt", "route-flow", "path-line", "zone-fill"];
const FIRE_HITS = ["fires3d", "fires-pt", "fires-cluster", "early-pt"];
const HOVERABLE = [
  ...SELECTABLE,
  "fires-pt",
  "fires3d",
  "fires-cluster",
  "early-pt",
];

/** True while the measure tool owns map clicks. */
export const isMeasuring = (map: MLMap) =>
  map.getContainer().dataset[MEASURING_ATTR] === "1";

const present = (map: MLMap, ids: string[]) =>
  ids.filter((l) => map.getLayer(l));

function zoomIntoCluster(map: MLMap, clusterId: number, at: [number, number]) {
  const src = map.getSource("fires-cl") as GeoJSONSource | undefined;
  src
    ?.getClusterExpansionZoom(clusterId)
    .then((z) =>
      map.easeTo({
        center: at,
        zoom: clusterTargetZoom(z, map.getZoom()),
        duration: reducedMotion() ? 0 : 600,
      }),
    )
    .catch(() => undefined);
}

/** Click selection, fire popup / cluster zoom and hover cursors. */
export function attachInteractions(
  map: MLMap,
  latest: MutableRefObject<MapProps>,
) {
  map.on("click", (e) => {
    if (latest.current.tool || latest.current.editing || isMeasuring(map))
      return;
    const items = map.queryRenderedFeatures(e.point, {
      layers: present(map, SELECTABLE),
    })[0];
    if (items) return latest.current.onSelect(String(items.properties.fid));
    const fire = map.queryRenderedFeatures(e.point, {
      layers: present(map, FIRE_HITS),
    })[0];
    if (fire?.layer.id === "early-pt") {
      earlyPopup(
        map,
        e.lngLat,
        fire.properties as EarlyProps,
        latest.current.terrainAt,
      );
      return;
    }
    if (fire) {
      const pr = fire.properties as FireProps & { cluster_id?: number };
      if (pr.cluster_id !== undefined && fire.geometry.type === "Point")
        zoomIntoCluster(
          map,
          pr.cluster_id,
          fire.geometry.coordinates as [number, number],
        );
      else
        firePopup(
          map,
          e.lngLat,
          pr,
          latest.current.dayLabels,
          latest.current.terrainAt,
        );
      return;
    }
    latest.current.onSelect(null);
  });
  for (const l of HOVERABLE) {
    map.on("mouseenter", l, () => {
      if (!latest.current.tool && !isMeasuring(map))
        map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", l, () => {
      if (!isMeasuring(map)) map.getCanvas().style.cursor = "";
    });
  }
}
