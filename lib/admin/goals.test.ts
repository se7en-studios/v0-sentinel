import { describe, expect, it } from "vitest";
import {
  GOALS,
  essentialTabsText,
  hiddenLayersText,
  goalById,
  goalLayers,
  goalSettings,
  parseGoal,
  rulesToAdd,
  stepDone,
} from "./goals";
import {
  DEFAULT_SETTINGS,
  MODE_ROLE,
  REGIONS,
  type AlertRule,
  type Feat,
} from "./types";
import { MAX_RULES } from "./rules";
import { TABS } from "@/components/admin/tabs";

const zone = {
  type: "Feature",
  properties: { mode: "zone-polygon" },
  geometry: { type: "Polygon", coordinates: [] },
} as unknown as Feat;

describe("goals table", () => {
  it("has unique ids and every start tab exists in TABS", () => {
    expect(new Set(GOALS.map((g) => g.id)).size).toBe(GOALS.length);
    for (const g of GOALS)
      expect(
        TABS.some((t) => t.id === g.startTab),
        g.id,
      ).toBe(true);
  });
  it("only references zone/route steps that the mode table knows", () => {
    expect(Object.values(MODE_ROLE)).toContain("zone");
    expect(Object.values(MODE_ROLE)).toContain("route");
  });
  it("parses ids and rejects anything else", () => {
    expect(parseGoal("farms")).toBe("farms");
    expect(parseGoal("nope")).toBeNull();
    expect(goalById(null)).toBeNull();
  });
});

describe("goalSettings", () => {
  const forestry = goalById("forestry")!;
  it("marks the user as set up, turns simple mode on and keeps a known region", () => {
    const p = goalSettings(forestry, "cordoba", DEFAULT_SETTINGS);
    expect(p).toMatchObject({
      goal: "forestry",
      onboarded: true,
      simpleMode: true,
      regionId: "cordoba",
    });
  });
  it("keeps the current region when the chosen one is unknown", () => {
    expect(goalSettings(forestry, "luna", DEFAULT_SETTINGS).regionId).toBe(
      DEFAULT_SETTINGS.regionId,
    );
    expect(REGIONS.some((r) => r.id === "luna")).toBe(false);
  });
  it("adds the goal's rules without touching or duplicating the existing ones", () => {
    const mine: AlertRule = {
      id: "mine",
      enabled: false,
      kind: "early_open",
      zoneId: "",
    };
    const p = goalSettings(forestry, "ar", {
      ...DEFAULT_SETTINGS,
      rules: [mine],
    });
    const rules = p.rules!;
    expect(rules[0]).toEqual(mine);
    expect(rules.filter((r) => r.kind === "early_open")).toHaveLength(1);
    expect(rules.some((r) => r.kind === "zone_fire")).toBe(true);
    expect(rulesToAdd(forestry, rules)).toBe(0);
  });
  it("never goes over the rule limit", () => {
    const full = Array.from({ length: MAX_RULES }, (_, i): AlertRule => ({
      id: `r${i}`,
      enabled: true,
      kind: "activity",
      focos: 100 + i,
    }));
    expect(
      goalSettings(forestry, "ar", { ...DEFAULT_SETTINGS, rules: full }).rules,
    ).toHaveLength(MAX_RULES);
  });
});

describe("goalLayers", () => {
  const show = {
    fires: true,
    early: true,
    heat: true,
    zones: true,
    lines: true,
    routes: true,
    sensors: true,
    drones: true,
    names: true,
    spread: true,
    forest: true,
    buildings: true,
  };
  it("hides the goal's layers and returns a new object", () => {
    const next = goalLayers(goalById("invest")!, show);
    expect(next).not.toBe(show);
    expect(show.drones).toBe(true);
    expect([next.drones, next.sensors, next.routes, next.forest]).toEqual([
      false,
      false,
      false,
      false,
    ]);
    expect(next.fires && next.early && next.heat).toBe(true);
  });
});

describe("stepDone", () => {
  it("reads the workspace, not a flag", () => {
    const ws = { features: [zone], settings: DEFAULT_SETTINGS };
    expect(stepDone("zone", ws)).toBe(true);
    expect(stepDone("route", ws)).toBe(false);
    expect(stepDone("contact", ws)).toBe(false);
    expect(
      stepDone("contact", {
        ...ws,
        settings: {
          ...DEFAULT_SETTINGS,
          notify: { ...DEFAULT_SETTINGS.notify, email: "a@b.co" },
        },
      }),
    ).toBe(true);
  });
});

describe("texts built from the tables", () => {
  const t = ((k: string) => ({ "tab.general.short": "General", "tab.incendios.short": "Incendios", "tab.zonas.short": "Zonas", "lay.drones": "Drones", "lay.sensors": "Sensores" })[k] ?? k) as never;
  it("names the essential tabs from TABS, not from a hand-written list", () => {
    const names = essentialTabsText(t, "es");
    for (const x of TABS.filter((x) => x.essential)) expect(names).toContain(x.short);
  });
  it("names the layers a goal hides", () => {
    expect(hiddenLayersText(goalById("lot")!, t, "es")).toBe("drones y sensores");
  });
  it("counts a user's own rule of the same kind as already there, whatever its threshold", () => {
    const mine: AlertRule = { id: "mine", enabled: true, kind: "risk", score: 90, days: 1 };
    const risk = goalById("farms")!;
    const before = rulesToAdd(risk, []);
    expect(rulesToAdd(risk, [mine])).toBe(before - 1);
  });
});
