import { describe, expect, test } from "vitest";
import { DEFAULT_SETTINGS } from "./types";
import { FLEET, droneTelemetry, hash, riskScore, sensorReading } from "./sim";

describe("sim", () => {
  test("riskScore bounds and labels", () => {
    const lo = riskScore({ temp: -50, rh: 100, wind: 0, rain7d: 500 });
    const hi = riskScore({ temp: 80, rh: 0, wind: 200, rain7d: 0 });
    expect(lo).toEqual({ score: 0, label: "Bajo", color: "#0f7a4f" });
    expect(hi).toEqual({ score: 100, label: "Extremo", color: "#b83a3a" });
    const at = (s: number) =>
      riskScore({
        temp: 10 + 30 * s,
        rh: 60 - 50 * s,
        wind: 50 * s,
        rain7d: 25 * (1 - s),
      });
    expect(at(0.4).label).toBe("Moderado");
    expect(at(0.6).label).toBe("Alto");
    expect(at(0.4).color).toBe("#c9a300");
    expect(at(0.6).color).toBe("#e8710a");
  });

  test("hash is deterministic in [0,1]", () => {
    expect(hash("d1")).toBe(hash("d1"));
    expect(hash("d1")).not.toBe(hash("d2"));
    expect(hash("x")).toBeGreaterThanOrEqual(0);
    expect(hash("x")).toBeLessThanOrEqual(1);
  });

  test("droneTelemetry stays in plausible ranges", () => {
    for (const d of FLEET) {
      const t = droneTelemetry(d, 1_700_000_000_000);
      expect(t.battery).toBeGreaterThanOrEqual(22);
      expect(t.battery).toBeLessThanOrEqual(100);
      expect(t.altitude).toBeGreaterThanOrEqual(85);
      expect(t.altitude).toBeLessThanOrEqual(135);
    }
  });

  test("sensorReading rises with nearby fires and triggers alerts per type", () => {
    const th = DEFAULT_SETTINGS.thresholds;
    const far = sensorReading("s1", "smoke", 0, null, th);
    const near = sensorReading("s1", "smoke", 0, 0, th);
    expect(near.value).toBeGreaterThan(far.value);
    expect(near.alert).toBe(true);
    expect(near.unit).toBe("ppm");
    expect(
      sensorReading("s1", "humidity", 0, 0, { ...th, humidity: 100 }).alert,
    ).toBe(true);
    expect(sensorReading("s1", "wind", 0, 20, { ...th, wind: 0 }).alert).toBe(
      true,
    );
    expect(sensorReading("s1", "temp", 0, 1, { ...th, temp: 0 }).alert).toBe(
      true,
    );
    expect(
      sensorReading("s1", "temp", 0, null, { ...th, temp: 999 }).alert,
    ).toBe(false);
  });
});
