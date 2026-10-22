import { REGIONS, type BaseLayer, type Settings } from "@/lib/admin/types";
import type { Translate } from "@/lib/admin/i18n";
import type { RefObject } from "react";
import { TABS } from "../tabs";
import type { Tab } from "../ctx";
import type { MapHandle } from "../map-view";
import type { PaletteAction } from "../command-palette";

const BASES = ["esri", "s2", "viirs"] as const satisfies readonly BaseLayer[];

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
  t: Translate;
  openShortcuts: () => void;
}

/** Entries of the Ctrl+K command palette, in the interface language. */
export function buildPaletteActions(d: Deps): PaletteAction[] {
  const { t } = d;
  const g = {
    goto: t("pal.g.goto"),
    view: t("pal.g.view"),
    base: t("pal.g.base"),
    fly: t("pal.g.fly"),
    analysis: t("pal.g.analysis"),
    edit: t("pal.g.edit"),
    share: t("pal.g.share"),
    reports: t("pal.g.reports"),
    data: t("pal.g.data"),
    help: t("pal.g.help"),
  };
  return [
    ...TABS.map((tab) => ({
      id: `tab-${tab.id}`,
      group: g.goto,
      label: t(`tab.${tab.id}`),
      run: () => d.goTab(tab.id),
    })),
    { id: "tour", group: g.view, label: t("top.tour"), run: () => d.setTour(true) },
    { id: "v2", group: g.view, label: t("top.map2d"), run: () => d.setView("2d") },
    { id: "v3", group: g.view, label: t("top.map3d"), run: () => d.setView("3d") },
    {
      id: "orbit",
      group: g.view,
      label: t("top.orbitStart"),
      run: () => {
        d.setView("3d");
        d.setOrbit((o) => !o);
      },
    },
    {
      id: "panel",
      group: g.view,
      label: t("pal.panelToggle"),
      run: () => d.setPanelOpen((o) => !o),
    },
    {
      id: "theme",
      group: g.view,
      label: d.dark ? t("top.themeLight") : t("top.themeDark"),
      run: d.toggleTheme,
    },
    ...BASES.map((b) => ({
      id: `b-${b}`,
      group: g.base,
      label: t(`pal.base.${b}`),
      run: () => d.setSettings({ baseLayer: b }),
    })),
    ...REGIONS.map((r) => ({
      id: `r-${r.id}`,
      group: g.fly,
      label: r.name,
      run: () => {
        d.goTab("general");
        d.setSettings({ regionId: r.id });
        d.mapRef.current?.flyTo(r.center, r.zoom);
      },
    })),
    {
      id: "p12",
      group: g.analysis,
      label: t("pal.spread12"),
      run: () => {
        d.goTab("general");
        d.setPredH(12);
      },
    },
    { id: "p0", group: g.analysis, label: t("pal.spreadOff"), run: () => d.setPredH(0) },
    { id: "undo", group: g.edit, label: t("top.undo"), hint: "Ctrl Z", run: () => d.undo() },
    { id: "redo", group: g.edit, label: t("top.redo"), hint: "Ctrl Shift Z", run: () => d.redo() },
    { id: "share", group: g.share, label: t("top.copyLink"), run: d.shareView },
    { id: "png", group: g.reports, label: t("top.exportPng"), run: d.exportPng },
    { id: "csv", group: g.reports, label: t("pal.csv"), run: d.exportCsv },
    { id: "pdf", group: g.reports, label: t("pal.pdf"), run: d.exportReport },
    { id: "reload", group: g.data, label: t("pal.reload"), run: d.load },
    { id: "demo", group: g.data, label: t("pal.demo"), run: d.loadDemo },
    {
      id: "keys",
      group: g.help,
      label: t("keys.title"),
      hint: "?",
      run: d.openShortcuts,
    },
  ];
}
