import { describe, expect, test } from "vitest";
import {
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
