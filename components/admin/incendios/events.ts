import type { IncidentFire } from "@/lib/incident";
import type { Translate } from "@/lib/admin/i18n";
import { dirLong, fmtHa, fmtKm, fmtRos, fmtTime, satLabel } from "./format";

export type EventTone = "fire" | "warn" | "info" | "calm";

export interface EventView {
  key: string;
  /** engine event kind, so the UI can pick an icon without reading the (translated) title */
  kind: IncidentFire["events"][number]["kind"];
  t: number;
  step: number;
  title: string;
  detail: string;
  tone: EventTone;
  at?: [number, number];
}

const DIR_8 = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];

export function eventViews(fire: IncidentFire, officialStart: number | null, tr: Translate, loc: string): EventView[] {
  return fire.events.map((e, i) => {
    const base = { key: `${e.kind}-${i}`, kind: e.kind, t: e.t, step: e.step, at: e.at };
    switch (e.kind) {
      case "ignicion": {
        const lag = officialStart === null ? 0 : Math.round((e.t - officialStart) / 60_000);
        const vars = { sat: satLabel(fire.ignition.sat), time: fmtTime(e.t, loc), lag };
        return {
          ...base,
          tone: "fire",
          title: tr("trk.ev.ignition"),
          detail: tr(lag > 0 ? "trk.ev.ignition.lag" : "trk.ev.ignition.d", vars),
        };
      }
      case "crecimiento":
        return { ...base, tone: "fire", title: tr("trk.ev.growth"), detail: tr("trk.ev.growth.d", { ha: fmtHa(e.value ?? 0, loc) }) };
      case "avance": {
        const st = fire.steps.find((s) => s.step === e.step);
        const dir = st?.rosDirDeg != null ? DIR_8[Math.round(st.rosDirDeg / 45) % 8] : null;
        return {
          ...base,
          tone: "fire",
          title: tr("trk.ev.spread"),
          detail: `${fmtRos(e.value ?? 0, loc)}${dir ? ` ${tr("trk.toward", { dir: dirLong(tr, dir) })}` : ""}`,
        };
      }
      case "salto":
        return { ...base, tone: "warn", title: tr("trk.ev.jump"), detail: tr("trk.ev.jump.d", { km: fmtKm((e.value ?? 0) / 1000, loc) }) };
      case "reactivacion":
        return { ...base, tone: "warn", title: tr("trk.ev.react"), detail: tr(e.value === 1 ? "trk.ev.react.one" : "trk.ev.react.other", { n: e.value ?? "" }) };
      case "fusion":
        return { ...base, tone: "info", title: tr("trk.ev.merge", { ref: e.ref ?? "" }), detail: tr("trk.ev.merge.d") };
      case "latente":
        return { ...base, tone: "calm", title: tr("trk.ev.latent"), detail: tr("trk.ev.latent.d") };
      case "extincion":
        return { ...base, tone: "calm", title: tr("trk.ev.out"), detail: tr("trk.ev.out.d") };
    }
  });
}
