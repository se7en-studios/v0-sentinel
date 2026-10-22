import { describe, expect, it } from "vitest";
import { esc, evidenceHtml, fmtArgentina, summarizeEvidence } from "./report";
import type { FirePoint } from "./types";

const pt = (day: number, hhmm: number): FirePoint => [
  -41,
  -71,
  5,
  1,
  day,
  hhmm,
  0,
];
const days = ["2026-10-19", "2026-10-20", "2026-10-21"];

describe("summarizeEvidence", () => {
  it("halla primera/última detección y cuenta por día", () => {
    const ev = summarizeEvidence(
      [pt(2, 130), pt(0, 1745), pt(2, 5), pt(2, 1900)],
      days,
    );
    expect(ev.first?.toISOString()).toBe("2026-10-19T17:45:00.000Z");
    expect(ev.newest?.toISOString()).toBe("2026-10-21T19:00:00.000Z");
    expect(ev.perDay).toEqual([
      { day: "2026-10-19", count: 1 },
      { day: "2026-10-21", count: 3 },
    ]);
  });

  it("ignora puntos con día desconocido y tolera lista vacía", () => {
    expect(summarizeEvidence([pt(9, 100)], days)).toEqual({
      first: null,
      newest: null,
      perDay: [],
    });
    expect(summarizeEvidence([], days).first).toBeNull();
  });
});

describe("evidenceHtml", () => {
  it("convierte a hora de Argentina (UTC-3) e incluye fuente y descargo", () => {
    expect(fmtArgentina(new Date("2026-10-21T15:00:00Z"))).toContain("12:00");
    const html = evidenceHtml(
      summarizeEvidence([pt(2, 1500)], days),
      new Date("2026-10-21T18:00:00Z"),
    );
    expect(html).toContain("NOAA-20");
    expect(html).toContain("Descargo");
    expect(html).toContain("Primera detección");
  });

  it("sin datos muestra 'sin detecciones' y escapa", () => {
    expect(evidenceHtml(null, new Date())).toContain("sin detecciones");
    expect(esc(`<a href="x">&'`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&#39;",
    );
  });
});
