import { describe, expect, test } from "vitest";
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
    describeRule(
      { id: "1", kind: "zone_fire", zoneId: "a", min: 2, enabled: true },
      name,
    ),
  ).toBe("2+ detecciones en 48 h en Zona a");
  expect(
    describeRule(
      { id: "1", kind: "zone_fire", zoneId: "", min: 1, enabled: true },
      name,
    ),
  ).toContain("cualquier zona");
  expect(
    describeRule(
      { id: "2", kind: "risk", score: 55, days: 1, enabled: true },
      name,
    ),
  ).toBe("Riesgo meteorológico ≥ 55 en los próximos 1 día");
  expect(
    describeRule(
      { id: "3", kind: "activity", focos: 100, enabled: true },
      name,
    ),
  ).toContain("100+ focos");
});

test("cleanRules clamps values and tolerates non-arrays", () => {
  expect(cleanRules(null)).toEqual([]);
  const [r] = cleanRules([{ id: "x", kind: "risk", score: 500, days: 0 }]);
  expect(r).toMatchObject({ kind: "risk", score: 100, days: 1, enabled: true });
});

describe("GOES, FWI and growth rules", () => {
  const withFwi = (fwi: number): DayForecast => ({
    ...f(40),
    fwi,
    fwiLabel: fwi >= 30 ? "Extremo" : fwi >= 20 ? "Muy alto" : "Alto",
  });
  const zones = [
    { id: "a", name: "Lote 1", recent: 0 },
    { id: "b", name: "Lote 2", recent: 0 },
  ];

  test("cleanRules validates and clamps the new kinds", () => {
    const rules = cleanRules([
      { id: "1", kind: "early_open", zoneId: "a" },
      { id: "2", kind: "early_open", zoneId: 7 },
      { id: "3", kind: "fwi", fwi: 999, days: 0 },
      { id: "4", kind: "fwi", fwi: "x", days: "y" },
      { id: "5", kind: "growth", ha: -4 },
      { id: "6", kind: "growth", ha: "NaN" },
    ]);
    expect(rules).toMatchObject([
      { kind: "early_open", zoneId: "a" },
      { kind: "early_open", zoneId: "" },
      { kind: "fwi", fwi: 100, days: 1 },
      { kind: "fwi", fwi: 20, days: 3 },
      { kind: "growth", ha: 1 },
      { kind: "growth", ha: 100 },
    ]);
  });

  test("describeRule in Spanish", () => {
    const name = (id: string) => `Zona ${id}`;
    const base = { id: "1", enabled: true };
    expect(
      describeRule({ ...base, kind: "early_open", zoneId: "" }, name),
    ).toBe("Alerta temprana sin confirmar en cualquier zona");
    expect(
      describeRule({ ...base, kind: "early_open", zoneId: "a" }, name),
    ).toContain("Zona a");
    expect(describeRule({ ...base, kind: "fwi", fwi: 20, days: 1 }, name)).toBe(
      "FWI ≥ 20 (muy alto) en los próximos 1 día",
    );
    expect(describeRule({ ...base, kind: "growth", ha: 1500 }, name)).toBe(
      "Un incidente creció 1.500+ ha en el último día",
    );
  });

  test("early_open fires only for zones with open GOES alerts", () => {
    const rules = cleanRules([
      { id: "any", kind: "early_open", zoneId: "" },
      { id: "b", kind: "early_open", zoneId: "b" },
    ]);
    const out = evaluateRules(rules, {
      zones,
      last24: 0,
      earlyOpen: { a: 2 },
    });
    expect(out.get("any")).toBe("Lote 1: 2 alertas tempranas sin confirmar");
    expect(out.has("b")).toBe(false);
    expect(evaluateRules(rules, { zones, last24: 0 }).size).toBe(0);
  });

  test("fwi fires on the first day in the window at or above the threshold", () => {
    const rules = cleanRules([{ id: "w", kind: "fwi", fwi: 20, days: 2 }]);
    const input = (fc: DayForecast[]) => ({ zones, last24: 0, forecast: fc });
    expect(
      evaluateRules(rules, input([withFwi(5), withFwi(24)])).get("w"),
    ).toContain("FWI 24 (Muy alto)");
    expect(
      evaluateRules(rules, input([withFwi(5), withFwi(8), withFwi(40)])).size,
    ).toBe(0);
    expect(evaluateRules(rules, input([f(90)])).size).toBe(0); // no FWI computed
  });

  test("growth fires for incidents that gained at least the threshold", () => {
    const rules = cleanRules([{ id: "g", kind: "growth", ha: 100 }]);
    const out = evaluateRules(rules, {
      zones,
      last24: 0,
      growth: [
        { name: "Bariloche", ha: 99 },
        { name: "El Bolsón", ha: 350 },
      ],
    });
    expect(out.get("g")).toBe("El Bolsón: +350 ha");
  });
});

test("rule texts follow the language and Spanish stays the default", () => {
  const zoneName = (id: string) => (id ? "Lote 1" : "");
  const r = cleanRules([
    { id: "1", kind: "zone_fire", zoneId: "", min: 2, enabled: true },
    { id: "2", kind: "fwi", fwi: 20, days: 1, enabled: true },
  ]);
  expect(describeRule(r[0], zoneName)).toBe("2+ detecciones en 48 h en cualquier zona");
  expect(describeRule(r[0], zoneName, "en")).toBe("2+ detections in 48 h in any zone");
  expect(describeRule(r[0], zoneName, "pt")).toBe("2+ detecções em 48 h em qualquer zona");
  expect(describeRule(r[1], zoneName, "en")).toBe("FWI ≥ 20 (very high) in the next 1 day");
  const input = {
    zones: [{ id: "a", name: "Lote 1", recent: 3 }],
    last24: 1200,
    forecast: [f(70)],
  };
  const rules = cleanRules([
    { id: "1", kind: "zone_fire", zoneId: "a", min: 2, enabled: true },
    { id: "2", kind: "risk", score: 55, days: 1, enabled: true },
    { id: "3", kind: "activity", focos: 100, enabled: true },
  ]);
  const en = evaluateRules(rules, input, "en");
  expect(en.get("1")).toBe("Lote 1: 3 detections");
  expect(en.get("2")).toMatch(/^High \(70\/100\) on /);
  expect(en.get("3")).toBe("1,200 fires in 24 h");
  expect(evaluateRules(rules, input, "pt").get("3")).toBe("1.200 focos em 24 h");
  expect(evaluateRules(rules, input).get("3")).toBe("1.200 focos en 24 h");
});
