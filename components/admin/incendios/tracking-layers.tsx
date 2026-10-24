"use client";

// Draws the fire-tracking module on Sentinel's own map (MapHandle.getMap):
// the national overview when no fire is selected, the selected fire's
// replay otherwise. Every source and layer is prefixed "trk-" and removed
// when the tab is left, so the rest of the admin never sees them.

import { useEffect, useRef, useState, type RefObject } from "react";
import * as maplibregl from "maplibre-gl";
import type { ExpressionSpecification, Map as MlMap, MapLayerMouseEvent } from "maplibre-gl";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NUM_LOCALE } from "@/lib/admin/i18n-shell";
import type { Locale, MsgKey, Translate } from "@/lib/admin/i18n";
import type { MapHandle } from "../map-view";
import type { LiveBundle, LiveFireMeta } from "@/lib/incident";
import type { Derived } from "./derive";
import { fmtDayTime, fmtHa, placeName, satLabel } from "./format";
import type { Tracking } from "./use-tracking";

const AR_BOUNDS: [[number, number], [number, number]] = [
  [-74.5, -55.2],
  [-53, -21.5],
];
const RAMP: ExpressionSpecification = ["interpolate", ["linear"], ["get", "k"], 0, "#fff1a8", 0.2, "#ffc145", 0.45, "#f2711c", 0.7, "#d9480f", 1, "#7a1c06"];
const STATE_COLOR: ExpressionSpecification = ["match", ["get", "state"], "nuevo", "#ffb020", "reactivado", "#d63fa0", "#ff5a2a"];
const FOOTPRINT: ExpressionSpecification = ["interpolate", ["exponential", 2], ["zoom"], 6, 0.6, 9, 1.6, 16, 105];
const AGE_COLOR: ExpressionSpecification = ["step", ["get", "ageH"], "#e0201b", 6, "#ff7a1a", 24, "#f5a524", 72, "#9c6b4a"];
const FIRE_KIND: ExpressionSpecification = ["case", ["==", ["get", "forestal"], 1], "#c2410c", "#e0a526"];

type Handler = { type: "click" | "mousemove" | "mouseleave"; layer: string; fn: (e: MapLayerMouseEvent) => void };

/** "a 71 km de Fuerte Esperanza (Chaco)" → "Fuerte Esperanza" */
const town = (m: LiveFireMeta) => m.name.replace(/\s*\(.*\)$/, "").replace(/^(en|a \d+ km de) /, "");
const TOP_LABELS = 5;

