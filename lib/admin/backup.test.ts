import { describe, expect, it } from "vitest";
import { buildBackup, readBackup } from "./backup";
import { parseWorkspace } from "./store";

describe("backup", () => {
  it("round-trips a workspace", () => {
    const ws = parseWorkspace({
      features: [
        {
          type: "Feature",
          id: "z1",
          properties: { mode: "zone-polygon" },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [-70, -40],
                [-70, -39],
                [-69, -39],
                [-70, -40],
              ],
            ],
          },
        },
      ],
      meta: { z1: { name: "Campo norte" } },
      settings: { org: "Estancia", locale: "pt" },
    });
    const back = readBackup(buildBackup(ws));
    expect(back.features).toHaveLength(1);
    expect(back.meta.z1.name).toBe("Campo norte");
    expect(back.settings.org).toBe("Estancia");
    expect(back.settings.locale).toBe("pt");
  });

  it("rejects files that are not a backup", () => {
    expect(() =>
      readBackup('{"type":"FeatureCollection","features":[]}'),
    ).toThrow();
    expect(() => readBackup("no es json")).toThrow();
    expect(() => readBackup("null")).toThrow();
  });
});
