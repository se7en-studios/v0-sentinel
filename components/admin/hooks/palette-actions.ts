import { REGIONS, type BaseLayer, type Settings } from "@/lib/admin/types";
import type { RefObject } from "react";
import { TABS } from "../tabs";
import type { Tab } from "../ctx";
import type { MapHandle } from "../map-view";
import type { PaletteAction } from "../command-palette";

const BASES: { id: BaseLayer; label: string }[] = [
  { id: "esri", label: "Satélite HD" },
  { id: "s2", label: "Sentinel-2" },
  { id: "viirs", label: "VIIRS ayer" },
];

interface Deps {
  goTab: (t: Tab) => void;
  setTour: (v: boolean) => void;
  setView: (v: "2d" | "3d") => void;
  setOrbit: (f: (o: boolean) => boolean) => void;
  setPanelOpen: (f: (o: boolean) => boolean) => void;
  dark: boolean;
  toggleTheme: () => void;
  setSettings: (p: Partial<Settings>) => void;
  mapRef: RefObject<MapHandle | null>;
  setPredH: (h: number) => void;
  undo: () => boolean;
  redo: () => boolean;
  shareView: () => void;
  exportPng: () => void;
  exportCsv: () => void;
  exportReport: () => void;
  load: () => void;
  loadDemo: () => void;
}

/** Entries of the Ctrl+K command palette. */
export function buildPaletteActions(d: Deps): PaletteAction[] {
  return [
    ...TABS.map((t) => ({
      id: `tab-${t.id}`,
      group: "Ir a",
      label: t.label,
      run: () => d.goTab(t.id),
    })),
    {
      id: "tour",
      group: "Vista",
      label: "Recorrido guiado",
      run: () => d.setTour(true),
    },
    { id: "v2", group: "Vista", label: "Mapa 2D", run: () => d.setView("2d") },
    {
      id: "v3",
      group: "Vista",
      label: "Mapa 3D con relieve",
      run: () => d.setView("3d"),
    },
    {
      id: "orbit",
      group: "Vista",
      label: "Órbita automática",
      run: () => {
        d.setView("3d");
        d.setOrbit((o) => !o);
      },
    },
    {
      id: "panel",
      group: "Vista",
      label: "Mostrar u ocultar panel lateral",
      run: () => d.setPanelOpen((o) => !o),
    },
    {
      id: "theme",
      group: "Vista",
      label: d.dark ? "Modo claro" : "Modo oscuro",
      run: d.toggleTheme,
    },
    ...BASES.map((b) => ({
      id: `b-${b.id}`,
      group: "Capa base",
      label: b.label,
      run: () => d.setSettings({ baseLayer: b.id }),
    })),
    ...REGIONS.map((r) => ({
      id: `r-${r.id}`,
      group: "Volar a",
      label: r.name,
      run: () => {
        d.goTab("general");
        d.setSettings({ regionId: r.id });
        d.mapRef.current?.flyTo(r.center, r.zoom);
      },
    })),
    {
      id: "p12",
      group: "Análisis",
      label: "Predicción de propagación +12 h",
      run: () => {
        d.goTab("general");
        d.setPredH(12);
      },
    },
    {
      id: "p0",
      group: "Análisis",
      label: "Apagar predicción",
      run: () => d.setPredH(0),
    },
    {
      id: "undo",
      group: "Edición",
      label: "Deshacer",
      hint: "Ctrl Z",
      run: () => d.undo(),
    },
    {
      id: "redo",
      group: "Edición",
      label: "Rehacer",
      hint: "Ctrl Shift Z",
      run: () => d.redo(),
    },
    {
      id: "share",
      group: "Compartir",
      label: "Copiar enlace de esta vista",
      run: d.shareView,
    },
    {
      id: "png",
      group: "Reportes",
      label: "Exportar mapa como imagen",
      run: d.exportPng,
    },
    {
      id: "csv",
      group: "Reportes",
      label: "Descargar focos (CSV)",
      run: d.exportCsv,
    },
    {
      id: "pdf",
      group: "Reportes",
      label: "Generar reporte PDF",
      run: d.exportReport,
    },
    {
      id: "reload",
      group: "Datos",
      label: "Actualizar datos satelitales",
      run: d.load,
    },
    {
      id: "demo",
      group: "Datos",
      label: "Cargar zonas, rutas y sensores demo",
      run: d.loadDemo,
    },
  ];
}
