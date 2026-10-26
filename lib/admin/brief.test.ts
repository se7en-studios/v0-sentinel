import { describe, expect, it } from "vitest";
import { buildBrief, countFreshFires, firePointMs, STALE_MIN, type BriefInput } from "./brief";
import type { FirePoint } from "./types";

const NOW = Date.parse("2026-10-26T12:00:00Z");
const DAYS = ["2026-10-25", "2026-10-26"];
const base: BriefInput = {
  now: NOW,
  newFires: 0,
  earlyPending: 0,
  unackedRules: 0,
  zonesWithFire: 0,
  lastDetection: NOW - 60_000,
  sources: [],
  firesError: null,
};
// [lat, lng, frp, conf, dayIdx, hhmm, night]
const fire = (day: number, hhmm: number): FirePoint => [
  -41,
  -71,
  5,
  1,
  day,
  hhmm,
  0,
];

describe("firePointMs", () => {
  it("reads day index and hhmm as UTC", () => {
    expect(firePointMs(fire(1, 905), DAYS)).toBe(
      Date.parse("2026-10-26T09:05:00Z"),
    );
  });
  it("gives 0 for a day that does not exist", () => {
    expect(firePointMs(fire(7, 100), DAYS)).toBe(0);
  });
});

describe("buildBrief", () => {
  it("is empty when nothing needs a look", () => {
    expect(buildBrief(base)).toEqual([]);
  });

  it("orders by urgency: error, zones, rules, early, sources, fires", () => {
    const items = buildBrief({
      ...base,
      newFires: 1,
      earlyPending: 2,
      unackedRules: 1,
      zonesWithFire: 1,
      firesError: "x",
      sources: [{ id: "a", label: "A", ok: false, count: 0 }],
      lastDetection: NOW - (STALE_MIN + 30) * 60_000,
    });
    expect(items.map((x) => x.kind)).toEqual([
      "error",
      "zones",
      "rules",
      "early",
      "down",
      "stale",
      "fires",
    ]);
    expect(items.find((x) => x.kind === "stale")?.n).toBe(STALE_MIN + 30);
  });

  it("shows new fires when there are some", () => {
    expect(buildBrief({ ...base, newFires: 2 })).toEqual([{ kind: "fires", n: 2, go: "incendios" }]);
  });

  it("does not call the data late when it is fresh or unknown", () => {
    expect(buildBrief({ ...base, lastDetection: 0 })).toEqual([]);
    expect(
      buildBrief({ ...base, lastDetection: NOW - (STALE_MIN - 1) * 60_000 }),
    ).toEqual([]);
  });
});

describe("countFreshFires", () => {
  const since = Date.parse("2026-10-26T10:00:00Z");
  it("counts only fires newer than the previous visit", () => {
    expect(countFreshFires([fire(1, 900), fire(1, 1030), fire(1, 1130)], DAYS, since)).toBe(2);
  });
  it("does not claim new fires on the first visit (nothing to compare with)", () => {
    expect(countFreshFires([fire(1, 1130)], DAYS, null)).toBe(0);
  });
  it("ignores fires whose day is unknown", () => {
    expect(countFreshFires([fire(9, 1130)], DAYS, since)).toBe(0);
  });
});
