import { describe, expect, it } from "vitest";
import {
  compassLabel,
  describeTerrain,
  slopeAspect,
  terrainLine,
  tileNames,
} from "./terrain";

describe("tileNames", () => {
  it("finds the 3-degree WorldCover tile and 1-degree DEM tile of a southern, western point", () => {
    const t = tileNames(-35.5, -65.5);
    expect(t.worldCoverUrl).toContain("v200_S36W066_Map.tif");
    expect(t.demUrl).toContain("Copernicus_DSM_COG_10_S36_00_W066_00_DEM.tif");
  });
  it("handles an exact tile boundary", () => {
    expect(tileNames(-36, -66).worldCoverUrl).toContain("S36W066");
    expect(tileNames(-33.0001, -63.0001).worldCoverUrl).toContain("S36W066");
    expect(tileNames(-32.9999, -62.9999).worldCoverUrl).toContain("S33W063");
  });
});

describe("slopeAspect", () => {
  const res = 0.0002777777; // ~30 m
  it("is flat on level ground", () => {
    expect(
      slopeAspect([5, 5, 5, 5, 5, 5, 5, 5, 5], -35, res, res).slopeDeg,
    ).toBe(0);
  });
  it("faces west when the ground rises to the east, with a ~45 degree slope for 1:1", () => {
    // columns rise east; pixel size in metres at lat 0 so dx == dy
    const run = res * 111_320;
    const z = [0, run, 2 * run, 0, run, 2 * run, 0, run, 2 * run];
    const r = slopeAspect(z, 0, res, res);
    expect(r.slopeDeg).toBeCloseTo(45, 0);
    expect(r.aspectDeg).toBe(270);
  });
  it("faces north when the ground rises to the south", () => {
    const run = res * 111_320;
    const z = [0, 0, 0, run, run, run, 2 * run, 2 * run, 2 * run];
    expect(slopeAspect(z, 0, res, res).aspectDeg).toBe(0);
  });
});

describe("describeTerrain / terrainLine", () => {
  it("labels the cover, flags non-vegetal ground and writes one line", () => {
    const t = describeTerrain(30, 840.4, { slopeDeg: 12.3, aspectDeg: 225 });
    expect(t).toMatchObject({
      landCoverLabel: "Pastizal",
      burnable: true,
      elevation: 840,
      aspectLabel: "SO",
    });
    expect(terrainLine(t)).toBe("Pastizal · 840 m · pendiente 12° hacia el SO");
    expect(describeTerrain(50, null, null).burnable).toBe(false);
  });
  it("calls gentle ground flat and copes with missing layers", () => {
    expect(
      terrainLine(describeTerrain(10, 100, { slopeDeg: 0.8, aspectDeg: 90 })),
    ).toBe("Bosque · 100 m · terreno llano");
    expect(terrainLine(describeTerrain(null, null, null))).toBe("");
  });
  it("names the eight compass points", () => {
    expect([0, 45, 90, 135, 180, 225, 270, 315, 360].map(compassLabel)).toEqual(
      ["N", "NE", "E", "SE", "S", "SO", "O", "NO", "N"],
    );
  });
});
