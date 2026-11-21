import { describe, expect, test } from "vitest";
import {
  ensembleOdds,
  ensembleUrl,
  FWI_DANGER,
  type EnsemblePayload,
} from "./ensemble";
import { FWI_START } from "./fwi";

const DAYS = 3;
const H = DAYS * 24;
const time = Array.from({ length: H }, (_, i) => {
  const d = String(1 + Math.floor(i / 24)).padStart(2, "0");
  return `2026-01-${d}T${String(i % 24).padStart(2, "0")}:00`;
});
const fill = (v: number | null) => Array.from({ length: H }, () => v);

interface Member {
  temp: number;
  rh: number;
  wind: number;
  rainPerHour: number;
}
const HOT: Member = { temp: 38, rh: 10, wind: 45, rainPerHour: 0 };
const WET: Member = { temp: 12, rh: 95, wind: 5, rainPerHour: 2 };
/** a dry state on the eve of day one, as after weeks without rain */
const DRY_EVE = { ffmc: 92, dmc: 60, dc: 400 };

function payload(members: Member[]): EnsemblePayload {
  const hourly: Record<string, (number | null)[] | string[]> = { time };
  members.forEach((m, i) => {
    const sfx = i === 0 ? "" : `_member${String(i).padStart(2, "0")}`;
    hourly[`temperature_2m${sfx}`] = fill(m.temp);
    hourly[`relative_humidity_2m${sfx}`] = fill(m.rh);
    hourly[`wind_speed_10m${sfx}`] = fill(m.wind);
    hourly[`precipitation${sfx}`] = fill(m.rainPerHour);
  });
  return { hourly } as EnsemblePayload;
}

describe("ensembleOdds", () => {
  test("every member hot, dry and windy: certain danger on every day", () => {
    const odds = ensembleOdds(payload(Array(51).fill(HOT)), DRY_EVE, -41);
    expect([...odds.keys()]).toEqual([
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
    ]);
    for (const o of odds.values()) {
      expect(o.pDanger).toBe(1);
      expect(o.members).toBe(51);
      expect(o.p10).toBeGreaterThanOrEqual(FWI_DANGER);
    }
  });

  test("a split ensemble gives a split probability and a wide range", () => {
    const members = [...Array(25).fill(HOT), ...Array(26).fill(WET)];
    const o = ensembleOdds(payload(members), DRY_EVE, -41).get("2026-01-02")!;
    expect(o.pDanger).toBeCloseTo(25 / 51, 5);
    expect(o.p10).toBeLessThan(FWI_DANGER);
    expect(o.p90).toBeGreaterThanOrEqual(FWI_DANGER);
    expect(o.p10).toBeLessThanOrEqual(o.p50);
    expect(o.p50).toBeLessThanOrEqual(o.p90);
  });

  test("a member with a missing noon value is dropped, not read as 0 °C", () => {
    const p = payload(Array(20).fill(HOT));
    (p.hourly!["temperature_2m_member03"] as (number | null)[])[36] = null;
    expect(ensembleOdds(p, FWI_START, -41).get("2026-01-01")!.members).toBe(19);
  });

  test("too few members or no hourly data: no odds rather than noise", () => {
    expect(ensembleOdds(payload(Array(5).fill(HOT)), FWI_START, -41).size).toBe(
      0,
    );
    expect(ensembleOdds({}, FWI_START, -41).size).toBe(0);
    expect(ensembleOdds({ hourly: { time: [] } }, FWI_START, -41).size).toBe(0);
  });

  test("asks the ECMWF ensemble for the four FWI inputs", () => {
    const u = ensembleUrl(-41.1234, -71.3, 7);
    expect(u).toContain("models=ecmwf_ifs025");
    expect(u).toContain("latitude=-41.123");
    expect(u).toContain("forecast_days=7");
    expect(u).toContain(
      "hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation",
    );
  });
});
