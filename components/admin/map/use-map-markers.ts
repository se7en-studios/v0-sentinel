import { useCallback, useEffect, useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import * as maplibregl from "maplibre-gl";
import { makeDroneEl } from "./helpers";
import type { MapProps } from "./types";

type DroneEntry = {
  m: maplibregl.Marker;
  el: HTMLDivElement;
  body: HTMLDivElement;
};

/** Marker registries plus one `clear` used by the bootstrap cleanup, before the map is removed. */
export function useMarkerStore() {
  const drones = useRef(new Map<string, DroneEntry>());
  const units = useRef(new Map<string, maplibregl.Marker>());
  const clear = useCallback(() => {
    drones.current.forEach(({ m }) => m.remove());
    drones.current.clear();
    units.current.forEach((mk) => mk.remove());
    units.current.clear();
  }, []);
  return useMemo(() => ({ drones, units, clear }), [clear]);
}

export type MarkerStore = ReturnType<typeof useMarkerStore>;

/** Drone markers (ground shadow, altitude stem, floating body) and response-unit markers. */
export function useMapMarkers(
  props: MapProps,
  mapRef: MutableRefObject<maplibregl.Map | null>,
  store: MarkerStore,
  ready: boolean,
) {
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const markers = store.drones;
    const seen = new Set<string>();
    if (props.show.drones) {
      for (const d of props.drones) {
        seen.add(d.id);
        let entry = markers.current.get(d.id);
        if (!entry) {
          const { el, body } = makeDroneEl(d.name);
          entry = {
            m: new maplibregl.Marker({ element: el, anchor: "bottom" })
              .setLngLat(d.pos)
              .addTo(map),
            el,
            body,
          };
          markers.current.set(d.id, entry);
        }
        entry.m.setLngLat(d.pos);
        entry.body.style.transform = `rotate(${Math.round(d.heading / 4) * 4}deg)`;
        entry.el.classList.toggle("snt-drone--sel", d.selected);
        // minimal: only the selected drone carries its name
        const tag = entry.el.querySelector<HTMLElement>(".snt-drone__label");
        if (tag) tag.hidden = !d.selected;
        entry.el.style.setProperty(
          "--lift",
          `${Math.round(18 + Math.min(34, d.altitude / 4))}px`,
        );
      }
    }
    markers.current.forEach(({ m }, id) => {
      if (!seen.has(id)) {
        m.remove();
        markers.current.delete(id);
      }
    });
  }, [props.drones, props.show.drones, ready, mapRef, store.drones]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const unitEls = store.units;
    const seen = new Set<string>();
    for (const u of props.unitMarkers ?? []) {
      seen.add(u.id);
      let mk = unitEls.current.get(u.id);
      if (!mk) {
        const el = document.createElement("div");
        el.className = "snt-unit";
        const dot = document.createElement("span");
        dot.className = "snt-unit__dot";
        dot.textContent =
          u.kind === "avion" || u.kind === "helicoptero"
            ? "✈"
            : u.kind === "brigada"
              ? "B"
              : "A";
        const label = document.createElement("span");
        label.className = "snt-unit__label";
        label.textContent = u.name;
        el.append(dot, label);
        mk = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat(u.pos)
          .addTo(map);
        unitEls.current.set(u.id, mk);
      }
      mk.setLngLat(u.pos);
    }
    unitEls.current.forEach((mk, id) => {
      if (!seen.has(id)) {
        mk.remove();
        unitEls.current.delete(id);
      }
    });
  }, [props.unitMarkers, ready, mapRef, store.units]);
}
