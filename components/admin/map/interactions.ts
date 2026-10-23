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
  type PopupActions,
} from "./helpers";
import { zoneCreator } from "@/lib/admin/map-popup";
import type { MapProps } from "./types";

// zones sit under everything else: a detection inside one must stay clickable
const PRIORITY_SELECTABLE = ["sensor-pt", "route-flow", "path-line"];
const FIRE_HITS = ["fires3d", "fires-pt", "fires-cluster", "early-pt"];
const HOVERABLE = [
  ...PRIORITY_SELECTABLE,
  "zone-fill",
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

/** Popup shortcuts for a point: new zone only on maps that can create one, incident link only when the point belongs to one. */
function popupActions(
  latest: MutableRefObject<MapProps>,
  lat: number,
  lng: number,
): PopupActions {
  const p = latest.current;
  return {
    // read latest at click time: the popup can outlive the render it was opened in
    createZone: p.onCreateZone
      ? zoneCreator(
          (f) => latest.current.onCreateZone?.(f),
          // randomUUID is missing on plain http (a tablet opening the panel by LAN address)
          () =>
            globalThis.crypto?.randomUUID?.() ??
            `z-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
        )
      : undefined,
    openIncident:
      p.onOpenIncident && p.incidentAt?.(lat, lng)
        ? () => latest.current.onOpenIncident?.(lat, lng)
        : undefined,
  };
}

/** Click selection, fire popup / cluster zoom and hover cursors. */
export function attachInteractions(
  map: MLMap,
  latest: MutableRefObject<MapProps>,
) {
  map.on("click", (e) => {
    if (latest.current.tool || latest.current.editing || isMeasuring(map))
      return;
    const at = (ids: string[]) =>
      map.queryRenderedFeatures(e.point, { layers: present(map, ids) })[0];
    const item = at(PRIORITY_SELECTABLE);
    if (item) return latest.current.onSelect(String(item.properties.fid));
    const fire = at(FIRE_HITS);
    if (fire?.layer.id === "early-pt") {
      earlyPopup(
        map,
        e.lngLat,
        fire.properties as EarlyProps,
        latest.current.terrainAt,
        popupActions(latest, e.lngLat.lat, e.lngLat.lng),
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
          popupActions(latest, e.lngLat.lat, e.lngLat.lng),
        );
      return;
    }
    const zone = at(["zone-fill"]);
    latest.current.onSelect(zone ? String(zone.properties.fid) : null);
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
