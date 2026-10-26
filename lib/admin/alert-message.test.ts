import { describe, expect, it } from "vitest";
import { buildAlertMessage, sampleDetail, whatsappLine, type AlertKind } from "./alert-message";
import { MESSAGES, type Locale } from "./i18n";

const AT = Date.parse("2026-10-26T12:37:00Z");
const KINDS: AlertKind[] = ["zone_fire", "early_open", "risk", "fwi", "growth", "activity"];
const base = { org: "Sentinel Technologies", region: "Patagonia Andina", locale: "es" as Locale, at: AT };

describe("buildAlertMessage", () => {
  it("says what happened, when and what to do, in that order", () => {
    const m = buildAlertMessage({ ...base, kind: "zone_fire", detail: "Lote Norte: 3 focos" });
    const lines = m.message.split("\n");
    expect(lines[0]).toBe("Qué pasó: Lote Norte: 3 focos.");
    expect(lines.some((l) => l.startsWith("Cuándo:"))).toBe(true);
    expect(lines.some((l) => l.startsWith("Qué hacer:"))).toBe(true);
    expect(lines.at(-1)).toContain("Configuración");
    expect(m.title).toBe("Fuego cerca de tu zona · Sentinel Technologies");
  });

  it("names the map area only when the detail does not name the places", () => {
    expect(buildAlertMessage({ ...base, kind: "zone_fire", detail: "x" }).message).not.toContain("Zona del mapa");
    expect(buildAlertMessage({ ...base, kind: "risk", detail: "x" }).message).toContain("Zona del mapa: Patagonia Andina.");
  });

  it("does not double the final stop of a detail", () => {
    expect(buildAlertMessage({ ...base, kind: "activity", detail: "250 focos en 24 h. " }).message).toContain("Qué pasó: 250 focos en 24 h.\n");
  });

  it("an unconfirmed early alert is not presented as a confirmed fire", () => {
    const m = buildAlertMessage({ ...base, kind: "early_open", detail: "x" });
    expect(m.severity).toBe("warning");
    expect(m.message).toContain("Todavía no la confirmó otro satélite");
  });

  it("a fire in a zone is critical, plain activity is info", () => {
    expect(buildAlertMessage({ ...base, kind: "zone_fire", detail: "x" }).severity).toBe("critical");
    expect(buildAlertMessage({ ...base, kind: "activity", detail: "x" }).severity).toBe("info");
  });

  it("keeps only an https link", () => {
    expect(buildAlertMessage({ ...base, kind: "risk", detail: "x", link: "https://www.sentineltech.com.ar/admin" }).link).toBe("https://www.sentineltech.com.ar/admin");
    expect(buildAlertMessage({ ...base, kind: "risk", detail: "x", link: "http://localhost:3000/admin" }).link).toBeUndefined();
  });

  it("stays inside the server's limits even for a huge detail or name", () => {
    const m = buildAlertMessage({ ...base, org: "O".repeat(300), kind: "zone_fire", detail: "z".repeat(5000) });
    expect(m.title.length).toBeLessThanOrEqual(120);
    expect(m.message.length).toBeLessThanOrEqual(1000);
  });

  it("works in every language and every kind, with no placeholder left over", () => {
    for (const locale of ["es", "en", "pt"] as const)
      for (const kind of KINDS) {
        const m = buildAlertMessage({ ...base, locale, kind, detail: sampleDetail(kind, locale, AT) });
        expect(m.title + m.message, `${locale} ${kind}`).not.toMatch(/\{\w+\}/);
        expect(m.message.length).toBeGreaterThan(40);
      }
  });

  it("the three languages differ", () => {
    const text = (locale: Locale) => buildAlertMessage({ ...base, locale, kind: "risk", detail: "x" }).message;
    expect(new Set([text("es"), text("en"), text("pt")]).size).toBe(3);
  });
});

describe("punctuation", () => {
  it("never leaves a doubled full stop, in any language or kind", () => {
    for (const locale of ["es", "en", "pt"] as const)
      for (const kind of KINDS) {
        const m = buildAlertMessage({ ...base, locale, kind, detail: sampleDetail(kind, locale, AT) });
        expect(whatsappLine(m), `${locale} ${kind}`).not.toMatch(/\.\./);
        expect(m.message, `${locale} ${kind}`).not.toMatch(/\.\./);
      }
  });
});

describe("whatsappLine", () => {
  it("is one line with the link last", () => {
    const m = buildAlertMessage({ ...base, kind: "zone_fire", detail: "Lote Norte: 3 focos", link: "https://www.sentineltech.com.ar/admin" });
    const line = whatsappLine(m);
    expect(line).not.toMatch(/\n/);
    expect(line.endsWith("https://www.sentineltech.com.ar/admin")).toBe(true);
    expect(line.startsWith(m.title)).toBe(true);
  });
});

describe("sampleDetail", () => {
  it("has a believable example for every kind and language", () => {
    for (const locale of ["es", "en", "pt"] as const)
      for (const kind of KINDS) expect(sampleDetail(kind, locale, AT).length, `${locale} ${kind}`).toBeGreaterThan(5);
  });
  it("uses texts that exist in every language", () => {
    for (const k of Object.keys(MESSAGES.es).filter((k) => k.startsWith("msg.")))
      for (const locale of ["en", "pt"] as const) expect(MESSAGES[locale][k as keyof typeof MESSAGES.es], `${locale}:${k}`).toBeTruthy();
  });
});