export function TrackingLayers({ mapHandle, t, active, tr, locale }: { mapHandle: RefObject<MapHandle | null>; t: Tracking; active: boolean; tr: Translate; locale: Locale }) {
  const mapRef = useRef<MlMap | null>(null);
  const handlers = useRef<Handler[]>([]);
  const marker = useRef<maplibregl.Marker | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);
  const built = useRef<string>("");
  const saved = useRef<{ bounds: maplibregl.LngLatBounds | null; minZoom: number } | null>(null);
  const latest = useRef(t);
  // the map callbacks and the popups read the interface language from here, like the state
  const lang = useRef({ tr, loc: NUM_LOCALE[locale] });
  // eslint-disable-next-line react-hooks/refs -- "latest ref": the map callbacks read the newest state
  latest.current = t;
  // eslint-disable-next-line react-hooks/refs -- same
  lang.current = { tr, loc: NUM_LOCALE[locale] };

  // wait for Sentinel's map (it mounts lazily) and keep a handle on it
  useEffect(() => {
    if (!active) return;
    let timer: ReturnType<typeof setInterval> | null = setInterval(() => {
      // optional on Sentinel's MapHandle: tools that draw their own overlay use it
      const m = mapHandle.current?.getMap?.() ?? null;
      if (m && m.getStyle()) {
        mapRef.current = m;
        // Sentinel keeps its map inside a box around Argentina, at zoom 3 or
        // more; on a wide screen the box, and on a phone the zoom, stop the
        // national view from fitting. Lift both while this tab is open, put
        // them back when leaving.
        if (!saved.current) {
          saved.current = { bounds: m.getMaxBounds(), minZoom: m.getMinZoom() };
          m.setMaxBounds(null);
          m.setMinZoom(1);
        }
        if (timer) clearInterval(timer);
        timer = null;
        sync();
        // Sentinel's map flies to its region on "load" (a 3.2 s intro): frame
        // right after that handler so ours wins; if it already loaded, now
        if ((m as unknown as { _loaded?: boolean })._loaded) frame();
        else m.once("load", () => setTimeout(frame, 0));
      }
    }, 250);
    return () => {
      if (timer) clearInterval(timer);
      clear();
      if (mapRef.current && saved.current) {
        try {
          mapRef.current.setMinZoom(saved.current.minZoom);
          mapRef.current.setMaxBounds(saved.current.bounds);
        } catch {
          /* map already gone */
        }
      }
      saved.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // rebuild when the data or the selected fire changes; restyle on every tick
  const key = t.d ? `${t.d.b.id}:${t.d.fire.id}` : t.live ? `ov:${t.live.generated}` : "";
  // (a language change rebuilds too: the map's labels and the ignition tooltip carry text)
  useEffect(() => {
    if (active) sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, active, tr]);
  useEffect(() => {
    if (active && mapRef.current && built.current) restyle();
  }, [t.cur, t.layers, t.shown, active]);

  // camera follows the selection (also once the map first shows up)
  useEffect(() => {
    if (active) frame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // a province picked in the dock
  useEffect(() => {
    const map = mapRef.current;
    if (!active || !map || !t.view) return;
    const [w, s, e, n] = t.view.bbox;
    map.resize();
    map.fitBounds([[w, s], [e, n]], { padding: 60, maxZoom: 9, duration: 1400 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.view?.n]);

  if (!active) return null;
  return <Legend mode={t.d ? "fire" : "overview"} filter={t.filter} dnbr={!!t.dnbr && t.layers.dnbr} tr={tr} />;

  function frame() {
    const map = mapRef.current;
    const s = latest.current;
    if (!map) return;
    // the dock under the map changes height with the selection; size the
    // canvas to its box first, or the camera centres on the old canvas
    map.resize();
    if (s.d) {
      const v = s.d.b.view;
      const fire = s.live?.live.meta.find((m) => m.id === s.d!.fire.id);
      if (fire) {
        const [w, so, e, n] = fire.bbox;
        map.fitBounds([[w, so], [e, n]], { padding: 80, maxZoom: 12.5, duration: 1600 });
      } else map.flyTo({ center: v.center, zoom: v.zoom - 0.6, duration: 1800 });
    } else if (s.live) map.fitBounds(AR_BOUNDS, { padding: 30, duration: 1400 });
  }

  function clear() {
    const map = mapRef.current;
    if (!map) return;
    for (const h of handlers.current) map.off(h.type, h.layer, h.fn);
    handlers.current = [];
    marker.current?.remove();
    marker.current = null;
    popup.current?.remove();
    try {
      for (const l of map.getStyle()?.layers ?? []) if (l.id.startsWith("trk-")) map.removeLayer(l.id);
      for (const s of Object.keys(map.getStyle()?.sources ?? {})) if (s.startsWith("trk-")) map.removeSource(s);
      if (map.hasImage("trk-arrowhead")) map.removeImage("trk-arrowhead");
    } catch {
      /* map already gone */
    }
    built.current = "";
  }

  function on(type: Handler["type"], layer: string, fn: Handler["fn"]) {
    mapRef.current?.on(type, layer, fn);
    handlers.current.push({ type, layer, fn });
  }

  function sync() {
    const map = mapRef.current;
    const s = latest.current;
    if (!map) return;
    clear();
    try {
      if (s.d) buildFire(map, s.d, s.live);
      else if (s.live) buildOverview(map, s.live);
      else return;
      built.current = key;
      restyle();
    } catch {
      // style still settling: try again shortly
      setTimeout(sync, 300);
    }
  }

  function buildOverview(map: MlMap, b: LiveBundle) {
    const meta = new Map(b.live.meta.map((m) => [m.id, m]));
    const end = b.live.windowEnd;
    map.addSource("trk-hulls", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: b.fires.flatMap((f) => {
          const hull = [...f.steps].reverse().find((x) => x.hull)?.hull;
          const m = meta.get(f.id);
          return hull && m ? [{ type: "Feature" as const, geometry: { type: "MultiPolygon" as const, coordinates: hull }, properties: { id: f.id, forestal: m.forestal ? 1 : 0 } }] : [];
        }),
      },
    });
    map.addLayer({ id: "trk-hull-fill", type: "fill", source: "trk-hulls", minzoom: 7, paint: { "fill-color": FIRE_KIND, "fill-opacity": 0.22 } });
    map.addLayer({ id: "trk-hull-line", type: "line", source: "trk-hulls", minzoom: 7, paint: { "line-color": FIRE_KIND, "line-width": 1.2 } });
    map.addSource("trk-px", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: b.pixels.map(([lng, lat, min, , frp, , , fire]) => ({
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [lng, lat] },
          properties: { fire, frp, ageH: (end - (b.t0 + min * 60_000)) / 3_600_000 },
        })),
      },
    });
    map.addLayer({
      id: "trk-px",
      type: "circle",
      source: "trk-px",
      minzoom: 6,
      paint: {
        "circle-radius": ["interpolate", ["exponential", 2], ["zoom"], 6, 1.6, 10, 3, 16, 105],
        "circle-color": AGE_COLOR,
        "circle-opacity": ["case", ["<", ["get", "ageH"], 24], 0.95, 0.6],
        "circle-pitch-alignment": "map",
      },
    });
    const area = new Map(b.fires.map((f) => [f.id, f.areaHa]));
    map.addSource("trk-fires", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: b.live.meta.map((m) => ({
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: m.center },
          properties: {
            id: m.id,
            forestal: m.forestal ? 1 : 0,
            now: m.activity === "ahora" ? 1 : 0,
            latent: m.activity === "latente" || m.activity === "extinguido" ? 1 : 0,
            area: area.get(m.id) ?? 0,
            label: `${town(m)}\n${fmtHa(area.get(m.id) ?? 0, lang.current.loc)}`,
          },
        })),
      },
    });
    const radius: ExpressionSpecification = ["interpolate", ["linear"], ["sqrt", ["get", "area"]], 0, 3, 10, 5, 30, 10, 60, 16];
    // fires with detections in the last 24 h glow: the first thing to read on the national map
    map.addLayer({
      id: "trk-fires-glow",
      type: "circle",
      source: "trk-fires",
      maxzoom: 9.5,
      filter: ["==", ["get", "now"], 1],
      paint: { "circle-radius": ["*", 2.4, radius], "circle-color": "#ff5a1f", "circle-blur": 0.9, "circle-opacity": 0.5 },
    });
    map.addLayer({
      id: "trk-fires",
      type: "circle",
      source: "trk-fires",
      maxzoom: 9.5,
      paint: {
        "circle-radius": radius,
        "circle-color": FIRE_KIND,
        "circle-opacity": ["case", ["==", ["get", "now"], 1], 0.95, ["==", ["get", "latent"], 1], 0.3, 0.6],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": ["case", ["==", ["get", "now"], 1], 1.5, 0.6],
      },
    });
    // the biggest fires are named at country scale; every fire once zoomed in
    const label = (id: string, extra: Partial<maplibregl.SymbolLayerSpecification>) =>
      map.addLayer({
        id,
        type: "symbol",
        source: "trk-fires",
        layout: {
          "text-field": ["get", "label"],
          "text-font": ["Noto Sans Bold"],
          "text-size": 10.5,
          "text-line-height": 1.15,
          "text-offset": [0, 1],
          "text-anchor": "top",
          "symbol-sort-key": ["-", 0, ["get", "area"]],
        },
        paint: { "text-color": "#1a1812", "text-halo-color": "#ffffff", "text-halo-width": 1.4 },
        ...extra,
      } as maplibregl.SymbolLayerSpecification);
    label("trk-fire-labels-top", { maxzoom: 6 });
    label("trk-fire-labels", { minzoom: 6, maxzoom: 11 });

    popup.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false, className: "snt-popup", offset: 10 });
    const pick = (e: MapLayerMouseEvent) => {
      const p = e.features?.[0]?.properties;
      const id = Number(p?.id ?? p?.fire);
      return Number.isFinite(id) ? id : null;
    };
    const ACTIVITY = { ahora: "trk.pop.active24", activo: "trk.pop.quiet", latente: "trk.act.latent", extinguido: "trk.pop.out" } as const;
    for (const layer of ["trk-fires", "trk-hull-fill", "trk-px"]) {
      on("mousemove", layer, (e) => {
        const id = pick(e);
        const m = id !== null ? meta.get(id) : undefined;
        if (!m) return;
        map.getCanvas().style.cursor = "pointer";
        const { tr, loc } = lang.current;
        popup.current
          ?.setLngLat(e.lngLat)
          .setHTML(
            `<div class="snt-pop"><b>${placeName(tr, m.name)}</b>` +
              `<span>${tr(m.forestal ? "trk.b.forest" : "trk.b.agri")} · ${fmtHa(area.get(m.id) ?? 0, loc)}</span>` +
              `<span>${m.detections24h ? tr(m.detections24h === 1 ? "trk.pop.foci24.one" : "trk.pop.foci24.other", { n: m.detections24h }) : tr(ACTIVITY[m.activity])}</span>` +
              `<span style="opacity:.6">${tr("trk.pop.click")}</span></div>`,
          )
          .addTo(map);
      });
      on("mouseleave", layer, () => {
        map.getCanvas().style.cursor = "";
        popup.current?.remove();
      });
      on("click", layer, (e) => {
        const id = pick(e);
        if (id !== null) latest.current.select(id);
      });
    }
  }

  function buildFire(map: MlMap, d: Derived, live: LiveBundle | null) {
    map.addSource("trk-others", { type: "geojson", data: d.otherPerimeters });
    map.addLayer({ id: "trk-others-fill", type: "fill", source: "trk-others", paint: { "fill-color": "#ffffff", "fill-opacity": 0.08 } });
    map.addLayer({ id: "trk-others-line", type: "line", source: "trk-others", paint: { "line-color": "#ffffff", "line-width": 1.1, "line-dasharray": [2, 2], "line-opacity": 0.7 } });

    const dnbr = latest.current.dnbr;
    if (dnbr) {
      map.addSource("trk-dnbr", {
        type: "image",
        url: `/data/${d.b.id}/dnbr.png`,
        coordinates: dnbr.bounds as [[number, number], [number, number], [number, number], [number, number]],
      });
      map.addLayer({ id: "trk-dnbr", type: "raster", source: "trk-dnbr", paint: { "raster-opacity": 0.85, "raster-resampling": "nearest" } });
    }

    map.addSource("trk-perimeters", { type: "geojson", data: d.perimeters });
    map.addLayer({ id: "trk-perim-fill", type: "fill", source: "trk-perimeters", paint: { "fill-color": "#1a0d08", "fill-opacity": 0.3 } });
    map.addSource("trk-iso", { type: "geojson", data: d.isochrones });
    map.addLayer({ id: "trk-iso", type: "line", source: "trk-iso", layout: { "line-join": "round" }, paint: { "line-color": RAMP, "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.8, 13, 1.8], "line-opacity": 0.9 } });
    map.addLayer({ id: "trk-iso-cur", type: "line", source: "trk-iso", layout: { "line-join": "round" }, paint: { "line-color": "#fff6dc", "line-width": ["interpolate", ["linear"], ["zoom"], 9, 1.8, 13, 3.2] } });

    map.addSource("trk-fl", { type: "geojson", data: d.fireLines });
    map.addLayer({ id: "trk-fl-glow", type: "line", source: "trk-fl", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#ff7a1a", "line-width": 10, "line-blur": 8, "line-opacity": 0.75 } });
    map.addLayer({ id: "trk-fl", type: "line", source: "trk-fl", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#ffe08a", "line-width": 2.6 } });

    map.addSource("trk-fpx", { type: "geojson", data: d.pixels });
    map.addLayer({ id: "trk-px-old", type: "circle", source: "trk-fpx", paint: { "circle-radius": FOOTPRINT, "circle-color": "#5a1609", "circle-opacity": 0.55, "circle-pitch-alignment": "map" } });
    map.addLayer({
      id: "trk-px-glow",
      type: "circle",
      source: "trk-fpx",
      paint: { "circle-radius": ["interpolate", ["exponential", 2], ["zoom"], 6, 3, 9, 7, 16, 160], "circle-color": STATE_COLOR, "circle-blur": 1, "circle-opacity": 0.55, "circle-pitch-alignment": "map" },
    });
    map.addLayer({
      id: "trk-px-now",
      type: "circle",
      source: "trk-fpx",
      paint: {
        "circle-radius": FOOTPRINT,
        "circle-color": STATE_COLOR,
        "circle-stroke-color": ["case", ["==", ["get", "spot"], 1], "#ffffff", "rgba(0,0,0,0)"],
        "circle-stroke-width": ["case", ["==", ["get", "spot"], 1], 1.5, 0],
        "circle-pitch-alignment": "map",
      },
    });

    if (!map.hasImage("trk-arrowhead")) map.addImage("trk-arrowhead", arrowHead(), { pixelRatio: 2 });
    map.addSource("trk-arrows", { type: "geojson", data: d.arrows });
    map.addLayer({ id: "trk-arrows", type: "line", source: "trk-arrows", layout: { "line-cap": "round" }, paint: { "line-color": "#ffd166", "line-width": 2.4, "line-dasharray": [1, 1.2] } });
    map.addLayer({
      id: "trk-arrow-heads",
      type: "symbol",
      source: "trk-arrows",
      layout: { "symbol-placement": "line", "symbol-spacing": 10_000, "icon-image": "trk-arrowhead", "icon-rotation-alignment": "map", "icon-allow-overlap": true, "icon-anchor": "right" },
    });

    map.addSource("trk-labels", { type: "geojson", data: d.labels });
    map.addLayer({
      id: "trk-labels",
      type: "symbol",
      source: "trk-labels",
      layout: { "text-field": ["get", "label"], "text-font": ["Noto Sans Bold"], "text-size": 11, "text-offset": [0, -1.1], "text-anchor": "bottom" },
      paint: { "text-color": "#1a1812", "text-halo-color": "#fff6dc", "text-halo-width": 1.6 },
    });

    const ign = document.createElement("div");
    ign.className = "ignition-pulse";
    ign.title = lang.current.tr("trk.ign.title", { time: fmtDayTime(d.fire.ignition.t, lang.current.loc), sat: satLabel(d.fire.ignition.sat) });
    marker.current = new maplibregl.Marker({ element: ign }).setLngLat(d.fire.ignition.at).addTo(map);

    popup.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false, className: "snt-popup", offset: 10 });
    for (const layer of ["trk-px-now", "trk-px-old"]) {
      on("mousemove", layer, (e) => {
        const p = e.features?.[0]?.properties as Record<string, string | number> | undefined;
        if (!p) return;
        map.getCanvas().style.cursor = "pointer";
        const { tr, loc } = lang.current;
        const time = fmtDayTime(Number(p.t), loc);
        const sat = satLabel(String(p.sat));
        const state = tr(`trk.pop.${p.state}` as MsgKey);
        popup.current
          ?.setLngLat(e.lngLat)
          .setHTML(
            `<div class="snt-pop"><b>${p.main ? tr("trk.pop.px", { time }) : tr("trk.pop.pxOther", { fire: p.fire, time })}</b>` +
              `<span>${tr(Number(p.day) ? "trk.pop.passDay" : "trk.pop.passNight", { sat })}</span>` +
              `<span>${tr("trk.pop.state", { state })}${Number(p.front) ? tr("trk.pop.front") : ""}${Number(p.spot) ? tr("trk.pop.spot") : ""}</span>` +
              `<span>${tr("trk.pop.frp", { frp: p.frp })}</span></div>`,
          )
          .addTo(map);
      });
      on("mouseleave", layer, () => {
        map.getCanvas().style.cursor = "";
        popup.current?.remove();
      });
    }
    // a pass of this fire, not of a neighbour's: the timeline spans this fire's life only
    on("click", "trk-px-now", (e) => {
      const p = e.features?.[0]?.properties;
      const step = Number(p?.step);
      if (Number(p?.main) === 1 && Number.isFinite(step)) latest.current.setCur(step);
    });
    void live;
  }

  function restyle() {
    const map = mapRef.current;
    const s = latest.current;
    if (!map) return;
    const vis = (id: string, v: boolean) => map.getLayer(id) && map.setLayoutProperty(id, "visibility", v ? "visible" : "none");
    const filt = (id: string, f: ExpressionSpecification) => map.getLayer(id) && map.setFilter(id, f);

    if (!s.d) {
      const ids: ExpressionSpecification = ["literal", s.shown.map((m) => m.id)];
      for (const l of ["trk-fires", "trk-fire-labels", "trk-hull-fill", "trk-hull-line"]) filt(l, ["in", ["get", "id"], ids]);
      filt("trk-fires-glow", ["all", ["==", ["get", "now"], 1], ["in", ["get", "id"], ids]]);
      const area = new Map(s.live?.fires.map((f) => [f.id, f.areaHa]) ?? []);
      const top = [...s.shown].sort((a, b) => (area.get(b.id) ?? 0) - (area.get(a.id) ?? 0)).slice(0, TOP_LABELS);
      filt("trk-fire-labels-top", ["in", ["get", "id"], ["literal", top.map((m) => m.id)]]);
      filt("trk-px", ["in", ["get", "fire"], ids]);
      return;
    }
    const L = s.layers;
    const cur = s.cur;
    const shownStep = s.d.fireStepAt[cur]?.step ?? -1;
    const upTo: ExpressionSpecification = ["<=", ["get", "step"], cur];
    vis("trk-dnbr", L.dnbr);
    for (const l of ["trk-others-fill", "trk-others-line"]) {
      vis(l, L.otros);
      filt(l, ["<=", ["get", "from"], cur]);
    }
    for (const l of ["trk-perim-fill", "trk-iso", "trk-iso-cur", "trk-labels"]) vis(l, L.isocronas);
    filt("trk-perim-fill", ["==", ["get", "step"], shownStep]);
    filt("trk-iso", upTo);
    filt("trk-iso-cur", ["==", ["get", "step"], shownStep]);
    filt("trk-labels", upTo);
    for (const l of ["trk-fl", "trk-fl-glow"]) {
      vis(l, L.frente);
      filt(l, ["==", ["get", "step"], cur]);
    }
    for (const l of ["trk-arrows", "trk-arrow-heads"]) {
      vis(l, L.vectores);
      filt(l, ["==", ["get", "step"], shownStep]);
    }
    const mainOnly: ExpressionSpecification = L.otros ? ["literal", true] : ["==", ["get", "main"], 1];
    for (const l of ["trk-px-old", "trk-px-glow", "trk-px-now"]) vis(l, L.focos);
    // the cumulative play: past detections stay as embers, this pass burns bright
    filt("trk-px-old", ["all", ["<", ["get", "step"], cur], mainOnly]);
    filt("trk-px-now", ["all", ["==", ["get", "step"], cur], mainOnly]);
    filt("trk-px-glow", ["all", ["==", ["get", "step"], cur], mainOnly]);
  }
}

function arrowHead() {
  const s = 36;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  g.fillStyle = "#ffd166";
  g.strokeStyle = "#5a1609";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(s - 3, s / 2);
  g.lineTo(6, 5);
  g.lineTo(12, s / 2);
  g.lineTo(6, s - 5);
  g.closePath();
  g.fill();
  g.stroke();
  return g.getImageData(0, 0, s, s);
}

// ---------- legend ----------

// Sentinel's own floating-panel look (map-controls.tsx), at the same corner as
// its Legend, above the cursor read-out
const glass = "glass rounded-xl border border-[var(--hairline)] shadow-[var(--shadow-1)]";
const SEVERITY_RAMP = "linear-gradient(90deg,#f6d55c,#f39c34,#d9480f,#8c1d04)";
const PERIMETER_RAMP = "linear-gradient(90deg,#fff1a8,#ffc145,#f2711c,#d9480f,#7a1c06)";

function Row({ mark, children }: { mark: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span className="flex w-5 shrink-0 justify-center" aria-hidden>
        {mark}
      </span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}

const dot = (color: string, extra = "") => <span className={cn("size-2.5 rounded-full", extra)} style={{ background: color }} />;

function OnMap({ children }: { children: React.ReactNode }) {
  return <span className="flex h-3 w-5 items-center justify-center rounded-[3px] bg-[#3b3029]">{children}</span>;
}

function Legend({ mode, filter, dnbr, tr }: { mode: "overview" | "fire"; filter: Tracking["filter"]; dnbr: boolean; tr: Translate }) {
  // folded by default, like Sentinel's own legend; above its cursor read-out
  const [open, setOpen] = useState(false);
  const at = "bottom-[66px] left-3";
  if (!open)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(glass, at, "absolute z-10 hidden h-7 items-center gap-1.5 px-2.5 text-[10.5px] font-medium text-foreground/60 hover:text-foreground md:flex")}
      >
        <span className="size-2.5 rounded-full bg-[#c2410c] shadow-[0_0_0_3px_rgba(255,90,31,0.35)]" aria-hidden />
        {tr("trk.leg.open")}
      </button>
    );
  return (
    <div role="group" aria-label={tr("trk.leg.open")} className={cn(glass, at, "absolute z-10 hidden w-56 p-2.5 text-[10.5px] text-foreground/70 md:block")}>
      <div className="mb-1.5 flex items-center justify-between font-medium text-foreground/85">
        {tr(mode === "overview" ? "trk.ov.title" : "trk.dock.fire")}
        <button type="button" onClick={() => setOpen(false)} aria-label={tr("trk.leg.hide")} className="rounded text-foreground/55 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <X className="size-3" />
        </button>
      </div>
      {mode === "overview" ? (
        <ul className="space-y-1">
          {filter !== "agricolas" && <Row mark={dot("#c2410c")}>{tr("trk.b.forest")}</Row>}
          {filter !== "forestales" && <Row mark={dot("#e0a526")}>{tr("trk.b.agri")}</Row>}
          <Row mark={dot("#c2410c", "shadow-[0_0_0_3px_rgba(255,90,31,0.4)]")}>{tr("trk.leg.active24")}</Row>
          <Row mark={dot("#c2410c", "opacity-30")}>{tr("trk.b.latent")}</Row>
          <Row
            mark={
              <span className="flex items-end gap-0.5">
                <span className="size-1.5 rounded-full border border-foreground/50" />
                <span className="size-3 rounded-full border border-foreground/50" />
              </span>
            }
          >
            {tr("trk.leg.size")}
          </Row>
        </ul>
      ) : (
        <ul className="space-y-1">
          <Row mark={dot("#ffb020")}>{tr("trk.leg.new")}</Row>
          <Row mark={dot("#ff5a2a")}>{tr("trk.leg.persist")}</Row>
          <Row mark={dot("#d63fa0")}>{tr("trk.leg.react")}</Row>
          <Row mark={dot("#5a1609", "opacity-70")}>{tr("trk.leg.old")}</Row>
          {/* the pale map lines need the map's dark under them to read in the light theme */}
          <Row mark={<OnMap><span className="h-1 w-4 rounded-full" style={{ background: PERIMETER_RAMP }} /></OnMap>}>{tr("trk.leg.perim")}</Row>
          <Row mark={<OnMap><span className="h-1 w-4 rounded-full bg-[#ffe08a] shadow-[0_0_4px_#ff7a1a]" /></OnMap>}>{tr("trk.lyr.front")}</Row>
          <Row mark={<OnMap><span className="w-4 border-t-2 border-dashed border-[#ffd166]" /></OnMap>}>{tr("trk.ev.spread")}</Row>
          {dnbr && <Row mark={<span className="h-1.5 w-5 rounded-full" style={{ background: SEVERITY_RAMP }} />}>{tr("trk.leg.dnbr")}</Row>}
        </ul>
      )}
    </div>
  );
}
