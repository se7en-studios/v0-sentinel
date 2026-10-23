import { describe, expect, it } from "vitest";
import { parseHealth, parseNotify, sourceState } from "./integrations";

describe("sourceState", () => {
  it("separates active, slow and down", () => {
    expect(sourceState({ ok: true, latencyMs: 400 })).toBe("ok");
    expect(sourceState({ ok: true, latencyMs: 3500 })).toBe("slow");
    expect(sourceState({ ok: false, latencyMs: 100 })).toBe("down");
  });
});

describe("parseHealth", () => {
  it("keeps valid sources and drops malformed ones", () => {
    const h = parseHealth({
      updated: "2026-10-22T10:00:00Z",
      sources: [
        { id: "a", label: "A", ok: true, latencyMs: 120.4, ageMin: 12 },
        {
          id: "b",
          label: "B",
          ok: false,
          latencyMs: 6000,
          error: "Sin respuesta a tiempo",
        },
        { label: "sin id" },
        null,
      ],
    });
    expect(h?.sources).toHaveLength(2);
    expect(h?.sources[0]).toMatchObject({ latencyMs: 120, ageMin: 12 });
    expect(h?.ok).toBe(false);
  });
  it("rejects anything that is not a health payload", () => {
    expect(parseHealth(null)).toBeNull();
    expect(parseHealth({ sources: "x" })).toBeNull();
    expect(parseHealth({ sources: [] })?.ok).toBe(false);
  });
});

describe("parseNotify", () => {
  it("keeps channel and counts, never the free-text error", () => {
    const r = parseNotify({
      dryRun: true,
      results: [
        {
          channel: "email",
          status: "skipped",
          attempted: 0,
          delivered: 0,
          error: "a@b.com",
        },
        { channel: "sms", status: "sent" },
        { channel: "webhook", status: "dry-run", attempted: 1, delivered: 0 },
      ],
    });
    expect(r?.dryRun).toBe(true);
    expect(r?.results).toHaveLength(2);
    expect(JSON.stringify(r)).not.toContain("a@b.com");
  });
  it("rejects a non-payload", () => {
    expect(parseNotify({ error: "x" })).toBeNull();
  });
});
