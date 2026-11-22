import { describe, expect, it, test } from "vitest";
import { dropModisDuplicates, keepUnchanged, packPoints, parseFireRows } from "./fires-parse";
import type { FirePoint } from "./types";

const VIIRS =
  "latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight\n" +
  "-29.40,-66.75,306,0.4,0.6,2026-10-22,627,N20,VIIRS,n,2.0NRT,288,2.01,D\n" +
  "-21.50,-58.62,314,0.4,0.3,2026-10-21,501,N21,VIIRS,h,2.0NRT,292,0.92,N";
const MODIS =
  "latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight\n" +
  "-29.401,-66.751,301,1.5,1.2,2026-10-22,640,Aqua,MODIS,22,6.1NRT,282,7.4,D\n" +
  "-31.75,-52.35,304,1.5,1.2,2026-10-22,5,Terra,MODIS,85,6.1NRT,282,15.6,N";

describe("parseFireRows", () => {
  it("reads VIIRS letters as confidence and tags the satellite", () => {
    const rows = parseFireRows(VIIRS, "viirs");
    expect(rows.map((r) => [r.conf, r.sat, r.night])).toEqual([
      [1, 0, false],
      [2, 1, true],
    ]);
    expect(rows[0].at).toBe(Date.parse("2026-10-22T06:27:00Z"));
  });
  it("bands the 0-100 MODIS confidence", () => {
    const rows = parseFireRows(MODIS, "modis");
    expect(rows.map((r) => [r.conf, r.sat])).toEqual([
      [0, 3],
      [2, 2],
    ]);
  });
  it("returns nothing for text without the expected columns", () => {
    expect(parseFireRows("", "viirs")).toEqual([]);
    expect(parseFireRows("a,b\n1,2", "modis")).toEqual([]);
  });
});

describe("dropModisDuplicates", () => {
  const viirs = parseFireRows(VIIRS, "viirs");
  const modis = parseFireRows(MODIS, "modis");
  it("drops the MODIS pixel VIIRS saw at the same spot within the hour, keeps the rest", () => {
    const kept = dropModisDuplicates(modis, viirs);
    expect(kept).toHaveLength(1);
    expect(kept[0].sat).toBe(2);
  });
  it("keeps a nearby MODIS detection taken hours earlier (the earlier sighting)", () => {
    const early = { ...modis[0], at: modis[0].at - 4 * 3600_000 };
    expect(dropModisDuplicates([early], viirs)).toHaveLength(1);
  });
});

describe("packPoints", () => {
  it("indexes days, keeps the satellite as the 8th value and reports the newest acquisition", () => {
    const rows = parseFireRows(VIIRS, "viirs");
    const { days, points, newestAt } = packPoints(rows);
    expect(days).toEqual(["2026-10-21", "2026-10-22"]);
    expect(points[0]).toEqual([-29.4, -66.75, 2.01, 1, 1, 627, 0, 0]);
    expect(newestAt).toBe(Date.parse("2026-10-22T06:27:00Z"));
  });
});

describe("keepUnchanged", () => {
  const base = {
    updated: "2026-11-21T10:00:00Z",
    days: ["2026-11-20", "2026-11-21"],
    points: [
      [-41.1, -71.3, 12, 2, 1, 1400, 0, 1],
      [-42.0, -71.9, 5, 1, 0, 300, 1, 1],
    ] as FirePoint[],
    clusters: [],
  };
  const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

  test("a refresh with the same detections keeps the old arrays and takes the new metadata", () => {
    const next = { ...clone(base), updated: "2026-11-21T10:30:00Z", fetchedAt: 99 };
    const out = keepUnchanged(base, next);
    expect(out.points).toBe(base.points);
    expect(out.days).toBe(base.days);
    expect(out.updated).toBe("2026-11-21T10:30:00Z");
    expect(out.fetchedAt).toBe(99);
  });

  test("any change in a detection or in the day list brings the new arrays", () => {
    const moved = clone(base);
    moved.points[1][2] = 6;
    expect(keepUnchanged(base, moved).points).toBe(moved.points);
    const added = clone(base);
    added.points.push([-40, -70, 1, 1, 1, 100, 0, 1]);
    expect(keepUnchanged(base, added).points).toBe(added.points);
    const newDay = { ...clone(base), days: ["2026-11-21", "2026-11-22"] };
    expect(keepUnchanged(base, newDay).days).toBe(newDay.days);
  });

  test("the first load is taken as is", () => {
    expect(keepUnchanged(null, base)).toBe(base);
  });
});
