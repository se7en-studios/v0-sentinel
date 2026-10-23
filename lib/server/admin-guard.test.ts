import { describe, expect, test, vi } from "vitest";

vi.mock("@/lib/admin/auth", () => ({ isAuthed: async () => true }));
vi.mock("@/lib/admin/firebase", () => ({ firebaseEnabled: false }));
vi.mock("@/lib/admin/firebase-verify", () => ({ verifyFirebaseToken: vi.fn() }));

import { allowed, crossSite } from "./admin-guard";

const req = (method: string, origin?: string) =>
  new Request("https://sentinel.test/api/admin/notify", {
    method,
    headers: origin ? { origin } : {},
  });

describe("CSRF: Origin check on cookie sessions", () => {
  test("a POST from another site is refused even with a valid cookie", async () => {
    expect(crossSite(req("POST", "https://evil.example"))).toBe(true);
    expect(await allowed(req("POST", "https://evil.example"))).toBe(false);
    expect(await allowed(req("POST", "null"))).toBe(false);
  });

  test("same-origin POST, POST without Origin and GETs keep working", async () => {
    expect(await allowed(req("POST", "https://sentinel.test"))).toBe(true);
    expect(await allowed(req("POST"))).toBe(true);
    expect(await allowed(req("GET", "https://evil.example"))).toBe(true);
  });
});
