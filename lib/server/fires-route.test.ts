import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/lib/server/admin-guard", () => ({
  guardAdmin: vi.fn(async () => null),
}));

import { resetInpeCache } from "@/lib/server/inpe-fires";
import { GET } from "@/app/api/admin/fires/route";

const NOW = new Date("2026-10-22T12:00:00Z");
const FIRMS =
  "latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight\n" +
  "-29.40,-66.75,306,0.4,0.6,2026-10-22,627,N20,VIIRS,n,2.0NRT,288,2.01,D";
const INPE =
  "id,lat,lon,data_hora_gmt,satelite,municipio,estado,pais,a,b,c,d,e,f,g,frp\n" +
  "1, -29.40, -66.75,2026-10-22 06:27:00,NOAA-20,X,Y,Argentina,1,2,3,4,0,1,,2.0\n" +
  "2, -29.50, -66.75,2026-10-22 06:27:00,GOES-19,X,Y,Argentina,1,2,3,4,0,1,,2.0\n" +
  "3, -29.60, -66.75,2026-10-10 06:27:00,NOAA-21,X,Y,Argentina,1,2,3,4,0,1,,2.0\n" +
  "4, -3.00, -60.00,2026-10-22 06:27:00,NOAA-21,X,Y,Brasil,1,2,3,4,0,1,,2.0";

const call = () => GET(new Request("http://x/api/admin/fires"));
const stub = (firms: boolean, inpe: boolean) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async (u: string) => {
      const url = String(u);
      if (url.includes("firms.modaps"))
        return firms && !url.includes("MODIS") && url.endsWith("/5")
          ? new Response(FIRMS)
          : new Response("", { status: 500 });
      if (url.includes("inpe.br"))
        return inpe && url.includes("20261022") ? new Response(INPE) : new Response("", { status: 404 });
      throw new Error(`unexpected ${url}`);
    }),
  );

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  vi.stubEnv("NASA_FIRMS_KEY", "k");
  resetInpeCache();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("GET /api/admin/fires", () => {
  test("serves FIRMS when it answers, without fallback flag", async () => {
    stub(true, true);
    const body = await (await call()).json();
    expect(body.points).toHaveLength(1);
    expect(body.fallback).toBeUndefined();
  });

  test("falls back to INPE polar rows, flagged in sources", async () => {
    stub(false, true);
    const res = await call();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.fallback).toBe("INPE");
    // only the Argentine NOAA-20 row in the 48 h window: GOES, old and Brazilian rows are out
    expect(body.points).toHaveLength(1);
    expect(body.sources[0]).toMatchObject({ id: "firms-polar", ok: false });
    expect(body.sources.some((s: { label: string }) => s.label.includes("respaldo INPE"))).toBe(true);
  });

  test("falls back when the FIRMS key is missing", async () => {
    vi.stubEnv("NASA_FIRMS_KEY", "");
    stub(false, true);
    expect((await (await call()).json()).fallback).toBe("INPE");
  });

  test("502 when both FIRMS and INPE fail", async () => {
    stub(false, false);
    expect((await call()).status).toBe(502);
  });
});
