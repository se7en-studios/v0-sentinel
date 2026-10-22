"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { forwardRef, useRef, useState } from "react";
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

    return (
      <div className="absolute inset-0">
        <div ref={box} className="h-full w-full" />
      </div>
    );
  },
);
