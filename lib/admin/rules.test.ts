import { expect, test } from "vitest";
import { cleanRules, describeRule, evaluateRules } from "./rules";
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
test("cleanRules + evaluateRules", () => {
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
expect(rules.length, "drops malformed rules").toBe(4);
expect(out.has("1") && !out.has("2"), "zone threshold").toBe(true);
expect(out.has("3"), "risk inside window").toBe(true);
expect(!out.has("4"), "disabled rule never fires").toBe(true);
});

test("describeRule formats each kind", () => {
  const name = (id: string) => `Zona ${id}`;
  expect(
    describeRule({ id: "1", kind: "zone_fire", zoneId: "a", min: 2, enabled: true }, name),
  ).toBe("2+ detecciones en 48 h en Zona a");
  expect(
    describeRule({ id: "1", kind: "zone_fire", zoneId: "", min: 1, enabled: true }, name),
  ).toContain("cualquier zona");
  expect(
    describeRule({ id: "2", kind: "risk", score: 55, days: 1, enabled: true }, name),
  ).toBe("Riesgo meteorológico ≥ 55 en los próximos 1 día");
  expect(
    describeRule({ id: "3", kind: "activity", focos: 100, enabled: true }, name),
  ).toContain("100+ focos");
});

test("cleanRules clamps values and tolerates non-arrays", () => {
  expect(cleanRules(null)).toEqual([]);
  const [r] = cleanRules([{ id: "x", kind: "risk", score: 500, days: 0 }]);
  expect(r).toMatchObject({ kind: "risk", score: 100, days: 1, enabled: true });
});
