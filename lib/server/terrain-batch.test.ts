import { describe, expect, test, vi } from "vitest";
import type { TerrainInfo } from "@/lib/admin/terrain";

const guard = vi.hoisted(() => vi.fn(async (): Promise<Response | null> => null));
const read = vi.hoisted(() => vi.fn());
vi.mock("@/lib/server/admin-guard", () => ({ guardAdmin: guard }));
vi.mock("@/lib/server/terrain", () => ({ readTerrain: read }));

import { POST } from "@/app/api/admin/terrain/batch/route";
import { BATCH_MAX, parseBatch, readBatch } from "./terrain-batch";

const info = (burnable: boolean): TerrainInfo => ({
  landCover: burnable ? 10 : 50,
  landCoverLabel: burnable ? "Bosque" : "Zona urbana",
  burnable,
  elevation: 10,
  slopeDeg: 1,
  aspectDeg: 0,
  aspectLabel: "N",
});
const post = (body: unknown) =>
  POST(
    new Request("http://x/api/admin/terrain/batch", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
const pts = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ lat: -40 + i * 0.01, lng: -71 }));

describe("parseBatch", () => {
  test("accepts 1..25 points inside Argentina", () => {
    expect(parseBatch({ points: pts(1) })).toHaveLength(1);
    expect(parseBatch({ points: pts(BATCH_MAX) })).toHaveLength(BATCH_MAX);
  });
  test("rejects empty, oversized, non numeric and out-of-country points", () => {
    expect(parseBatch({ points: [] })).toBeNull();
    expect(parseBatch({ points: pts(BATCH_MAX + 1) })).toBeNull();
    expect(parseBatch({ points: [{ lat: "-40", lng: -71 }] })).toBeNull();
    expect(parseBatch({ points: [{ lat: 40, lng: 2 }] })).toBeNull();
    expect(parseBatch(null)).toBeNull();
  });
});

describe("readBatch", () => {
  test("keeps order, never exceeds the concurrency and nulls failures", async () => {
    let live = 0;
    let peak = 0;
    const fn = async (lat: number) => {
      live++;
      peak = Math.max(peak, live);
      await new Promise((r) => setTimeout(r, 5));
      live--;
      if (lat > -39.95) throw new Error("boom");
      return info(lat < -40);
    };
    const out = await readBatch(pts(10), fn, 3);
    expect(peak).toBeLessThanOrEqual(3);
    expect(out[0]?.burnable).toBe(false); // lat -40.00 is not < -40
    expect(out[9]).toBeNull();
    expect(out).toHaveLength(10);
  });
  test("points not started before the budget ends come back null", async () => {
    const slow = () => new Promise<TerrainInfo>((r) => setTimeout(() => r(info(true)), 40));
    const out = await readBatch(pts(4), slow, 1, 50);
    expect(out[0]).not.toBeNull();
    expect(out[3]).toBeNull();
  });
});

describe("POST /api/admin/terrain/batch", () => {
  test("returns one result per point, in order", async () => {
    read.mockImplementation(async (lat: number) => info(lat > -39.995));
    const res = await post({ points: pts(3) });
    const j = await res.json();
    expect(res.status).toBe(200);
    expect(j.results.map((r: TerrainInfo) => r.burnable)).toEqual([false, true, true]);
  });
  test("a failed read becomes null instead of failing the whole batch", async () => {
    read.mockRejectedValue(new Error("tile outage"));
    const j = await (await post({ points: pts(2) })).json();
    expect(j.results).toEqual([null, null]);
  });
  test("400 for bad JSON or points, 413 for a huge body, guard answer passes through", async () => {
    expect((await post("{nope")).status).toBe(400);
    expect((await post({ points: pts(26) })).status).toBe(400);
    expect((await post("x".repeat(5000))).status).toBe(413);
    guard.mockResolvedValueOnce(Response.json({ error: "No autorizado" }, { status: 401 }));
    expect((await post({ points: pts(1) })).status).toBe(401);
  });
});
