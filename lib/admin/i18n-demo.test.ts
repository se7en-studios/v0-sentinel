import { describe, expect, it } from "vitest";
import {
  DEMO_MESSAGES,
  demoTranslator,
  parseDemoLocale,
  type DemoKey,
} from "./i18n-demo";

const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
const keys = Object.keys(DEMO_MESSAGES.es) as DemoKey[];

describe("demo catalog", () => {
  it("every language has every key, none empty", () => {
    for (const loc of ["en", "pt"] as const) {
      expect(Object.keys(DEMO_MESSAGES[loc]).sort()).toEqual([...keys].sort());
      for (const k of keys)
        expect(DEMO_MESSAGES[loc][k], `${loc}:${k}`).toBeTruthy();
    }
  });
  it("keeps the same {placeholders} in every language", () => {
    for (const k of keys)
      for (const loc of ["en", "pt"] as const)
        expect(placeholders(DEMO_MESSAGES[loc][k]), `${loc}:${k}`).toBe(
          placeholders(DEMO_MESSAGES.es[k]),
        );
  });
  it("keeps jargon and invented figures out of every language", () => {
    const all = Object.values(DEMO_MESSAGES)
      .flatMap((m) => Object.values(m))
      .join("\n");
    expect(all).not.toMatch(
      /FRP|VIIRS|FWI|MODIS|\d\s?%|minutos antes|minutes earlier/i,
    );
  });
  it("fills variables and falls back to Spanish", () => {
    expect(demoTranslator("en")("chrome.step", { n: 2, total: 6 })).toBe(
      "Step 2 of 6",
    );
    expect(parseDemoLocale("fr")).toBe("es");
    expect(parseDemoLocale("pt")).toBe("pt");
  });
});
