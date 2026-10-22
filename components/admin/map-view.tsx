"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { forwardRef, useEffect, useRef, useState } from "react";
import type * as maplibregl from "maplibre-gl";
import type { TerraDraw } from "terra-draw";
import { useMapBootstrap } from "./map/use-map-bootstrap";
import { useMapHandle } from "./map/use-map-handle";
import { useMapMarkers, useMarkerStore } from "./map/use-map-markers";
import { useMapSync } from "./map/use-map-sync";
import type { MapHandle, MapProps } from "./map/types";

// public contract: consumers keep importing these from "./map-view"
export type {
  DroneMarker,
  MapHandle,
  ShowLayers,
  UnitMarker,
} from "./map/types";

/** Quiet screen-reader notice when the number of open early alerts changes (the map itself is a canvas). */
function useMapNotice(openEarly: number, ready: boolean) {
  const [msg, setMsg] = useState("");
  const prev = useRef<number | null>(null);
  useEffect(() => {
    if (!ready) return;
    const before = prev.current;
    prev.current = openEarly;
    if (before === null || before === openEarly) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- announcement text derived from a change
    setMsg(`Alertas tempranas abiertas en el mapa: ${openEarly}.`);
  }, [openEarly, ready]);
  return msg;
}

export const MapView = forwardRef<MapHandle, MapProps>(
  function MapView(props, ref) {
    const box = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const drawRef = useRef<TerraDraw | null>(null);
    const markers = useMarkerStore();
    const latest = useRef(props);
    latest.current = props;
    const [ready, setReady] = useState(false);

    useMapHandle(ref, mapRef, latest);
    useMapBootstrap({ box, mapRef, drawRef, latest, markers, setReady });
    useMapSync(props, mapRef, drawRef, latest, ready);
    useMapMarkers(props, mapRef, markers, ready);
    const notice = useMapNotice(
      (props.early ?? []).filter((e) => e.status === "open").length,
      ready,
    );

    return (
      <div
        className="absolute inset-0"
        role="region"
        aria-label="Mapa de focos de calor. Con el mapa enfocado, las flechas lo desplazan y más/menos acercan."
      >
        <div ref={box} className="h-full w-full" />
        <p className="sr-only" role="status" aria-live="polite">
          {notice}
        </p>
      </div>
    );
  },
);
