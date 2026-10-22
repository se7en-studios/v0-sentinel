import { expect, test } from "vitest";
import { buildBriefing, delayedSources, type BriefingInput } from "./briefing";

const base: BriefingInput = {
  org: "Acme",
  now: new Date("2026-10-21T12:00:00"),
  last24: 0,
  total10d: 0,
  frpMw: 0,
  zones: [],
  clusters: [],
};

test("calm when nothing is happening", () => {
  const b = buildBriefing(base);
  expect(b.tone).toBe("calm");
  expect(b.actions).toEqual(["Sin acciones urgentes. Mantener el monitoreo."]);
  expect(b.text).toContain("Briefing Sentinel · Acme");
});

test("alert when a watched zone has detections", () => {
  const b = buildBriefing({
    ...base,
    last24: 5,
    zones: [{ name: "Lote 1", recent: 3 }],
  });
  expect(b.tone).toBe("alert");
  expect(b.headline).toContain("una zona vigilada");
  expect(b.actions[0]).toContain("Lote 1");
});

test("watch when activity exists but no zone is hit", () => {
  expect(buildBriefing({ ...base, last24: 2 }).tone).toBe("watch");
});

test("early alerts, delayed feeds and today's FWI add one line each without inflating the rest", () => {
  const today = {
    date: "2026-10-21",
    tmax: 33,
    rhmin: 18,
    wind: 40,
    windDir: 270,
    rain: 0,
    score: 60,
    label: "Alto",
    color: "#e8710a",
    fwi: 24.4,
    fwiLabel: "Muy alto" as const,
  };
  const b = buildBriefing({
    ...base,
    earlyOpen: 2,
    delayed: ["NOAA-20", "GOES-19"],
    today,
  });
  expect(b.tone).toBe("watch");
  expect(b.points).toHaveLength(4);
  expect(b.points.join(" ")).toContain("FWI 24 (muy alto)");
  expect(b.points.join(" ")).toContain("2 alertas tempranas de GOES");
  expect(b.points.join(" ")).toContain("Fuentes con demora: NOAA-20, GOES-19.");
  expect(b.actions.join(" ")).toContain("alertas tempranas");
  expect(buildBriefing({ ...base, earlyOpen: 0, delayed: [] }).tone).toBe(
    "calm",
  );
});

test("delayedSources flags failed feeds and feeds behind their rhythm", () => {
  const now = Date.parse("2026-10-21T12:00:00Z");
  const src = (id: string, label: string, ok: boolean, ageH?: number) => ({
    id,
    label,
    ok,
    count: 1,
    newestAt: ageH === undefined ? undefined : now - ageH * 3600_000,
  });
  expect(
    delayedSources(
      [
        src("n20", "NOAA-20", true, 5),
        src("n21", "NOAA-21", true, 20),
        src("goes19", "GOES-19", true, 2),
        src("goes16", "GOES-16", true, 0.2),
        src("modis", "MODIS", false),
        src("none", "Sin datos", true),
      ],
      now,
    ),
  ).toEqual(["NOAA-21", "GOES-19", "MODIS"]);
});
