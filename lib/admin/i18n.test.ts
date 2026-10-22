import { describe, expect, it } from "vitest";
import {
  MESSAGES,
  parseLocale,
  riskLabel,
  translate,
  type MsgKey,
} from "./i18n";

const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();

describe("i18n catalog", () => {
  const keys = Object.keys(MESSAGES.es) as MsgKey[];
  it("every language has every key, none empty", () => {
    for (const loc of ["en", "pt"] as const)
      for (const k of keys) {
        expect(MESSAGES[loc][k], `${loc}:${k}`).toBeTruthy();
      }
  });
  it("keeps the same {placeholders} in every language", () => {
    for (const k of keys)
      for (const loc of ["en", "pt"] as const)
        expect(placeholders(MESSAGES[loc][k]), `${loc}:${k}`).toBe(
          placeholders(MESSAGES.es[k]),
        );
  });
});

describe("translate", () => {
  it("fills variables and picks the language", () => {
    expect(translate("en", "age.min", { n: 5 })).toBe("5 min ago");
    expect(translate("pt", "age.min", { n: 5 })).toBe("há 5 min");
    expect(translate("es", "status.earlyOpen", { n: 2 })).toBe(
      "2 sin confirmar",
    );
  });
  it("falls back to Spanish for an unknown locale value", () => {
    expect(parseLocale("fr")).toBe("es");
    expect(parseLocale("pt")).toBe("pt");
    expect(parseLocale(undefined)).toBe("es");
  });
  it("translates risk labels and passes unknown ones through", () => {
    const t = (k: MsgKey) => translate("en", k);
    expect(riskLabel(t, "Moderado")).toBe("Moderate");
    expect(riskLabel(t, "Raro")).toBe("Raro");
  });
});
