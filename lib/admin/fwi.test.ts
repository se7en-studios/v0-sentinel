import { describe, expect, test } from "vitest";
import {
  FWI_START,
  bui,
  dayLength,
  dryingFactor,
  fwiDanger,
  fwiSeries,
  fwiStep,
  nextDc,
  nextDmc,
  nextFfmc,
  type FwiWeather,
} from "./fwi";

const wx = (temp: number, rh: number, wind: number, rain = 0): FwiWeather => ({
  temp,
  rh,
  wind,
  rain,
});

// Van Wagner & Pickett test line: start 85/6/15, T=17, RH=42, W=25, rain=0, April, 46N.
// Published result: FFMC 87.7, DMC 8.5, DC 19.0, ISI 10.9, BUI 8.5, FWI 10.1.
describe("hand-checked values", () => {
  const r = fwiStep(FWI_START, wx(17, 42, 25), 4, 46);

  test("FFMC: mo=147.2*16/144.5=16.30; Ed=0.942*42^0.679+0.03+0.18*4.1*(1-e^-4.83)=12.69; ko=0.674, kd=0.728, m=12.69+3.61*10^-0.728=13.37; F=59.5*236.63/160.57=87.7", () => {
    expect(r.state.ffmc).toBeCloseTo(87.7, 1);
  });

  test("DMC: K=1.894*(17+1.1)*(100-42)*12.8*1e-4=2.545; P=6+2.545=8.5", () => {
    expect(r.state.dmc).toBeCloseTo(8.5, 1);
  });

  test("DC: V=0.36*(17+2.8)+0.9=8.03; D=15+0.5*8.03=19.0", () => {
    expect(r.state.dc).toBeCloseTo(19.0, 1);
  });

  test("ISI 10.9, BUI 8.5, FWI 10.1", () => {
    expect(r.isi).toBeCloseTo(10.9, 1);
    expect(r.bui).toBeCloseTo(8.5, 1);
    expect(r.fwi).toBeCloseTo(10.1, 1);
  });

  test("BUI at DMC=6, DC=15: 6 <= 0.4*15 so U=0.8*6*15/(6+6)=6", () => {
    expect(bui(6, 15)).toBeCloseTo(6, 6);
  });
});

describe("rain thresholds", () => {
  test("rain at or below 0.5 mm leaves FFMC as a dry day; above it lowers FFMC", () => {
    const w = wx(20, 50, 10);
    expect(nextFfmc(90, { ...w, rain: 0.5 })).toBe(nextFfmc(90, w));
    expect(nextFfmc(90, { ...w, rain: 5 })).toBeLessThan(nextFfmc(90, w));
    expect(nextFfmc(90, { ...w, rain: 20 })).toBeLessThan(
      nextFfmc(90, { ...w, rain: 5 }),
    );
  });

  test("DMC rain effect starts above 1.5 mm; DC above 2.8 mm", () => {
    const w = wx(20, 50, 10);
    expect(nextDmc(40, { ...w, rain: 1.5 }, 1, -40)).toBe(
      nextDmc(40, w, 1, -40),
    );
    expect(nextDmc(40, { ...w, rain: 10 }, 1, -40)).toBeLessThan(
      nextDmc(40, w, 1, -40),
    );
    expect(nextDc(300, { ...w, rain: 2.8 }, 1, -40)).toBe(
      nextDc(300, w, 1, -40),
    );
    expect(nextDc(300, { ...w, rain: 30 }, 1, -40)).toBeLessThan(
      nextDc(300, w, 1, -40),
    );
  });
});

