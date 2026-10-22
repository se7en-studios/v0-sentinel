import { afterEach, describe, expect, test, vi } from "vitest";
import { checkHealth } from "./health";

const NOW = Date.parse("2026-10-22T12:00:00Z");
const VIIRS =
  "latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight\n" +
  "-29.40,-66.75,306,0.4,0.6,2026-10-22,1130,N20,VIIRS,n,2.0NRT,288,2.01,D";

afterEach(() => vi.unstubAllGlobals());

describe("checkHealth", () => {
  test("reports latency and freshness, and degrades per source", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (u: string, init?: RequestInit) => {
        const url = String(u);
        if (url.includes("VIIRS_NOAA20")) return new Response(VIIRS);
        if (url.includes("MODIS")) return new Response("", { status: 503 });
        if (url.includes("GOES_NRT")) throw new Error(`boom ${url}`);
        if (url.includes("inpe.br"))
          return new Response("", {
            status: init?.method === "HEAD" ? 200 : 404,
          });
        return new Response("", { status: 200 });
      }),
    );
    const h = await checkHealth(NOW, "SECRETKEY");
    const by = Object.fromEntries(h.sources.map((s) => [s.id, s]));
    expect(by["firms-viirs"]).toMatchObject({ ok: true, ageMin: 30 });
    expect(by["firms-modis"].ok).toBe(false);
    expect(by["firms-goes"]).toMatchObject({
      ok: false,
      error: "No se pudo contactar a la fuente",
    });
    expect(by.inpe).toMatchObject({ ok: true, ageMin: 0 });
    expect(by["aws-terrain"].ok).toBe(true);
    expect(h.ok).toBe(false);
    expect(JSON.stringify(h)).not.toContain("SECRETKEY");
  });

  test("without a key the FIRMS probes say so and nothing calls FIRMS", async () => {
    const f = vi.fn(async (_u: string) => new Response("", { status: 200 }));
    vi.stubGlobal("fetch", f);
    const h = await checkHealth(NOW, undefined);
    expect(
      h.sources
        .filter((s) => s.id.startsWith("firms"))
        .every((s) => !s.ok && s.error?.includes("NASA_FIRMS_KEY")),
    ).toBe(true);
    expect(f.mock.calls.some(([u]) => String(u).includes("firms.modaps"))).toBe(
      false,
    );
  });

  test("a hung source is cut at the timeout", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    const p = checkHealth(NOW, "k");
    await vi.advanceTimersByTimeAsync(7000);
    const h = await p;
    vi.useRealTimers();
    expect(h.sources.every((s) => !s.ok)).toBe(true);
    expect(h.sources[0].error).toBe("Sin respuesta a tiempo");
  });
});
