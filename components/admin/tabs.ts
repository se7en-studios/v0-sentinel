import type { Tab } from "./ctx";

export const TABS: { id: Tab; label: string; short: string }[] = [
  { id: "general", label: "Vista general", short: "General" },
  { id: "zonas", label: "Zonas", short: "Zonas" },
  { id: "drones", label: "Drones y sensores", short: "Drones" },
  { id: "recursos", label: "Recursos", short: "Recursos" },
  { id: "metricas", label: "Métricas", short: "Métricas" },
  { id: "config", label: "Configuración", short: "Config" },
];
