import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { buildWeeklyReport, INCIDENTS_MAX, ZONES_MAX, WEEK_DAYS, type WeeklyInput } from "./weekly-report";
import { pdfSafe, renderWeeklyPdf } from "./weekly-pdf";
import { MESSAGES } from "./i18n";

const NOW = Date.parse("2026-10-26T12:00:00Z");
const input = (over: Partial<WeeklyInput> = {}): WeeklyInput => ({
  org: "Sentinel Technologies",
  region: "Patagonia Andina",
  locale: "es",
  now: NOW,
  perDay: Array.from({ length: 10 }, (_, i) => ({ label: `${17 + i} oct`, count: i * 3, frp: i * 2.5 })),
  hectares10d: 44_355,
  zones: [
    { name: "Lote Norte", areaHa: 120, recent: 3, total: 9 },
    { name: "Lote Sur", areaHa: 80, recent: 0, total: 0 },
  ],
  incidents: [{ place: "Cerca de Bariloche", areaHa: 562, fires: 25, frp: 1114, daysActive: 3 }],
  forecast: [{ label: "lun", score: 29, risk: "Bajo", color: "#0f7a4f" }, { label: "mar", score: 71, risk: "Alto", color: "#c2540a" }],
  sources: [{ label: "NOAA-20 · VIIRS", ok: true, ageMin: 95 }, { label: "GOES-19 · INPE", ok: false }],
  activeRules: 3,
  ...over,
});

const pages = async (bytes: Uint8Array) => (await PDFDocument.load(bytes)).getPageCount();

describe("buildWeeklyReport", () => {
  it("keeps the last seven days and adds them up", () => {
    const r = buildWeeklyReport(input());
    expect(r.days).toHaveLength(WEEK_DAYS);
    expect(r.days[0].label).toBe("20 oct");
    expect(r.totals.fires).toBe([3, 4, 5, 6, 7, 8, 9].reduce((a, b) => a + b * 3, 0));
    expect(r.period).toEqual({ from: "20 oct", to: "26 oct" });
  });
  it("counts the zones with fires nearby and puts those first", () => {
    const r = buildWeeklyReport(input());
    expect(r.totals).toMatchObject({ zones: 2, zonesHit: 1 });
    expect(r.zones[0].name).toBe("Lote Norte");
  });
  it("caps long lists and says how many were left out", () => {
    const zones = Array.from({ length: 30 }, (_, i) => ({ name: `Z${i}`, areaHa: i, recent: 0, total: 0 }));
    const incidents = Array.from({ length: 9 }, (_, i) => ({ place: `P${i}`, areaHa: i * 10, fires: 5, frp: 1, daysActive: 1 }));
    const r = buildWeeklyReport(input({ zones, incidents }));
    expect(r.zones).toHaveLength(ZONES_MAX);
    expect(r.zonesOmitted).toBe(30 - ZONES_MAX);
    expect(r.incidents).toHaveLength(INCIDENTS_MAX);
    expect(r.incidents[0].place).toBe("P8"); // the biggest first
  });
  it("survives missing and absurd numbers", () => {
    const r = buildWeeklyReport(input({ perDay: [{ label: "x", count: Number.NaN, frp: -5 }], hectares10d: Number.POSITIVE_INFINITY, zones: [{ name: "z", areaHa: Number.NaN, recent: -1, total: 2 }] }));
    expect(r.totals).toMatchObject({ fires: 0, frpMw: 0, hectares10d: 0 });
    expect(r.zones[0]).toMatchObject({ areaHa: 0, recent: 0 });
  });
  it("has no period when there is no data", () => {
    expect(buildWeeklyReport(input({ perDay: [] })).period).toBeNull();
  });
});

describe("pdfSafe", () => {
  it("keeps Spanish and Portuguese letters", () => {
    expect(pdfSafe("Pronóstico — niño, ação")).toBe("Pronóstico - niño, ação");
  });
  it("replaces what a standard font cannot draw instead of failing", () => {
    expect(pdfSafe("riesgo ≥ 50 🔥 Привет")).toBe("riesgo ? 50 ? ??????");
  });
  it("collapses odd whitespace", () => {
    expect(pdfSafe("a\n\t b  c")).toBe("a b c");
  });
});

describe("renderWeeklyPdf", () => {
  it("makes a real PDF", async () => {
    const bytes = await renderWeeklyPdf(buildWeeklyReport(input()));
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(2000);
    expect(await pages(bytes)).toBeGreaterThanOrEqual(1);
    expect(await pages(bytes)).toBeLessThanOrEqual(2);
  });
  it("works in every language", async () => {
    for (const locale of ["es", "en", "pt"] as const) {
      const bytes = await renderWeeklyPdf(buildWeeklyReport(input({ locale })));
      const doc = await PDFDocument.load(bytes);
      expect(doc.getTitle(), locale).toContain("-");
      expect(doc.getAuthor()).toBe("Sentinel");
    }
  });
  it("adds pages instead of running off the sheet", async () => {
    const zones = Array.from({ length: 40 }, (_, i) => ({ name: `Zona ${i}`, areaHa: i * 10, recent: i % 3, total: i }));
    const sources = Array.from({ length: 8 }, (_, i) => ({ label: `Fuente ${i}`, ok: i % 2 === 0, ageMin: i * 40 }));
    const bytes = await renderWeeklyPdf(buildWeeklyReport(input({ zones, sources })));
    expect(await pages(bytes)).toBeGreaterThanOrEqual(2);
  });
  it("draws an empty week, no zones and no forecast without failing", async () => {
    const r = buildWeeklyReport(input({ perDay: [], zones: [], incidents: [], forecast: null, sources: [], hectares10d: 0, activeRules: 0 }));
    expect(await pages(await renderWeeklyPdf(r))).toBe(1);
  });
  it("does not choke on names with characters a PDF font cannot draw", async () => {
    const r = buildWeeklyReport(input({ org: "Estancia “La Ñata” 🔥 ≥", zones: [{ name: "Lote Привет — 北", areaHa: 1, recent: 1, total: 1 }], region: "Zona ≥ 5" }));
    await expect(renderWeeklyPdf(r)).resolves.toBeInstanceOf(Uint8Array);
  });
  it("tolerates a bad forecast colour", async () => {
    const r = buildWeeklyReport(input({ forecast: [{ label: "x", score: 10, risk: "r", color: "rgb(1,2,3)" }] }));
    await expect(renderWeeklyPdf(r)).resolves.toBeInstanceOf(Uint8Array);
  });
});

describe("texts", () => {
  it("every wk.* text exists in all languages", () => {
    for (const k of Object.keys(MESSAGES.es).filter((k) => k.startsWith("wk.")))
      for (const l of ["en", "pt"] as const) expect(MESSAGES[l][k as keyof typeof MESSAGES.es], `${l}:${k}`).toBeTruthy();
  });
});
