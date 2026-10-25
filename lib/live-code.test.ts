import { describe, expect, it } from "vitest";
import { fireCode } from "./live";

describe("fireCode", () => {
  const t = Date.UTC(2026, 9, 18, 15);

  it("keeps the same code for the same ignition", () => {
    expect(fireCode(t, [-71.5, -41.9])).toBe(fireCode(t, [-71.5, -41.9]));
  });

  it("starts with the Argentina-time day and month", () => {
    expect(fireCode(t, [-71.5, -41.9])).toMatch(/^1810-[0-9A-Z]{3}$/);
    // 01:00 UTC is still the previous day in Argentina (UTC-3)
    expect(fireCode(Date.UTC(2026, 9, 18, 1), [-71.5, -41.9]).startsWith("1710-")).toBe(true);
  });

  it("tells apart fires started the same day in different places", () => {
    expect(fireCode(t, [-71.5, -41.9])).not.toBe(fireCode(t, [-64.2, -31.4]));
  });
});
