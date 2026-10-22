import { describe, expect, it } from "vitest";
import { inpeStatuses, parseInpePolar } from "./inpe-fires";

const DAILY =
  "id,lat,lon,data_hora_gmt,satelite,municipio,estado,pais,municipio_id,estado_id,pais_id,numero_dias_sem_chuva,precipitacao,risco_fogo,bioma,frp\n" +
  "a, -24.77, -60.70,2026-10-21 00:07:00,NOAA-20,X,Y,Argentina,1,2,3,4,0,1,,37.8\n" +
  "b, -25.61, -61.33,2026-10-21 01:00:00,GOES-19,X,Y,Argentina,1,2,3,4,0,1,,106.4\n" +
  "c, -30.10, -62.00,2026-10-21 17:45:00,AQUA_M-T,X,Y,Argentina,1,2,3,4,0,1,,\n" +
  "d, -31.00, -63.00,2026-10-21 17:45:00,NPP-375D,X,Y,Argentina,1,2,3,4,0,1,,5\n" +
  "e, oops, -63.00,2026-10-21 17:45:00,NOAA-21,X,Y,Argentina,1,2,3,4,0,1,,5";
const TEN = "lat,lon,satelite,data\n -25.2, -65.3,NOAA-21,2026-10-22 18:40:00";

describe("parseInpePolar", () => {
  it("keeps polar satellites, drops GOES and broken rows", () => {
    const rows = parseInpePolar(DAILY);
    expect(rows.map((r) => r.sat)).toEqual([0, 3, 4]);
    expect(rows[0]).toMatchObject({
      lat: -24.77,
      lng: -60.7,
      date: "2026-10-21",
      time: 7,
      frp: 37.8,
      conf: 1,
      at: Date.parse("2026-10-21T00:07:00Z"),
    });
    expect(rows[1].frp).toBe(0);
  });
  it("also reads the 10-minute layout", () => {
    expect(parseInpePolar(TEN).map((r) => [r.sat, r.time])).toEqual([
      [1, 1840],
    ]);
  });
  it("returns nothing for unrelated text", () => {
    expect(parseInpePolar("")).toEqual([]);
    expect(parseInpePolar("<html>404</html>")).toEqual([]);
  });
});

describe("inpeStatuses", () => {
  it("labels every feed as a backup and counts per satellite", () => {
    const s = inpeStatuses(parseInpePolar(DAILY), true);
    expect(s.every((x) => x.label.endsWith("respaldo INPE"))).toBe(true);
    expect(s.find((x) => x.id === "inpe-n20")?.count).toBe(1);
    expect(s.find((x) => x.id === "inpe-terra")?.count).toBe(0);
  });
});
