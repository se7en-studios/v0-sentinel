import { describe, expect, test } from "vitest";
import {
  OPS_LOG_MAX,
  UNITS,
  cleanOps,
  etaFromBase,
  opsSeries,
  unitBase,
  unitState,
  type Dispatch,
} from "./resources";

const center: [number, number] = [-71.5, -41.6];
const brigada = UNITS[0];
const heli = UNITS.find((u) => u.kind === "helicoptero")!;
const H = 3600_000;

describe("cleanOps", () => {
  test("never throws and returns empty ops for garbage", () => {
    for (const bad of [null, undefined, 5, "x", [], { orders: 3, log: "x" }]) {
      expect(cleanOps(bad)).toEqual({ orders: {}, log: [] });
    }
  });

  test("keeps valid orders, drops invalid ones, truncates strings", () => {
    const ops = cleanOps({
      orders: {
        ok: { target: [1, 2], label: "x".repeat(300), since: 5, recalledAt: 9 },
        noRecall: { target: [1, 2], label: "a", since: 5, recalledAt: "nope" },
        badTarget: { target: [1], label: "a", since: 5 },
        nanTarget: { target: [NaN, 2], label: "a", since: 5 },
        badLabel: { target: [1, 2], label: 3, since: 5 },
        badSince: { target: [1, 2], label: "a", since: "5" },
        nul: null,
      },
      log: [
        { id: "a".repeat(100), t: 1, text: "y".repeat(500) },
        { id: 1, t: 1, text: "x" },
        { id: "b", t: "1", text: "x" },
        null,
      ],
    });
    expect(Object.keys(ops.orders).sort()).toEqual(["noRecall", "ok"]);
    expect(ops.orders.ok.label).toHaveLength(120);
    expect(ops.orders.ok.recalledAt).toBe(9);
    expect("recalledAt" in ops.orders.noRecall).toBe(false);
    expect(ops.log).toHaveLength(1);
    expect(ops.log[0].id).toHaveLength(60);
    expect(ops.log[0].text).toHaveLength(200);
  });

  test("caps the log length", () => {
    const log = Array.from({ length: 100 }, (_, i) => ({
      id: `e${i}`,
      t: i,
      text: "x",
    }));
    expect(cleanOps({ log }).log).toHaveLength(OPS_LOG_MAX);
  });
});

describe("unitState and etaFromBase", () => {
  const target = unitBase(brigada, center).map(
    (c, i) => c + (i === 1 ? 0.18 : 0),
  ) as [number, number]; // ~20 km north
  const order = (extra: Partial<Dispatch> = {}): Dispatch => ({
    target,
    label: "foco",
    since: 0,
    ...extra,
  });

  test("no order means available at base", () => {
    const s = unitState(brigada, center, undefined, 1000);
    expect(s).toMatchObject({
      status: "disponible",
      etaMin: null,
      progress: 0,
    });
    expect(s.pos).toEqual(s.base);
  });

  test("en ruta, then en operación once it arrives", () => {
    const en = unitState(brigada, center, order(), 0.1 * H);
    expect(en.status).toBe("en ruta");
    expect(en.progress).toBeGreaterThan(0);
    expect(en.progress).toBeLessThan(1);
    expect(en.etaMin).toBeGreaterThanOrEqual(1);
    const done = unitState(brigada, center, order(), 10 * H);
    expect(done).toMatchObject({
      status: "en operación",
      etaMin: 0,
      progress: 1,
    });
    expect(done.pos).toEqual(target);
  });

  test("recalled units return and become available again", () => {
    const back = unitState(
      brigada,
      center,
      order({ recalledAt: 10 * H }),
      10.1 * H,
    );
    expect(back.status).toBe("regresando");
    expect(back.progress).toBeLessThan(1);
    const home = unitState(
      brigada,
      center,
      order({ recalledAt: 10 * H }),
      30 * H,
    );
    expect(home).toMatchObject({ status: "disponible", etaMin: null });
  });

  test("faster units get shorter ETAs", () => {
    expect(etaFromBase(heli, center, target)).toBeLessThan(
      etaFromBase(brigada, center, target),
    );
    expect(etaFromBase(heli, center, unitBase(heli, center))).toBe(1); // clamped to 1 min
  });
});

describe("opsSeries", () => {
  test("returns 60 points and counts crew, water and line", () => {
    const target: [number, number] = [center[0], center[1] + 0.05];
    const since = 1_000_000;
    const now = since + 90 * 60_000;
    const units = [
      unitState(brigada, center, { target, label: "a", since }, now),
      unitState(UNITS[2], center, { target, label: "b", since }, now),
      unitState(UNITS[4], center, undefined, now),
    ];
    const s = opsSeries(units, now);
    expect(s).toHaveLength(60);
    expect(s[59].t).toBe(now);
    expect(s[59].people).toBe(brigada.crew + UNITS[2].crew);
    expect(s[59].water).toBeGreaterThan(0);
    expect(s[59].lineKm).toBeGreaterThan(0);
    expect(s[0].t).toBe(now - 59 * 60_000);
    expect(opsSeries([], now).every((p) => p.people === 0)).toBe(true);
  });
});
