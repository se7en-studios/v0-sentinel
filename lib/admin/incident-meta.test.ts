import { describe, expect, test } from "vitest";
import {
  HISTORY_PER_INCIDENT,
  HISTORY_TOTAL_MAX,
  INCIDENT_META_MAX,
  cleanIncidentMeta,
  isOpenStatus,
} from "./incident-meta";

describe("cleanIncidentMeta", () => {
  test("keeps valid follow-ups and trims the assignee", () => {
    const out = cleanIncidentMeta({
      "-41.10,-71.30": {
        status: "verified",
        assignee: "  Brigada Sur  ",
        by: "ana",
        t: 5,
      },
    });
    expect(out["-41.10,-71.30"]).toEqual({
      status: "verified",
      assignee: "Brigada Sur",
      by: "ana",
      t: 5,
    });
  });

  test("drops unknown statuses, bad timestamps and non-objects", () => {
    const out = cleanIncidentMeta({
      a: { status: "exploded", t: 1 },
      b: { status: "closed", t: "x" },
      c: null,
      d: { status: "closed", t: 2 },
    });
    expect(Object.keys(out)).toEqual(["d"]);
    expect(out.d.assignee).toBe("");
  });

  test("tolerates garbage and caps the size", () => {
    expect(cleanIncidentMeta(undefined)).toEqual({});
    expect(cleanIncidentMeta([1])).toEqual({});
    const many = Object.fromEntries(
      Array.from({ length: INCIDENT_META_MAX + 25 }, (_, i) => [
        `i${i}`,
        { status: "detected", t: i },
      ]),
    );
    expect(Object.keys(cleanIncidentMeta(many))).toHaveLength(
      INCIDENT_META_MAX,
    );
  });
});

test("only active statuses count as open", () => {
  expect(isOpenStatus("detected")).toBe(true);
  expect(isOpenStatus("in_control")).toBe(true);
  expect(isOpenStatus("closed")).toBe(false);
  expect(isOpenStatus("false_positive")).toBe(false);
});

describe("incident history", () => {
  test("records a change with author and time, and nothing when nothing changed", async () => {
    const { applyIncidentChange } = await import("./incident-meta");
    const a = applyIncidentChange(undefined, { status: "verified" }, "ana", 10);
    expect(a.history).toEqual([{ t: 10, by: "ana", status: "verified", assignee: "" }]);
    const same = applyIncidentChange(a, { status: "verified" }, "luis", 20);
    expect(same.history).toEqual(a.history);
    const b = applyIncidentChange(a, { assignee: " Brigada " }, "luis", 30);
    expect(b.history?.at(-1)).toEqual({ t: 30, by: "luis", status: "verified", assignee: "Brigada" });
  });

  test("keeps only the latest changes per incident", async () => {
    const { applyIncidentChange, HISTORY_PER_INCIDENT } = await import("./incident-meta");
    let m = applyIncidentChange(undefined, {}, "x", 0);
    for (let i = 1; i <= HISTORY_PER_INCIDENT + 5; i++)
      m = applyIncidentChange(m, { assignee: `r${i}` }, "x", i);
    expect(m.history).toHaveLength(HISTORY_PER_INCIDENT);
    expect(m.history?.at(-1)?.assignee).toBe(`r${HISTORY_PER_INCIDENT + 5}`);
  });

  test("cleaning bounds the history per incident and across the workspace", async () => {
    const { HISTORY_PER_INCIDENT, HISTORY_TOTAL_MAX } = await import("./incident-meta");
    const change = (i: number) => ({ t: i, by: "a".repeat(500), status: "closed", assignee: "z" });
    const many = Object.fromEntries(
      Array.from({ length: 200 }, (_, n) => [
        `i${n}`,
        { status: "closed", t: 1, history: Array.from({ length: 50 }, (_, i) => change(i)) },
      ]),
    );
    const out = cleanIncidentMeta(many);
    const total = Object.values(out).reduce((n, m) => n + (m.history?.length ?? 0), 0);
    expect(total).toBeLessThanOrEqual(HISTORY_TOTAL_MAX);
    expect(Object.values(out)[0].history).toHaveLength(HISTORY_PER_INCIDENT);
    expect(JSON.stringify(out).length).toBeLessThan(500_000);
  });

  test("drops malformed history rows", () => {
    const out = cleanIncidentMeta({
      a: { status: "closed", t: 1, history: [null, { status: "nope", t: 1 }, { status: "closed", t: 2 }] },
    });
    expect(out.a.history).toEqual([{ t: 2, by: "", status: "closed", assignee: "" }]);
  });
});

describe("cleanIncidentMeta total history cap", () => {
  test("spends the history budget on the most recently touched incidents", () => {
    const hist = (t: number) =>
      Array.from({ length: HISTORY_PER_INCIDENT }, (_, i) => ({ t: t + i, by: "a", status: "verified", assignee: "" }));
    const raw: Record<string, unknown> = {};
    const n = Math.ceil(HISTORY_TOTAL_MAX / HISTORY_PER_INCIDENT) + 5;
    for (let i = 0; i < n; i++) raw[`inc${i}`] = { status: "verified", assignee: "", by: "a", t: 1000 + i, history: hist(1000 + i) };
    const out = cleanIncidentMeta(raw);
    expect(out[`inc${n - 1}`].history?.length).toBe(HISTORY_PER_INCIDENT);
    expect(out["inc0"].history).toBeUndefined();
    const total = Object.values(out).reduce((s, m) => s + (m.history?.length ?? 0), 0);
    expect(total).toBeLessThanOrEqual(HISTORY_TOTAL_MAX);
  });
});
