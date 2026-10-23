import * as maplibregl from "maplibre-gl";
import type { FirePoint } from "@/lib/admin/types";
import { EARLY_TIER_RATE, earlyTier, type EarlyView } from "@/lib/admin/early";
import { satLabel } from "@/lib/admin/fire-sources";
import type { FireInfo } from "@/lib/admin/noise";
import { terrainLine, type TerrainInfo } from "@/lib/admin/terrain";
import { coordText, mapsUrl } from "@/lib/admin/map-popup";
import type { MsgKey } from "@/lib/admin/i18n";
import { uiLoc, uiLocale, uiT } from "@/lib/admin/ui-locale";

export const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const setSource = (
  map: maplibregl.Map,
  id: string,
  data: GeoJSON.FeatureCollection,
) => (map.getSource(id) as maplibregl.GeoJSONSource | undefined)?.setData(data);

export const setVis = (map: maplibregl.Map, ids: string[], on: boolean) =>
  ids.forEach(
    (id) =>
      map.getLayer(id) &&
      map.setLayoutProperty(id, "visibility", on ? "visible" : "none"),
  );

/** Fire detections as GeoJSON points, shared by the plain and the clustered source. */
export const fireCollection = (
  fires: FirePoint[],
  info?: Map<FirePoint, FireInfo>,
): GeoJSON.FeatureCollection => ({
  type: "FeatureCollection",
  features: fires.map((q) => {
    const i = info?.get(q);
    return {
      type: "Feature",
      properties: {
        frp: q[2],
        conf: q[3],
        day: q[4],
        hhmm: q[5],
        // -1 = unknown; maplibre properties must be primitives
        sat: q[7] ?? -1,
        score: i ? i.score : -1,
        fresh: i ? (i.fresh ? 1 : 0) : -1,
        reason: i?.reason ?? (i?.cover ? "cover" : ""),
      },
      geometry: { type: "Point", coordinates: [q[1], q[0]] },
    };
  }),
});

export type FireProps = {
  frp: number;
  day: number;
  hhmm: number;
  conf: number;
  sat?: number;
  score?: number;
  fresh?: number;
  reason?: string;
};

/** the popup reads the language from ui-locale (it lives outside React) */
const REASON_TEXT: Record<string, MsgKey> = {
  static: "pop.reason.static",
  industrial: "pop.reason.industrial",
  cover: "pop.reason.cover",
};

type TerrainLookup = (lat: number, lng: number) => Promise<TerrainInfo | null>;

/** Adds a "Terreno" line that fills in once the lookup answers, and drops itself when it fails. */
function addTerrain(
  root: HTMLElement,
  at: maplibregl.LngLatLike,
  terrainAt: TerrainLookup | undefined,
) {
  if (!terrainAt) return;
  const { lat, lng } = maplibregl.LngLat.convert(at);
  const line = document.createElement("span");
  line.textContent = uiT("pop.terrainLoading");
  root.append(line);
  terrainAt(lat, lng).then((t) => {
    const text = t ? terrainLine(t, uiLocale()) : "";
    if (!text) return line.remove();
    line.textContent = uiT("pop.terrain", { text });
    if (t?.burnable === false) {
      const warn = document.createElement("span");
      warn.textContent = uiT("pop.nonveg");
      root.append(warn);
    }
  });
}

/** What a popup can do for the point it sits on; every member is optional. */
export interface PopupActions {
  createZone?: (lat: number, lng: number) => void;
  /** only offered when the point belongs to a detected incident */
  openIncident?: () => void;
}

function actionBtn(label: string, onClick: () => void) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "snt-pop__btn";
  b.textContent = label;
  b.addEventListener("click", onClick);
  return b;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false; // insecure context or permission denied
  }
}

/** Copy, open in Google Maps and the optional zone / incident shortcuts. DOM only. */
function actionRow(
  at: maplibregl.LngLatLike,
  close: () => void,
  a?: PopupActions,
) {
  const { lat, lng } = maplibregl.LngLat.convert(at);
  const row = document.createElement("div");
  row.className = "snt-pop__actions";
  const copy = actionBtn(uiT("pop.copy"), () => {
    void copyText(coordText(lat, lng)).then((ok) => {
      copy.textContent = ok ? uiT("pop.copied") : uiT("pop.copyFail");
      window.setTimeout(() => (copy.textContent = uiT("pop.copy")), 1800);
    });
  });
  const gmaps = document.createElement("a");
  gmaps.className = "snt-pop__btn";
  gmaps.href = mapsUrl(lat, lng);
  gmaps.target = "_blank";
  gmaps.rel = "noopener noreferrer";
  gmaps.textContent = uiT("pop.gmaps");
  row.append(copy, gmaps);
  if (a?.createZone)
    row.append(
      actionBtn(uiT("pop.createZone"), () => {
        a.createZone?.(lat, lng);
        close();
      }),
    );
  if (a?.openIncident)
    row.append(
      actionBtn(uiT("pop.openIncident"), () => {
        a.openIncident?.();
        close();
      }),
    );
  return row;
}

function openPopup(
  map: maplibregl.Map,
  at: maplibregl.LngLatLike,
  root: HTMLElement,
  actions?: PopupActions,
) {
  const popup = new maplibregl.Popup({
    closeButton: false,
    offset: 12,
    className: "snt-popup",
    maxWidth: "300px",
  });
  root.append(actionRow(at, () => popup.remove(), actions));
  popup.setLngLat(at).setDOMContent(root).addTo(map);
}

