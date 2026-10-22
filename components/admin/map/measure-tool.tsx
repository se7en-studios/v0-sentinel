"use client";

import { useEffect, useMemo, useState } from "react";
import type { GeoJSONSource, Map as MLMap } from "maplibre-gl";
import { Ruler as RulerIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtArea, fmtKm } from "@/lib/admin/geo";
import { MEASURING_ATTR, measure, type LngLat } from "@/lib/admin/map-measure";

const SRC = "measure";
const LAYERS = ["measure-fill", "measure-line", "measure-pts"];
const glass =
  "glass rounded-xl border border-[var(--hairline)] shadow-[var(--shadow-1)]";

export function MeasureToggle({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label="Medir distancia y área"
      title="Medir (Esc para salir)"
      onClick={onToggle}
      className={cn(
        glass,
        "grid size-10 place-items-center transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active && "bg-primary text-primary-foreground",
      )}
    >
      <RulerIcon className="size-4" aria-hidden />
    </button>
  );
}

function collection(
  points: LngLat[],
  closed: boolean,
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  if (points.length >= 2)
    features.push({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates:
          closed && points.length >= 3 ? [...points, points[0]] : points,
      },
    });
  if (closed && points.length >= 3)
    features.push({
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: [[...points, points[0]]] },
    });
  for (const p of points)
    features.push({
      type: "Feature",
      properties: {},
      geometry: { type: "Point", coordinates: p },
    });
  return { type: "FeatureCollection", features };
}

function addLayers(map: MLMap) {
  map.addSource(SRC, {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  map.addLayer({
    id: "measure-fill",
    type: "fill",
    source: SRC,
    filter: ["==", ["geometry-type"], "Polygon"],
    paint: { "fill-color": "#ffffff", "fill-opacity": 0.14 },
  });
  map.addLayer({
    id: "measure-line",
    type: "line",
    source: SRC,
    filter: ["==", ["geometry-type"], "LineString"],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#ffd24a",
      "line-width": 3,
      "line-dasharray": [2, 1.2],
    },
  });
  map.addLayer({
    id: "measure-pts",
    type: "circle",
    source: SRC,
    filter: ["==", ["geometry-type"], "Point"],
    paint: {
      "circle-radius": 5,
      "circle-color": "#ffd24a",
      "circle-stroke-color": "#1a1a1a",
      "circle-stroke-width": 1.5,
    },
  });
}

function removeLayers(map: MLMap) {
  try {
    for (const id of LAYERS) if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(SRC)) map.removeSource(SRC);
  } catch {
    /* map already torn down */
  }
}

/** Click-to-measure: running distance and, once closed, area. Esc or the X closes it. */
export function MeasureTool({
  getMap,
  units,
  onClose,
}: {
  getMap: () => MLMap | null;
  units: "ha" | "km2";
  onClose: () => void;
}) {
  const [points, setPoints] = useState<LngLat[]>([]);
  const [closed, setClosed] = useState(false);

  // map side: own layers, click capture, crosshair; selection ignores clicks while measuring
  useEffect(() => {
    const map = getMap();
    if (!map) return;
    const box = map.getContainer();
    try {
      addLayers(map);
    } catch {
      /* style not ready: the panel still works, only the overlay is missing */
    }
    box.dataset[MEASURING_ATTR] = "1";
    map.getCanvas().style.cursor = "crosshair";
    const onClick = (e: { lngLat: { lng: number; lat: number } }) =>
      setPoints((p) => [...p, [e.lngLat.lng, e.lngLat.lat]]);
    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
      delete box.dataset[MEASURING_ATTR];
      map.getCanvas().style.cursor = "";
      removeLayers(map);
    };
  }, [getMap]);

  useEffect(() => {
    const src = getMap()?.getSource(SRC) as GeoJSONSource | undefined;
    src?.setData(collection(points, closed));
  }, [points, closed, getMap]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const m = useMemo(() => measure(points, closed), [points, closed]);
  const canClose = points.length >= 3;
  const clear = () => {
    setPoints([]);
    setClosed(false);
  };

  return (
    <div
      role="group"
      aria-label="Herramienta de medición"
      className={cn(
        glass,
        "absolute left-16 top-[6.25rem] z-20 w-52 p-2.5 text-[12px]",
      )}
    >
      <div className="mb-1 flex items-center justify-between font-medium">
        Medir
        <button
          type="button"
          aria-label="Cerrar medición"
          onClick={onClose}
          className="rounded text-foreground/55 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <div className="num text-[15px] font-semibold" aria-live="polite">
        {points.length < 2 ? "Click en el mapa" : fmtKm(m.km)}
      </div>
      {m.ha !== null && (
        <div className="num text-foreground/70">{fmtArea(m.ha, units)}</div>
      )}
      <div className="mt-2 flex gap-1.5">
        <button
          type="button"
          onClick={() => setClosed((c) => !c)}
          disabled={!canClose}
          className="rounded-lg border border-[var(--hairline)] px-2 py-1 text-[11px] hover:bg-foreground/[0.06] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {closed ? "Abrir" : "Cerrar área"}
        </button>
        <button
          type="button"
          onClick={clear}
          disabled={!points.length}
          className="rounded-lg border border-[var(--hairline)] px-2 py-1 text-[11px] hover:bg-foreground/[0.06] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Limpiar
        </button>
      </div>
    </div>
  );
}
