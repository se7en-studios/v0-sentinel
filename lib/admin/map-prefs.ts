import type { ShowLayers } from "@/components/admin/map/types";

export const MAP_PREFS_KEY = "sentinel.admin.map.v1";

export interface MapPrefs {
  show: ShowLayers;
  view: "2d" | "3d";
}

const SHOW_KEYS: (keyof ShowLayers)[] = [
  "fires",
  "early",
  "heat",
  "zones",
  "lines",
  "routes",
  "sensors",
  "drones",
  "names",
  "spread",
  "forest",
  "buildings",
];

/** Validates raw JSON: unknown or non-boolean keys fall back to `base`, so an old or tampered entry never breaks the map. */
export function parseMapPrefs(raw: string | null, base: MapPrefs): MapPrefs {
  if (!raw) return base;
  try {
    const o = JSON.parse(raw) as Partial<Record<string, unknown>>;
    const s = (o.show ?? {}) as Record<string, unknown>;
    const show = { ...base.show };
    for (const k of SHOW_KEYS) if (typeof s[k] === "boolean") show[k] = s[k];
    return { show, view: o.view === "3d" ? "3d" : "2d" };
  } catch {
    return base;
  }
}

export function loadMapPrefs(base: MapPrefs): MapPrefs {
  try {
    return parseMapPrefs(window.localStorage.getItem(MAP_PREFS_KEY), base);
  } catch {
    return base;
  }
}

export function saveMapPrefs(p: MapPrefs): void {
  try {
    window.localStorage.setItem(MAP_PREFS_KEY, JSON.stringify(p));
  } catch {
    /* private mode or full quota: the view just is not remembered */
  }
}
