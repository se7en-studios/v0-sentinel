import { describe, expect, it } from "vitest";
import { validateContact, whatsappUrl } from "./contact";

const valid = { name: "Ana Pérez", email: "ana@mail.com", message: "Quiero una reunión por favor." };

describe("validateContact", () => {
  it("accepts a valid payload and trims", () => {
    const r = validateContact({ ...valid, name: "  Ana Pérez ", interest: "" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.name).toBe("Ana Pérez");
      expect(r.data.interest).toBeUndefined();
      expect(r.data.organization).toBe("");
    }
  });
  it("reports per-field errors", () => {
    const r = validateContact({ name: "A", email: "x", message: "corto" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["email", "message", "name"]);
  });
  it("rejects unknown interest and oversized message", () => {
    expect(validateContact({ ...valid, interest: "hack" }).ok).toBe(false);
    expect(validateContact({ ...valid, message: "x".repeat(2001) }).ok).toBe(false);
  });
});

describe("whatsappUrl", () => {
  it("returns null without a number", () => {
    expect(whatsappUrl(undefined, "hola")).toBeNull();
    expect(whatsappUrl("abc", "hola")).toBeNull();
  });
  it("builds a wa.me link", () => {
    expect(whatsappUrl("+54 9 260 123-4567", "Hola Sentinel")).toBe(
      "https://wa.me/5492601234567?text=Hola%20Sentinel",
    );
  });
});
