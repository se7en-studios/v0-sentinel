// Self-check: npx tsx lib/admin/rules.check.ts
import assert from "node:assert";
import { cleanRules, evaluateRules } from "./rules";
import type { DayForecast } from "./forecast";

const f = (score: number): DayForecast => ({
  date: "2026-10-22",
  tmax: 30,
  rhmin: 20,
  wind: 30,
  windDir: 0,
  rain: 0,
  score,
  label: "Alto",
  color: "#e8710a",
});
const rules = cleanRules([
  { id: "1", kind: "zone_fire", zoneId: "a", min: 2, enabled: true },
  { id: "2", kind: "zone_fire", zoneId: "a", min: 5, enabled: true },
  { id: "3", kind: "risk", score: 55, days: 2, enabled: true },
  { id: "4", kind: "activity", focos: 100, enabled: false },
  { id: "5", kind: "bogus" },
]);
const out = evaluateRules(rules, {
  zones: [{ id: "a", name: "Lote 1", recent: 3 }],
  last24: 500,
  forecast: [f(10), f(60)],
});
assert.equal(rules.length, 4, "drops malformed rules");
assert.ok(out.has("1") && !out.has("2"), "zone threshold");
assert.ok(out.has("3"), "risk inside window");
assert.ok(!out.has("4"), "disabled rule never fires");
console.log("rules ok");
