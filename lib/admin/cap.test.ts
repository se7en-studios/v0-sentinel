// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { toCap } from "./cap";

const base = {
  id: "a<1>",
  sender: "alertas@sentinel.test",
  sent: new Date("2026-10-21T15:04:05.678Z"),
  event: "Incendio forestal",
  headline: "Foco & humo",
  description: "Detección <VIIRS>",
  severity: "Severe" as const,
  urgency: "Immediate" as const,
  certainty: "Likely" as const,
  areaDesc: 'Lote "Norte"',
};

const parse = (xml: string) =>
  new DOMParser().parseFromString(xml, "application/xml");
const text = (d: Document, tag: string) =>
  d.getElementsByTagName(tag)[0]?.textContent;

describe("toCap", () => {
  it("emite los elementos obligatorios de CAP 1.2 y escapa todo", () => {
    const d = parse(
      toCap({
        ...base,
        instruction: "Evacuar & avisar",
        polygon: [
          [-41, -71],
          [-41, -70],
          [-40, -70],
        ],
      }),
    );
    expect(d.getElementsByTagName("parsererror")).toHaveLength(0);
    expect(d.documentElement.namespaceURI).toBe(
      "urn:oasis:names:tc:emergency:cap:1.2",
    );
    for (const t of [
      "identifier",
      "sender",
      "sent",
      "status",
      "msgType",
      "scope",
      "category",
      "event",
      "urgency",
      "severity",
      "certainty",
    ])
      expect(text(d, t), t).toBeTruthy();
    expect(text(d, "identifier")).toBe("a<1>");
    expect(text(d, "sent")).toBe("2026-10-21T15:04:05+00:00");
    expect(text(d, "headline")).toBe("Foco & humo");
    expect(text(d, "instruction")).toBe("Evacuar & avisar");
    expect(text(d, "areaDesc")).toBe('Lote "Norte"');
  });

  it("cierra el anillo del polígono y omite polygon si no hay", () => {
    const poly = text(
      parse(
        toCap({
          ...base,
          polygon: [
            [-41, -71],
            [-41, -70],
            [-40, -70],
          ],
        }),
      ),
      "polygon",
    )!.split(" ");
    expect(poly).toHaveLength(4);
    expect(poly[0]).toBe(poly[3]);
    expect(poly[0]).toBe("-41,-71");
    expect(parse(toCap(base)).getElementsByTagName("polygon")).toHaveLength(0);
  });
});
