import { describe, expect, it } from "vitest";
import { orderCases, parseProfile } from "./profile";

const cases = ["forestry", "farms", "towns", "parks", "energy"].map((id) => ({ id }));
const ids = (p: Parameters<typeof orderCases>[1]) => orderCases(cases, p).map((c) => c.id);

describe("demo profile", () => {
  it("moves the profile's card first and keeps the rest in order", () => {
    expect(ids("towns")).toEqual(["towns", "forestry", "farms", "parks", "energy"]);
    expect(ids("farms")).toEqual(["farms", "forestry", "towns", "parks", "energy"]);
  });
  it("does not reorder without profile or for investment", () => {
    expect(ids(null)).toEqual(cases.map((c) => c.id));
    expect(ids("invest")).toEqual(cases.map((c) => c.id));
  });
  it("does not mutate the input and validates stored values", () => {
    orderCases(cases, "towns");
    expect(cases[0].id).toBe("forestry");
    expect(parseProfile("towns")).toBe("towns");
    expect(parseProfile("none")).toBeNull();
    expect(parseProfile(undefined)).toBeNull();
  });
});
