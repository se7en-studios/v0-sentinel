import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("@/lib/server/admin-guard", () => ({
  guardAdmin: vi.fn(async () => null),
}));

import { POST } from "@/app/api/admin/notify/route";

const post = (body: string) =>
  POST(new Request("http://x/api/admin/notify", { method: "POST", body }));

afterEach(() => vi.unstubAllGlobals());

describe("POST /api/admin/notify", () => {
  test("400 on invalid JSON and on invalid fields (names only)", async () => {
    expect((await post("{nope")).status).toBe(400);
    const res = await post(
      JSON.stringify({ title: "", message: "m", emails: ["x"] }),
    );
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.fields).toEqual(expect.arrayContaining(["title", "emails.0"]));
  });

  test("413 when the body is oversized", async () => {
    expect((await post("x".repeat(20_000))).status).toBe(413);
  });

  test("200 dryRun with unconfigured channels", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    const res = await post(
      JSON.stringify({ title: "t", message: "m", dryRun: true }),
    );
    const j = await res.json();
    expect(res.status).toBe(200);
    expect(j.dryRun).toBe(true);
    expect(j.results).toHaveLength(3);
    expect(f).not.toHaveBeenCalled();
  });
});
