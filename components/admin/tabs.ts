import type { Tab } from "./ctx";

/**
 * One row per tab: the bar, the "Más" menu, the palette, simple mode and the "g + letter" shortcuts all read this.
 * `essential` tabs stay in the bar in simple mode; everything else goes under "Más". `key` is the letter after "g".
 * Adding a tab means adding a row here and its texts (tab.<id> and tab.<id>.short); lib/admin/tabs.test.ts checks both.
 */
export const TABS: { id: Tab; label: string; short: string; essential: boolean; key: string }[] = [
  { id: "general", label: "Vista general", short: "General", essential: true, key: "g" },
  { id: "incendios", label: "Incendios", short: "Incendios", essential: true, key: "f" },
  { id: "zonas", label: "Zonas", short: "Zonas", essential: true, key: "z" },
  { id: "drones", label: "Drones y sensores", short: "Drones", essential: false, key: "d" },
  { id: "recursos", label: "Recursos", short: "Recursos", essential: false, key: "r" },
  { id: "pronostico", label: "Pronóstico", short: "Riesgo", essential: false, key: "p" },
  { id: "incidentes", label: "Incidentes", short: "Incidentes", essential: false, key: "i" },
  { id: "metricas", label: "Métricas", short: "Métricas", essential: false, key: "m" },
  { id: "config", label: "Configuración", short: "Config", essential: false, key: "c" },
];
