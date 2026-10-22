import { describe, expect, it } from "vitest";
import { parseMapPrefs, type MapPrefs } from "./map-prefs";

const base: MapPrefs = {
  view: "2d",
  show: {
    fires: true,
    early: true,
    heat: true,
    zones: true,
    lines: true,
    routes: true,
    sensors: true,
    drones: true,
    names: true,
    spread: true,
    forest: true,
    buildings: true,
  },
};

describe("parseMapPrefs", () => {
  it("returns the base when there is nothing stored or it is corrupt", () => {
    expect(parseMapPrefs(null, base)).toBe(base);
    expect(parseMapPrefs("{no", base)).toBe(base);
  });
  it("restores valid booleans and the view", () => {
    const p = parseMapPrefs(
      JSON.stringify({ view: "3d", show: { heat: false } }),
      base,
    );
    expect(p.view).toBe("3d");
    expect(p.show.heat).toBe(false);
    expect(p.show.fires).toBe(true);
  });
  it("ignores wrong types and unknown keys", () => {
    const p = parseMapPrefs(
      JSON.stringify({ view: "4d", show: { fires: "no", x: false } }),
      base,
    );
    expect(p.view).toBe("2d");
    expect(p.show.fires).toBe(true);
    expect("x" in p.show).toBe(false);
  });
});
