import { expect, test } from "vitest";
import { NOTE_LOG_MAX, NOTE_TEXT_MAX, cleanNoteLog, isFeat, parseWorkspace } from "./store";

const zone = {
  id: "z1",
  type: "Feature",
  properties: { mode: "zone-polygon" },
  geometry: { type: "Polygon", coordinates: [[[-71, -41], [-71, -40], [-70, -40], [-71, -41]]] },
};

test("isFeat accepts valid and rejects mismatched geometry", () => {
  expect(isFeat(zone)).toBe(true);
  expect(isFeat({ ...zone, geometry: { type: "Point", coordinates: [0, 0] } })).toBe(false);
  expect(isFeat({ ...zone, geometry: { ...zone.geometry, coordinates: [[[NaN, 0]]] } })).toBe(false);
  expect(isFeat(null)).toBe(false);
});

test("parseWorkspace sanitizes garbage input", () => {
  const ws = parseWorkspace({ features: [zone, { id: 1 }], notes: 5, settings: { units: "x" } });
  expect(ws.features).toHaveLength(1);
  expect(ws.meta.z1.name).toBe("z1");
  expect(ws.notes).toBe("");
  expect(ws.settings.units).toBe("ha");
  expect(parseWorkspace(undefined).features).toEqual([]);
});

test("cleanNoteLog keeps well-formed notes and drops the rest", () => {
  const out = cleanNoteLog([
    { id: "a", t: 1, by: "ana@x.com", text: "  Foco verificado  ", featId: "z1" },
    { id: "b", t: 2, text: "sin autor" },
    { id: 3, t: 4, text: "id inválido" },
    { id: "c", t: NaN, text: "fecha inválida" },
    { id: "d", t: 5, text: "   " },
    null,
    "texto suelto",
  ]);
  expect(out.map((n) => n.id)).toEqual(["a", "b"]);
  expect(out[0].text).toBe("Foco verificado");
  expect(out[0].featId).toBe("z1");
  expect(out[1].by).toBe("");
  expect(out[1].featId).toBeUndefined();
});

test("cleanNoteLog caps text length and list size, and tolerates non-arrays", () => {
  const many = Array.from({ length: NOTE_LOG_MAX + 20 }, (_, i) => ({ id: `n${i}`, t: i, text: "x".repeat(5000) }));
  const out = cleanNoteLog(many);
  expect(out).toHaveLength(NOTE_LOG_MAX);
  expect(out[0].text).toHaveLength(NOTE_TEXT_MAX);
  expect(cleanNoteLog(undefined)).toEqual([]);
  expect(cleanNoteLog("x")).toEqual([]);
});

test("parseWorkspace carries the note log and defaults it to empty", () => {
  expect(parseWorkspace({ noteLog: [{ id: "a", t: 1, text: "hola" }] }).noteLog).toHaveLength(1);
  expect(parseWorkspace({}).noteLog).toEqual([]);
});

test("parseWorkspace keeps minScore inside 0-90 and defaults it to no filter", () => {
  expect(parseWorkspace({}).settings.minScore).toBe(0);
  expect(parseWorkspace({ settings: { minScore: 55.4 } }).settings.minScore).toBe(55);
  expect(parseWorkspace({ settings: { minScore: 500 } }).settings.minScore).toBe(90);
  expect(parseWorkspace({ settings: { minScore: -3 } }).settings.minScore).toBe(0);
  expect(parseWorkspace({ settings: { minScore: "x" } }).settings.minScore).toBe(0);
});

test("first-run flags: a workspace that already has zones or rules counts as set up", () => {
  expect(parseWorkspace({}).settings.onboarded).toBe(false);
  expect(parseWorkspace({ features: [zone] }).settings.onboarded).toBe(true);
  expect(parseWorkspace({ settings: { rules: [{ id: "r", enabled: true, kind: "activity", focos: 100 }] } }).settings.onboarded).toBe(true);
});

test("first-run flags: an explicit answer is respected, even with zones", () => {
  expect(parseWorkspace({ features: [zone], settings: { onboarded: false } }).settings.onboarded).toBe(false);
  expect(parseWorkspace({ settings: { onboarded: true } }).settings.onboarded).toBe(true);
  // not a boolean: fall back to what the workspace shows
  expect(parseWorkspace({ settings: { onboarded: "yes" } }).settings.onboarded).toBe(false);
});

test("goal and simpleMode from storage are validated", () => {
  expect(parseWorkspace({ settings: { goal: "forestry" } }).settings.goal).toBe("forestry");
  expect(parseWorkspace({ settings: { goal: "<script>" } }).settings.goal).toBeNull();
  expect(parseWorkspace({ settings: { goal: 7 } }).settings.goal).toBeNull();
  expect(parseWorkspace({ settings: { simpleMode: true } }).settings.simpleMode).toBe(true);
  expect(parseWorkspace({ settings: { simpleMode: "true" } }).settings.simpleMode).toBe(false);
});
