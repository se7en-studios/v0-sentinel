// What the person wants to watch. The first-run question, the setup checklist and the starting
// panel all read from this one table: adding a goal means adding a row here and its texts in
// i18n-goals.ts, nothing else.

import type { ShowLayers } from "@/components/admin/map/types";
import type { Tab } from "@/components/admin/ctx";
import {
  MODE_ROLE,
  REGIONS,
  type AlertRule,
  type Settings,
  type Workspace,
} from "./types";
import { MAX_RULES } from "./rules";
import { TABS } from "@/components/admin/tabs";
import type { MsgKey, Translate } from "./i18n";

export const GOAL_IDS = [
  "lot",
  "forestry",
  "farms",
  "towns",
  "invest",
] as const;
export type GoalId = (typeof GOAL_IDS)[number];

export const parseGoal = (v: unknown): GoalId | null =>
  GOAL_IDS.find((g) => g === v) ?? null;

export type StepId = "zone" | "route" | "sensor" | "contact";

/** Where each setup step is done. */
export const STEP_TAB: Record<StepId, Tab> = { zone: "zonas", route: "drones", sensor: "drones", contact: "config" };

/** The checklist for someone who skipped the question. */
export const DEFAULT_STEPS: readonly StepId[] = ["zone", "route", "sensor", "contact"];

/** The setup checklist for a goal (or the default one when there is none). */
export const stepsFor = (goal: Goal | null): readonly StepId[] => (goal ? goal.steps : DEFAULT_STEPS);

export type LayerKey = keyof ShowLayers;

export interface Goal {
  id: GoalId;
  /** where the panel lands once it is set up */
  startTab: Tab;
  /** setup checklist, in order; empty when there is nothing to configure */
  steps: StepId[];
  /** map layers switched off (everything else keeps its current state) */
  hide: LayerKey[];
  /** alert rules switched on, with the same defaults the rules editor offers */
  rules: AlertRule[];
}

// drones and sensors are simulated: someone arriving with a real need should not see them first
const SIMULATED: LayerKey[] = ["drones", "sensors"];

const ANY_ZONE_FIRE: AlertRule = {
  id: "goal-zone-fire",
  enabled: true,
  kind: "zone_fire",
  zoneId: "",
  min: 1,
};
const ANY_EARLY: AlertRule = {
  id: "goal-early",
  enabled: true,
  kind: "early_open",
  zoneId: "",
};
const RISK: AlertRule = {
  id: "goal-risk",
  enabled: true,
  kind: "risk",
  score: 55,
  days: 3,
};
const GROWTH: AlertRule = {
  id: "goal-growth",
  enabled: true,
  kind: "growth",
  ha: 100,
};

export const GOALS: readonly Goal[] = [
  {
    id: "lot",
    startTab: "zonas",
    steps: ["zone", "contact"],
    hide: SIMULATED,
    rules: [ANY_ZONE_FIRE, ANY_EARLY],
  },
  {
    id: "forestry",
    startTab: "zonas",
    steps: ["zone", "contact", "route"],
    hide: [...SIMULATED, "buildings"],
    rules: [ANY_ZONE_FIRE, ANY_EARLY, RISK],
  },
  {
    id: "farms",
    startTab: "zonas",
    steps: ["zone", "contact"],
    hide: [...SIMULATED, "buildings", "forest"],
    rules: [ANY_ZONE_FIRE, ANY_EARLY, RISK],
  },
  {
    id: "towns",
    startTab: "incendios",
    steps: ["contact", "zone"],
    hide: SIMULATED,
    rules: [ANY_ZONE_FIRE, ANY_EARLY, RISK],
  },
  {
    id: "invest",
    startTab: "general",
    steps: [],
    hide: [...SIMULATED, "routes", "lines", "buildings", "forest"],
    rules: [GROWTH],
  },
];

export const goalById = (id: GoalId | null | undefined): Goal | null =>
  GOALS.find((g) => g.id === id) ?? null;

/** Which setup steps are already done in this workspace. */
export function stepDone(
  step: StepId,
  ws: Pick<Workspace, "features" | "settings">,
): boolean {
  const roles = ws.features.map((f) => MODE_ROLE[String(f.properties.mode)]);
  if (step === "zone") return roles.includes("zone");
  if (step === "route") return roles.includes("route");
  if (step === "sensor") return roles.includes("sensor");
  return Boolean(ws.settings.notify.email || ws.settings.notify.whatsapp);
}

/** The goal's rules that are not in the list yet (same id, or same kind and zone, counts as already there). */
function missingRules(goal: Goal, current: readonly AlertRule[]): AlertRule[] {
  const room = Math.max(0, MAX_RULES - current.length);
  const has = (r: AlertRule) =>
    current.some(
      (c) =>
        c.id === r.id ||
        (c.kind === r.kind &&
          ("zoneId" in c && "zoneId" in r
            ? c.zoneId === r.zoneId
            : !("zoneId" in c) && !("zoneId" in r))),
    );
  return goal.rules.filter((r) => !has(r)).slice(0, room);
}

/** How many alert rules the goal would add; the first-run screen tells the person before applying. */
export const rulesToAdd = (goal: Goal, current: readonly AlertRule[]): number =>
  missingRules(goal, current).length;

/** The settings patch that sets the panel up for a goal. Never removes anything the person already has. */
export function goalSettings(
  goal: Goal,
  regionId: string,
  current: Settings,
): Partial<Settings> {
  return {
    goal: goal.id,
    onboarded: true,
    simpleMode: true,
    regionId: REGIONS.some((r) => r.id === regionId)
      ? regionId
      : current.regionId,
    rules: [...current.rules, ...missingRules(goal, current.rules)],
  };
}

/** Layer state after applying a goal: its hidden layers off, the rest as they were. */
export function goalLayers<T extends Record<LayerKey, boolean>>(
  goal: Goal,
  show: T,
): T {
  const next = { ...show };
  for (const k of goal.hide) next[k] = false as T[LayerKey];
  return next;
}

/** The i18n name of each map layer (same texts as the layers panel). */
export const LAYER_KEY: Record<LayerKey, MsgKey> = {
  fires: "lay.fires",
  early: "lay.early",
  heat: "lay.heat",
  zones: "lay.zones",
  lines: "lay.lines",
  routes: "lay.routes",
  sensors: "lay.sensors",
  drones: "lay.drones",
  names: "lay.names",
  spread: "lay.spread",
  forest: "lay.forest",
  buildings: "lay.bld",
};

/** "a, b y c" in the language of the interface. */
export const listText = (items: readonly string[], locale: string): string =>
  new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(items);

/** Names of the tabs that simple mode keeps in the bar, straight from TABS. */
export const essentialTabsText = (t: Translate, locale: string): string =>
  listText(TABS.filter((x) => x.essential).map((x) => t(`tab.${x.id}.short`)), locale);

/** Names of the layers a goal switches off. */
export const hiddenLayersText = (goal: Goal, t: Translate, locale: string): string =>
  listText(goal.hide.map((k) => t(LAYER_KEY[k]).toLowerCase()), locale);
