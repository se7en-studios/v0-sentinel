import { describe, expect, it } from "vitest";
import { layoutTabs } from "./tab-layout";
import { TABS } from "@/components/admin/tabs";

const widths = Object.fromEntries(TABS.map((x) => [x.id, 100]));
const base = {
  tabs: TABS,
  simple: false,
  widths,
  avail: 2000,
  moreW: 74,
  active: "general" as const,
};

describe("layoutTabs", () => {
  it("shows everything, with no Más, when it all fits", () => {
    const r = layoutTabs(base);
    expect(r.visible).toEqual(TABS.map((x) => x.id));
    expect(r.hidden).toEqual([]);
  });

  it("sends what does not fit to Más, in the original order", () => {
    const r = layoutTabs({ ...base, avail: 474 }); // 74 + 4 tabs
    expect(r.visible).toEqual(["general", "incendios", "zonas", "drones"]);
    expect(r.hidden).toEqual([
      "recursos",
      "pronostico",
      "incidentes",
      "metricas",
      "config",
    ]);
  });

  it("keeps the active tab in the bar by trading with the last one", () => {
    const r = layoutTabs({ ...base, avail: 474, active: "metricas" });
    expect(r.visible).toEqual(["general", "incendios", "zonas", "metricas"]);
    expect(r.hidden).toContain("drones");
    expect(r.hidden).not.toContain("metricas");
    expect([...r.visible, ...r.hidden].sort()).toEqual(
      TABS.map((x) => x.id).sort(),
    );
  });

  it("always shows at least one tab, even in a tiny bar", () => {
    expect(layoutTabs({ ...base, avail: 10 }).visible).toEqual(["general"]);
  });

  describe("simple mode", () => {
    it("shows only the essential tabs and keeps Más for the rest", () => {
      const r = layoutTabs({ ...base, simple: true });
      expect(r.visible).toEqual(["general", "incendios", "zonas"]);
      expect(r.hidden).toEqual([
        "drones",
        "recursos",
        "pronostico",
        "incidentes",
        "metricas",
        "config",
      ]);
    });

    it("adds a non-essential active tab next to the essentials when there is room", () => {
      const r = layoutTabs({ ...base, simple: true, active: "config" });
      expect(r.visible).toEqual(["general", "incendios", "zonas", "config"]);
      expect(r.hidden).not.toContain("config");
    });

    it("trades places when the bar is full", () => {
      const r = layoutTabs({
        ...base,
        simple: true,
        avail: 74 + 300,
        active: "config",
      });
      expect(r.visible).toEqual(["general", "incendios", "config"]);
      expect(r.hidden).toContain("zonas");
    });
  });
});

describe("layoutTabs edge cases", () => {
  const ids = TABS.map((x) => x.id);
  const covers = (r: { visible: string[]; hidden: string[] }) => [...r.visible, ...r.hidden].sort();

  it("keeps every tab exactly once for odd widths", () => {
    for (const avail of [0, Number.NaN, 74, 10_000]) {
      const r = layoutTabs({ ...base, avail });
      expect(covers(r), `avail ${avail}`).toEqual([...ids].sort());
      expect(r.visible.length).toBeGreaterThan(0);
    }
  });

  it("treats a tab with no measured width as zero wide", () => {
    const r = layoutTabs({ ...base, widths: {}, avail: 100 });
    expect(covers(r)).toEqual([...ids].sort());
  });

  it("does not touch its input", () => {
    const w = { ...widths };
    layoutTabs({ ...base, widths: w, avail: 474, active: "config" });
    expect(w).toEqual(widths);
  });

  it("simple mode with no room still shows an essential tab and the active one", () => {
    const r = layoutTabs({ ...base, simple: true, avail: 10, active: "metricas" });
    expect(r.visible).toContain("metricas");
    expect(covers(r)).toEqual([...ids].sort());
  });
});
