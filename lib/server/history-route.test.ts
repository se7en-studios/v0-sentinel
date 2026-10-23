import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/lib/server/admin-guard", () => ({
  guardAdmin: vi.fn(async () => null),
}));

import { resetHistoryCache } from "@/lib/server/history";
import { GET } from "@/app/api/admin/history/route";

const HEAD =
  "latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight";
const row = (date: string, conf: string, lat = -29.4, lng = -66.75) =>
  `${lat},${lng},306,0.4,0.6,${date},627,N20,VIIRS,${conf},2.0,288,2.01,D`;

const call = () => GET(new Request("http://x/api/admin/history"));
let urls: string[] = [];

function stub(answer: (url: string) => Response) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (u: string) => {
      urls.push(String(u));
      return answer(String(u));
    }),
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-22T12:00:00Z"));
  vi.stubEnv("NASA_FIRMS_KEY", "secretkey");
  urls = [];
  resetHistoryCache();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("GET /api/admin/history", () => {
  test("counts nominal+ fires inside Argentina per day; a failed year is null, not 0", async () => {
    stub((url) => {
      if (url.includes("/2023-")) return new Response("", { status: 500 });
      // each chunk starts on its own date: a nominal fire, a low one and one outside Argentina
      const date = url.split("/").pop()!;
      return new Response(
        [HEAD, row(date, "n"), row(date, "l"), row(date, "h", -3, -60)].join(
          "\n",
        ),
      );
    });
    const body = await (await call()).json();
    expect(body.end).toBe("2026-10-22");
    expect(body.years.map((y: { year: number }) => y.year)).toEqual([
      2026, 2025, 2024, 2023,
    ]);
    expect(body.years[3].counts).toBeNull();
    expect(body.years[0].counts[0]).toBe(1);
    expect(body.years[0].counts[5]).toBe(1);
    expect(body.years[0].counts[1]).toBe(0);
    expect(body.years[1].source).toBe("SP");
    expect(urls).toHaveLength(8);
    expect(
      urls.some(
        (u) => u.includes("VIIRS_NOAA20_NRT") && u.includes("/2026-10-13"),
      ),
    ).toBe(true);
    expect(
      urls.some(
        (u) => u.includes("VIIRS_NOAA20_SP") && u.includes("/2025-10-13"),
      ),
    ).toBe(true);
  });

  test("the key never reaches the body", async () => {
    stub(() => new Response(HEAD));
    expect(JSON.stringify(await (await call()).json())).not.toContain(
      "secretkey",
    );
  });

  test("second call is served from memory", async () => {
    stub(() => new Response(HEAD));
    await call();
    await call();
    expect(urls).toHaveLength(8);
  });

  test("missing key is a 503", async () => {
    vi.stubEnv("NASA_FIRMS_KEY", "");
    expect((await call()).status).toBe(503);
  });
});
