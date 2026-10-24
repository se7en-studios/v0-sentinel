import type { IncidentFire } from "@/lib/incident";
import { dirLong, fmtHa, fmtKm, fmtRos, fmtTime, satLabel } from "./format";

export type EventTone = "fire" | "warn" | "info" | "calm";

export interface EventView {
  key: string;
  t: number;
  step: number;
  title: string;
  detail: string;
  tone: EventTone;
  at?: [number, number];
}

const DIR_8 = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];

export function eventViews(fire: IncidentFire, officialStart: number | null): EventView[] {
  return fire.events.map((e, i) => {
    const base = { key: `${e.kind}-${i}`, t: e.t, step: e.step, at: e.at };
    switch (e.kind) {
      case "ignicion": {
        const lag = officialStart === null ? 0 : Math.round((e.t - officialStart) / 60_000);
        return {
          ...base,
          tone: "fire",
          title: "Ignición detectada",
          detail: `${satLabel(fire.ignition.sat)} a las ${fmtTime(e.t)}${lag > 0 ? `, ${lag} min después del inicio oficial` : ""}`,
        };
      }
      case "crecimiento":
        return { ...base, tone: "fire", title: "Crecimiento explosivo", detail: `+${fmtHa(e.value ?? 0)} en 12 h` };
      case "avance": {
        const st = fire.steps.find((s) => s.step === e.step);
        const dir = st?.rosDirDeg != null ? DIR_8[Math.round(st.rosDirDeg / 45) % 8] : null;
        return {
          ...base,
          tone: "fire",
          title: "Avance más rápido",
          detail: `${fmtRos(e.value ?? 0)}${dir ? ` hacia el ${dirLong(dir)}` : ""}`,
        };
      }
      case "salto":
        return { ...base, tone: "warn", title: "Posible salto de fuego", detail: `Foco aislado a ${fmtKm((e.value ?? 0) / 1000)} del perímetro` };
      case "reactivacion":
        return { ...base, tone: "warn", title: "Reactivación", detail: `${e.value ?? ""} focos tras días sin calor` };
      case "fusion":
        return { ...base, tone: "info", title: `Se une el incendio #${e.ref}`, detail: "Los perímetros se tocaron" };
      case "latente":
        return { ...base, tone: "calm", title: "Sin detecciones por 5 días", detail: "Pasa a latente (regla FEDS)" };
      case "extincion":
        return { ...base, tone: "calm", title: "Sin detecciones por 20 días", detail: "Se considera extinguido" };
    }
  });
}
