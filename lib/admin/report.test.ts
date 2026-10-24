// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  alertLinks,
  downloadDataUrl,
  downloadFiresCsv,
  mapsLink,
  printReport,
  type ReportData,
} from "./report";
import type { FirePoint } from "./types";

const data: ReportData = {
  org: `<b>Acme & "Co"</b>`,
  stats: { total: 10, last24: 2, frp: 33, hectares: 140 },
  zones: [{ name: "<script>x</script>", area: "5 ha", recent: 1, total: 3 }],
  clusters: [{ text: "Cerca de <Bariloche>", count: 4, frp: 9 }],
  exposure: "it's <risky>",
};

function fakeWindow() {
  const write = vi.fn();
  const w = { document: { write, close: vi.fn() } };
  vi.spyOn(window, "open").mockReturnValue(w as unknown as Window);
  return write;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("report", () => {
  test("printReport escapes user-controlled text", () => {
    const write = fakeWindow();
    expect(printReport(data)).toBe(true);
    const html = write.mock.calls[0][0] as string;
    expect(html).not.toContain("<script>x");
    expect(html).toContain("&lt;script&gt;x&lt;/script&gt;");
    expect(html).toContain("Acme &amp; &quot;Co&quot;");
    expect(html).toContain("it&#39;s &lt;risky&gt;");
    expect(html).not.toContain("<img");
  });

  test("printReport only embeds well-formed data-URL images and handles empty data", () => {
    const write = fakeWindow();
    printReport({
      ...data,
      zones: [],
      clusters: [],
      exposure: null,
      mapImage: "data:image/png;base64,AAAA",
    });
    let html = write.mock.calls[0][0] as string;
    expect(html).toContain('<img src="data:image/png;base64,AAAA"');
    expect(html).toContain("Sin zonas definidas.");
    expect(html).toContain("Sin concentraciones relevantes.");
    printReport({ ...data, mapImage: 'data:image/png;base64,AA"onerror="x' });
    html = write.mock.calls[1][0] as string;
    expect(html).not.toContain("<img");
  });

  test("printReport returns false when the popup is blocked", () => {
    vi.spyOn(window, "open").mockReturnValue(null);
    expect(printReport(data)).toBe(false);
  });

  test("alertLinks strips non-digits and survives an empty phone", () => {
    const l = alertLinks("fuego & humo", "+54 (294) 15-1234", "a@b.com");
    expect(l.whatsapp).toBe(
      "https://wa.me/54294151234?text=fuego%20%26%20humo",
    );
    expect(l.email).toContain(
      "mailto:a%40b.com?subject=Alerta%20Sentinel&body=fuego%20%26%20humo",
    );
    expect(alertLinks("x", "", "").whatsapp).toBe("https://wa.me/?text=x");
  });

  test("mapsLink rounds to 5 decimals", () => {
    expect(mapsLink(-71.123456789, -41.1)).toBe(
      "https://www.google.com/maps?q=-41.10000,-71.12346",
    );
  });

  test("downloads create and click an anchor", async () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    URL.createObjectURL = vi.fn(() => "blob:x");
    URL.revokeObjectURL = vi.fn();
    vi.useFakeTimers();
    const pts: FirePoint[] = [[-40.5, -70.5, 12, 2, 1, 305, 1]];
    downloadFiresCsv(pts, ["2026-01-01", "2026-01-02"]);
    downloadFiresCsv(pts, ["2026-01-01", "2026-01-02"], "en");
    downloadDataUrl("m.png", "data:image/png;base64,AA");
    expect(click).toHaveBeenCalledTimes(3);
    const csv = await (
      vi.mocked(URL.createObjectURL).mock.calls[1][0] as Blob
    ).text();
    expect(csv).toBe(
      "date_utc,time_utc,lat,lng,frp_mw,confidence,daypart\n2026-01-02,03:05,-40.5,-70.5,12,high,night",
    );
    vi.advanceTimersByTime(2000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:x");
  });
});

describe("incident report helpers", () => {
  const base = { lat: -41.1, lng: -71.3, frp: 3, scans: 4, sources: ["INPE" as const] };

  test("lead time only exists when confirmed after the first scan", async () => {
    const { leadMinutes } = await import("./report");
    expect(leadMinutes({ firstAt: 0, confirmedAt: 90 * 60_000 })).toBe(90);
    expect(leadMinutes({ firstAt: 0 })).toBeNull();
    expect(leadMinutes({ firstAt: 100, confirmedAt: 50 })).toBeNull();
  });

  test("keeps early spots near the incident and drops industrial heat", async () => {
    const { earlyNearby } = await import("./report");
    const near = { ...base, firstAt: 0, lastAt: 1, status: "open" as const };
    const far = { ...near, lat: -35 };
    const noise = { ...near, status: "noise" as const };
    expect(earlyNearby([near, far, noise], -41.1, -71.3)).toEqual([near]);
  });

  test("renders terrain, time gained and the status timeline, escaped", async () => {
    const { incidentExtrasHtml } = await import("./report");
    const html = incidentExtrasHtml({
      terrain: "Bosque <b>",
      early: [{ ...base, firstAt: 0, lastAt: 1, status: "confirmed", confirmedAt: 45 * 60_000 }],
      history: [{ t: 0, by: "<ana>", status: "verified", assignee: "" }],
    });
    expect(html).toContain("Bosque &lt;b&gt;");
    expect(html).toContain("45 min antes");
    expect(html).toContain("Verificado");
    expect(html).not.toContain("<ana>");
    expect(incidentExtrasHtml({ terrain: null, early: [], history: [] })).toContain("Sin cambios de estado");
  });
});

describe("report language", () => {
  const written = (d: ReportData) => {
    const w = { document: { write: vi.fn(), close: vi.fn() } };
    vi.spyOn(window, "open").mockReturnValue(w as unknown as Window);
    printReport(d);
    return String(w.document.write.mock.calls[0][0]);
  };
  test("the printed report is in English or Portuguese when asked, Spanish otherwise", () => {
    const en = written({ ...data, locale: "en" });
    expect(en).toContain('<html lang="en">');
    expect(en).toContain("Monitoring report");
    expect(en).toContain("Print / save as PDF");
    expect(en).not.toMatch(/Reporte|Imprimir|Evidencia|Descargo/);
    expect(written({ ...data, locale: "pt" })).toContain("Relatório de monitoramento");
    expect(written(data)).toContain("Reporte de monitoreo");
  });
  test("incident sections and the alert e-mail subject follow the language", async () => {
    const { incidentExtrasHtml } = await import("./report");
    const html = incidentExtrasHtml({ terrain: null, early: [], history: [] }, "en");
    expect(html).toContain("The terrain could not be checked.");
    expect(html).toContain("No status changes recorded.");
    expect(alertLinks("x", "1", "a@b.c", "Sentinel alert").email).toContain("subject=Sentinel%20alert");
  });
});
