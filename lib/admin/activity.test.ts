import { describe, expect, test } from "vitest";
import { ACTIVITY_MAX, addActivity, cleanActivity, type ActivityEntry } from "./activity";

const e = (id: string, t = 1): ActivityEntry => ({ id, t, kind: "zone", title: "x", detail: "y" });

describe("activity log", () => {
  test("newest first, bounded, no duplicate ids", () => {
    let l: ActivityEntry[] = [];
    for (let i = 0; i < ACTIVITY_MAX + 10; i++) l = addActivity(l, e(`a${i}`, i));
    expect(l).toHaveLength(ACTIVITY_MAX);
    expect(l[0].id).toBe(`a${ACTIVITY_MAX + 9}`);
    expect(addActivity(l, e(l[0].id))).toBe(l);
  });

  test("cleans untrusted storage content", () => {
    expect(cleanActivity("nope")).toEqual([]);
    const out = cleanActivity([null, { id: "a", t: 1, kind: "zone", title: "t", detail: 5 }, { id: "b", t: 1, kind: "alien" }]);
    expect(out).toEqual([{ id: "a", t: 1, kind: "zone", title: "t", detail: "" }]);
  });
});
