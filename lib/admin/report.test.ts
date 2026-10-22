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

  test("downloads create and click an anchor", () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    URL.createObjectURL = vi.fn(() => "blob:x");
    URL.revokeObjectURL = vi.fn();
    vi.useFakeTimers();
    const pts: FirePoint[] = [[-40.5, -70.5, 12, 2, 1, 305, 1]];
    downloadFiresCsv(pts, ["2026-01-01", "2026-01-02"]);
    downloadDataUrl("m.png", "data:image/png;base64,AA");
    expect(click).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(2000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:x");
  });
});