/** DOM-only popup content: never interpolates data into HTML. */
export function firePopup(
  map: maplibregl.Map,
  at: maplibregl.LngLatLike,
  pr: FireProps,
  days: string[],
  terrainAt?: TerrainLookup,
  actions?: PopupActions,
) {
  const hh = String(pr.hhmm).padStart(4, "0");
  const root = document.createElement("div");
  root.className = "snt-pop";
  const title = document.createElement("b");
  const sat = satLabel(pr.sat);
  title.textContent = sat ? uiT("pop.fireSat", { sat }) : uiT("pop.fire");
  const l1 = document.createElement("span");
  l1.textContent = `${days[pr.day] ?? ""} · ${hh.slice(0, 2)}:${hh.slice(2)} UTC`;
  const l2 = document.createElement("span");
  const confKey = (["pop.conf0", "pop.conf1", "pop.conf2"] as const)[pr.conf];
  l2.textContent = uiT("pop.frp", { frp: pr.frp, conf: confKey ? uiT(confKey) : "—" });
  root.append(title, l1, l2);
  if (typeof pr.score === "number" && pr.score >= 0) {
    const l3 = document.createElement("span");
    l3.textContent = `${uiT("pop.score", { n: pr.score })}${pr.fresh === 1 ? uiT("pop.fresh") : pr.fresh === 0 ? uiT("pop.seen") : ""}`;
    root.append(l3);
  }
  if (pr.reason && REASON_TEXT[pr.reason]) {
    const l4 = document.createElement("span");
    l4.textContent = uiT(REASON_TEXT[pr.reason]);
    root.append(l4);
  }
  addTerrain(root, at, terrainAt);
  openPopup(map, at, root, actions);
}

/** GOES early detections as GeoJSON points; ms timestamps travel as numbers (maplibre keeps primitives). */
export const earlyCollection = (
  early: EarlyView[],
): GeoJSON.FeatureCollection => ({
  type: "FeatureCollection",
  features: early.map((e) => ({
    type: "Feature",
    properties: {
      status: e.status,
      frp: e.frp,
      scans: e.scans,
      firstAt: e.firstAt,
      lastAt: e.lastAt,
      confirmedAt: e.confirmedAt ?? 0,
      sources: e.sources.join("+"),
    },
    geometry: { type: "Point", coordinates: [e.lng, e.lat] },
  })),
});

export type EarlyProps = {
  status: string;
  frp: number;
  scans: number;
  firstAt: number;
  lastAt: number;
  confirmedAt: number;
  sources: string;
};

const SOURCE_NAME: Record<string, string> = {
  FIRMS: "NASA FIRMS",
  INPE: "INPE",
};
const artTime = (ms: number) =>
  new Date(ms).toLocaleTimeString(uiLoc(), {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

/** DOM-only popup for a GOES early detection. */
export function earlyPopup(
  map: maplibregl.Map,
  at: maplibregl.LngLatLike,
  pr: EarlyProps,
  terrainAt?: TerrainLookup,
  actions?: PopupActions,
) {
  const lines = (...t: string[]) => {
    const root = document.createElement("div");
    root.className = "snt-pop";
    t.forEach((x, i) => {
      const el = document.createElement(i === 0 ? "b" : "span");
      el.textContent = x;
      root.append(el);
    });
    return root;
  };
  const ago = Math.max(0, Math.round((Date.now() - pr.lastAt) / 60_000));
  const status =
    pr.status === "confirmed"
      ? uiT("pop.early.confirmed", { t: artTime(pr.confirmedAt) })
      : uiT("pop.early.open");
  const root = lines(
    uiT("pop.early.title"),
    uiT("pop.early.seen", { t: artTime(pr.firstAt), n: ago }),
    `${uiT(pr.scans === 1 ? "pop.early.scan1" : "pop.early.scanN", { n: pr.scans })}${pr.frp > 0 ? uiT("pop.early.frp", { n: Math.round(pr.frp) }) : ""}`,
    status,
    uiT("ec.tier", {
      level: uiT(`ec.tier.${earlyTier(pr.scans)}`),
      pct: Math.round(EARLY_TIER_RATE[earlyTier(pr.scans)] * 100),
    }),
    uiT("pop.early.source", {
      src: pr.sources
        .split("+")
        .map((s) => SOURCE_NAME[s] ?? s)
        .join(uiT("pop.and")),
    }),
  );
  addTerrain(root, at, terrainAt);
  openPopup(map, at, root, actions);
}

export function makeDroneEl(name: string) {
  const el = document.createElement("div");
  el.className = "snt-drone";
  const label = document.createElement("div");
  label.className = "snt-drone__label";
  label.textContent = name;
  const body = document.createElement("div");
  body.className = "snt-drone__body";
  body.innerHTML =
    '<svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><path d="M15 2 L25 26 L15 21 L5 26 Z" stroke-width="2" stroke-linejoin="round"/></svg>';
  const stem = document.createElement("div");
  stem.className = "snt-drone__stem";
  const shadow = document.createElement("div");
  shadow.className = "snt-drone__shadow";
  el.append(label, body, stem, shadow);
  return { el, body };
}