describe("bounds and monotonicity", () => {
  const states = [
    FWI_START,
    { ffmc: 60, dmc: 20, dc: 100 },
    { ffmc: 95, dmc: 90, dc: 500 },
  ];

  test("outputs are finite, non-negative and FFMC <= 101", () => {
    for (const s of states)
      for (const t of [-10, 5, 25, 42])
        for (const h of [0, 20, 60, 100])
          for (const w of [0, 15, 60])
            for (const rain of [0, 1, 10, 80]) {
              const r = fwiStep(s, wx(t, h, w, rain), 1, -38);
              for (const v of [
                r.state.ffmc,
                r.state.dmc,
                r.state.dc,
                r.isi,
                r.bui,
                r.fwi,
              ]) {
                expect(Number.isFinite(v)).toBe(true);
                expect(v).toBeGreaterThanOrEqual(0);
              }
              expect(r.state.ffmc).toBeLessThanOrEqual(101);
            }
  });

  // Heat is checked only when the fuel is drying: when moisture is rising toward
  // equilibrium (wetting regime) warmer air speeds the wetting, a real property of
  // the FFMC equations, so FWI can legitimately dip with temperature there.
  test("hotter, drier or windier never lowers FWI (drying regime)", () => {
    for (const s of states)
      for (const base of [wx(10, 70, 5), wx(20, 40, 15), wx(30, 20, 30)]) {
        const r0 = fwiStep(s, base, 1, -38);
        const hotter = fwiStep(s, { ...base, temp: base.temp + 5 }, 1, -38);
        const drier = fwiStep(s, { ...base, rh: base.rh - 15 }, 1, -38);
        const windier = fwiStep(s, { ...base, wind: base.wind + 10 }, 1, -38);
        const drying = r0.state.ffmc >= s.ffmc;
        for (const r of drying ? [hotter, drier, windier] : [drier, windier])
          expect(r.fwi).toBeGreaterThanOrEqual(r0.fwi - 1e-9);
      }
  });

  test("a rainy day gives lower FWI than a dry one", () => {
    const s = states[2];
    expect(fwiStep(s, wx(25, 40, 20, 25), 1, -38).fwi).toBeLessThan(
      fwiStep(s, wx(25, 40, 20), 1, -38).fwi,
    );
  });
});

describe("latitude and season", () => {
  test("southern hemisphere is 6 months out of phase; equator is flat", () => {
    expect(dayLength(1, -46)).toBe(dayLength(7, 46));
    expect(dryingFactor(1, -40)).toBe(dryingFactor(7, 40));
    expect(dayLength(3, 5)).toBe(9);
    expect(dryingFactor(3, -5)).toBe(1.4);
  });
});

describe("fwiDanger", () => {
  test("maps thresholds", () => {
    expect(
      [4.9, 5, 9.9, 10, 19.9, 20, 29.9, 30].map((v) => fwiDanger(v)),
    ).toEqual([
      "Bajo",
      "Moderado",
      "Moderado",
      "Alto",
      "Alto",
      "Muy alto",
      "Muy alto",
      "Extremo",
    ]);
  });
});

describe("fwiSeries", () => {
  test("first day equals fwiStep from the start state and state carries over", () => {
    const days = [
      { date: "2026-04-10", weather: wx(17, 42, 25) },
      { date: "2026-04-11", weather: wx(17, 42, 25) },
    ];
    const out = fwiSeries(days, 46);
    expect(out[0].fwi).toBeCloseTo(10.1, 1);
    expect(out[1].state.dc).toBeGreaterThan(out[0].state.dc);
    expect(out[1].state.ffmc).toBeGreaterThan(out[0].state.ffmc);
  });

  test("a soaking rain drops the moisture codes", () => {
    const dry = fwiSeries(
      Array.from({ length: 5 }, (_, i) => ({
        date: `2026-01-0${i + 1}`,
        weather: wx(32, 20, 25),
      })),
      -38,
    );
    const wet = fwiSeries(
      [
        ...Array.from({ length: 4 }, (_, i) => ({
          date: `2026-01-0${i + 1}`,
          weather: wx(32, 20, 25),
        })),
        { date: "2026-01-05", weather: wx(20, 90, 5, 40) },
      ],
      -38,
    );
    expect(wet[4].fwi).toBeLessThan(dry[4].fwi);
    expect(wet[4].state.ffmc).toBeLessThan(dry[4].state.ffmc);
  });

  test("empty input gives empty output", () => {
    expect(fwiSeries([], -38)).toEqual([]);
  });
});
