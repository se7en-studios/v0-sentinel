import { describe, expect, it } from "vitest";
import { TABS } from "@/components/admin/tabs";
import { GO_KEYS } from "@/components/admin/shortcuts";
import { MESSAGES } from "./i18n";
import type { MsgKey } from "./i18n";

describe("TABS (the single list of screens)", () => {
  it("has unique ids and unique single-letter shortcuts", () => {
    expect(new Set(TABS.map((x) => x.id)).size).toBe(TABS.length);
    expect(new Set(TABS.map((x) => x.key)).size).toBe(TABS.length);
    for (const x of TABS) expect(x.key, x.id).toMatch(/^[a-z]$/);
  });
  it("keeps General, Incendios and Zonas as the essentials", () => {
    expect(TABS.filter((x) => x.essential).map((x) => x.id)).toEqual(["general", "incendios", "zonas"]);
  });
  it("has its name and short name in every language (a tab without texts fails here)", () => {
    for (const x of TABS)
      for (const locale of ["es", "en", "pt"] as const) {
        expect(MESSAGES[locale][`tab.${x.id}` as MsgKey], `${locale} tab.${x.id}`).toBeTruthy();
        expect(MESSAGES[locale][`tab.${x.id}.short` as MsgKey], `${locale} tab.${x.id}.short`).toBeTruthy();
      }
  });
  it("gives every screen a 'g + letter' shortcut, including Incendios", () => {
    expect(Object.values(GO_KEYS).sort()).toEqual(TABS.map((x) => x.id).sort());
    expect(GO_KEYS.f).toBe("incendios");
  });
});
