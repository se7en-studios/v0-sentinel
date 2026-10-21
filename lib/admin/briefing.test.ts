import { expect, test } from "vitest";
import { buildBriefing, type BriefingInput } from "./briefing";

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
