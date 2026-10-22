import { describe, expect, it } from "vitest";
import {
  mergeEarly,
  parseFirmsGoes,
  parseInpeGoes,
  resolveEarly,
  SCAN_MS,
  type RawGoes,
} from "./early";

const NOW = Date.parse("2026-10-22T15:00:00Z");
const raw = (
  lat: number,
  lng: number,
  minAgo: number,
  src: RawGoes["src"] = "FIRMS",
  frp = 10,
): RawGoes => ({
  lat,
  lng,
  at: NOW - minAgo * 60_000,
  frp,
  src,
});

describe("parseFirmsGoes", () => {
  const head =
    "latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight";
  it("keeps GOES-19 rows only and reads the UTC time and FRP", () => {
    const csv = [
      head,
      "-25.6,-61.3,-999,4,3,2026-10-21,0,G19,,30,1.1NRT,-999,55.6,D",
      "-25.1,-60.0,309,0,0,2026-10-22,1412,Met12,,0.8,1.11NRT,287,24.7,D",
      "-30.0,-60.0,-999,4,3,2026-10-22,905,G19FRP,,80,1.1NRT,-999,-999,D",
    ].join("\n");
    const rows = parseFirmsGoes(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      lat: -25.6,
      frp: 55.6,
      at: Date.parse("2026-10-21T00:00:00Z"),
    });
    expect(rows[1]).toMatchObject({
      at: Date.parse("2026-10-22T09:05:00Z"),
      frp: 0,
    });
  });
  it("returns nothing for an unexpected header or empty text", () => {
    expect(parseFirmsGoes("")).toEqual([]);
    expect(parseFirmsGoes("a,b,c\n1,2,3")).toEqual([]);
  });
});

describe("parseInpeGoes", () => {
  it("keeps GOES-19 rows and skips polar satellites and the header", () => {
    const csv = [
      "lat,lon,satelite,data",
      "   2.0594, -55.9764,GOES-19,2026-10-22 14:10:00",
      " -23.27, -58.83,AQUA_M-M,2026-10-22 07:03:00",
    ].join("\n");
    const rows = parseInpeGoes(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      src: "INPE",
      at: Date.parse("2026-10-22T14:10:00Z"),
    });
  });
});

describe("mergeEarly", () => {
  it("drops a FIRMS-only spot seen in fewer than 3 scans", () => {
    expect(mergeEarly([raw(-30, -60, 40), raw(-30, -60, 30)], NOW)).toEqual([]);
  });
  it("keeps a persistent FIRMS spot and counts distinct scans", () => {
    const out = mergeEarly(
      [
        raw(-30, -60, 40),
        raw(-30.001, -60, 30),
        raw(-30, -60.001, 20),
        raw(-30, -60, 20),
      ],
      NOW,
    );
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      scans: 3,
      sources: ["FIRMS"],
      lastAt: NOW - 20 * 60_000,
    });
  });
  it("keeps a single INPE scan and joins both sources at the same spot", () => {
    const out = mergeEarly(
      [raw(-35, -65, 15, "INPE"), raw(-35.01, -65, 15), raw(-35, -65, 25)],
      NOW,
    );
    expect(out).toHaveLength(1);
    expect(out[0].sources).toEqual(["FIRMS", "INPE"]);
    expect(out[0].firstAt).toBe(NOW - 25 * 60_000);
  });
  it("keeps spots more than 4.5 km apart separate", () => {
    const out = mergeEarly(
      [raw(-35, -65, 15, "INPE"), raw(-35.1, -65, 15, "INPE")],
      NOW,
    );
    expect(out).toHaveLength(2);
  });
  it("ignores rows older than the window and rows from the future", () => {
    expect(
      mergeEarly(
        [
          raw(-35, -65, 7 * 60, "INPE"),
          { ...raw(-35, -65, 0, "INPE"), at: NOW + 3 * SCAN_MS },
        ],
        NOW,
      ),
    ).toEqual([]);
  });
});

describe("resolveEarly", () => {
  const early = mergeEarly([raw(-35, -65, 30, "INPE")], NOW);
  it("is open when nothing polar is nearby", () => {
    expect(resolveEarly(early, [])[0].status).toBe("open");
  });
  it("is confirmed by a clean polar detection nearby, taking the earliest", () => {
    const at = NOW - 10 * 60_000;
    const out = resolveEarly(early, [
      { lat: -35.01, lng: -65, at: NOW - 5 * 60_000, noise: false },
      { lat: -35.01, lng: -65, at, noise: false },
    ]);
    expect(out[0]).toMatchObject({ status: "confirmed", confirmedAt: at });
  });
  it("is not confirmed by a polar pass that came well before it or is too far", () => {
    expect(
      resolveEarly(early, [
        { lat: -35, lng: -65, at: NOW - 3 * 3600_000, noise: false },
      ])[0].status,
    ).toBe("open");
    expect(
      resolveEarly(early, [{ lat: -35.2, lng: -65, at: NOW, noise: false }])[0]
        .status,
    ).toBe("open");
  });
  it("is noise on top of a fixed polar source or a known industrial site", () => {
    expect(
      resolveEarly(early, [{ lat: -35.005, lng: -65, at: NOW, noise: true }])[0]
        .status,
    ).toBe("noise");
    const plant = mergeEarly([raw(-34.905, -57.915, 20, "INPE")], NOW);
    expect(resolveEarly(plant, [])[0]).toMatchObject({
      status: "noise",
      site: "Refinería La Plata",
    });
  });
});
