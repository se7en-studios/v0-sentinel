import type { Tab } from "./ctx";

/** `essential` tabs stay in the bar in simple mode; everything else goes under "Más". */
export const TABS: { id: Tab; label: string; short: string; essential: boolean }[] = [
  { id: "general", label: "Vista general", short: "General", essential: true },
  { id: "incendios", label: "Incendios", short: "Incendios", essential: true },
  { id: "zonas", label: "Zonas", short: "Zonas", essential: true },
  { id: "drones", label: "Drones y sensores", short: "Drones", essential: false },
  { id: "recursos", label: "Recursos", short: "Recursos", essential: false },
  { id: "pronostico", label: "Pronóstico", short: "Riesgo", essential: false },
  { id: "incidentes", label: "Incidentes", short: "Incidentes", essential: false },
  { id: "metricas", label: "Métricas", short: "Métricas", essential: false },
  { id: "config", label: "Configuración", short: "Config", essential: false },
];
