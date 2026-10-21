import { SENSOR_LABEL, type Settings, type SensorType } from "./types";

export interface DroneSpec {
  id: string;
  name: string;
  kind: string;
  speedKmh: number;
  endurance: number; // minutes per charge
}

// ponytail: demo fleet. Sentinel is pre-commercial, so this telemetry is
// simulated and every panel that shows it carries a "simulado" badge.
export const FLEET: DroneSpec[] = [
  {
    id: "d1",
    name: "SNT-D1",
    kind: "Multirrotor · patrulla",
    speedKmh: 38,
    endurance: 42,
  },
  {
    id: "d2",
    name: "SNT-D2",
    kind: "Multirrotor · térmico",
    speedKmh: 32,
    endurance: 38,
  },
  {
    id: "d3",
    name: "SNT-D3",
    kind: "Ala fija · cobertura",
    speedKmh: 62,
    endurance: 85,
  },
  {
    id: "d4",
    name: "SNT-D4",
    kind: "Ala fija · reconocimiento",
    speedKmh: 70,
    endurance: 90,
  },
];

export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++)
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
}

export function droneTelemetry(d: DroneSpec, nowMs: number) {
  const t = nowMs / 1000;
  const seed = hash(d.id);
  const sinceCharge =
    ((t / 60 + seed * d.endurance) % d.endurance) / d.endurance;
  return {
    battery: Math.round(100 - sinceCharge * 78),
    altitude: Math.round(110 + 25 * Math.sin(t / 17 + seed * 9)),
    speed: Math.round(d.speedKmh + 3 * Math.sin(t / 5 + seed * 5)),
    signal: Math.round(-58 - 14 * (0.5 + 0.5 * Math.sin(t / 40 + seed * 7))),
    distKm: (t / 3600) * d.speedKmh,
  };
}

export function sensorReading(
  id: string,
  type: SensorType,
  nowMs: number,
  nearestFireKm: number | null,
  th: Settings["thresholds"],
) {
  const t = nowMs / 1000;
  const s = hash(id);
  const wave = Math.sin(t / 90 + s * 20);
  const jitter = Math.sin(t / 7 + s * 3) * 0.5;
  // Real FIRMS detections within 12 km push the simulated readings up.
  const heat =
    nearestFireKm !== null && nearestFireKm < 12 ? 1 - nearestFireKm / 12 : 0;
  let value: number;
  switch (type) {
    case "temp":
      value = 24 + wave * 5 + jitter + heat * 28;
      break;
    case "humidity":
      value = 42 + wave * 10 + jitter - heat * 30;
      break;
    case "smoke":
      value = 18 + (wave + 1) * 8 + jitter * 3 + heat * 260;
      break;
    default:
      value = 16 + (wave + 1) * 9 + jitter * 2 + heat * 18;
  }
  const alert =
    (type === "temp" && value >= th.temp) ||
    (type === "humidity" && value <= th.humidity) ||
    (type === "smoke" && value >= th.smoke) ||
    (type === "wind" && value >= th.wind);
  return {
    value: Math.round(value * 10) / 10,
    unit: SENSOR_LABEL[type].unit,
    alert,
  };
}

/** Dryness/wind indicator. Reference only, not the official FWI. */
export function riskScore(w: {
  temp: number;
  rh: number;
  wind: number;
  rain7d: number;
}) {
  const t = Math.min(1, Math.max(0, (w.temp - 10) / 30));
  const h = Math.min(1, Math.max(0, (60 - w.rh) / 50));
  const v = Math.min(1, w.wind / 50);
  const r = Math.min(1, w.rain7d / 25);
  const score = Math.round(
    (0.3 * t + 0.35 * h + 0.2 * v + 0.15 * (1 - r)) * 100,
  );
  const label =
    score >= 75
      ? "Extremo"
      : score >= 55
        ? "Alto"
        : score >= 35
          ? "Moderado"
          : "Bajo";
  const color =
    score >= 75
      ? "#b83a3a"
      : score >= 55
        ? "#e8710a"
        : score >= 35
          ? "#c9a300"
          : "#0f7a4f";
  return { score, label, color };
}
