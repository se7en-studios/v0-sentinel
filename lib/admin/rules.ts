import type { AlertRule } from "./types";
import type { DayForecast } from "./forecast";
import { fwiDanger } from "./fwi";

export const MAX_RULES = 20;

export interface RuleInput {
  zones: { id: string; name: string; recent: number }[];
  last24: number;
  forecast?: DayForecast[] | null;
  /** open GOES early alerts (not yet confirmed by a polar pass) per zone id */
  earlyOpen?: Record<string, number>;
  /** incidents with the hectares they gained in their latest day of data */
  growth?: { name: string; ha: number }[];
}

/** FWI "Muy alto" starts here; the default of the FWI rule. */
export const FWI_VERY_HIGH = 20;

const num = (v: unknown, lo: number, hi: number, d: number) => {
  const x = Number(v);
  return Number.isFinite(x) ? Math.min(hi, Math.max(lo, Math.round(x))) : d;
};

/** Drops anything malformed that came back from storage; never throws. */
export function cleanRules(input: unknown): AlertRule[] {
  if (!Array.isArray(input)) return [];
  const out: AlertRule[] = [];
  for (const r of input.slice(0, MAX_RULES)) {
    if (!r || typeof r !== "object" || typeof r.id !== "string") continue;
    const base = { id: r.id.slice(0, 40), enabled: r.enabled !== false };
    if (r.kind === "zone_fire")
      out.push({
        ...base,
        kind: "zone_fire",
        zoneId: typeof r.zoneId === "string" ? r.zoneId : "",
        min: num(r.min, 1, 99, 1),
      });
    else if (r.kind === "risk")
      out.push({
        ...base,
        kind: "risk",
        score: num(r.score, 10, 100, 55),
        days: num(r.days, 1, 7, 3),
      });
    else if (r.kind === "activity")
      out.push({
        ...base,
        kind: "activity",
        focos: num(r.focos, 1, 99_999, 100),
      });
    else if (r.kind === "early_open")
      out.push({
        ...base,
        kind: "early_open",
        zoneId: typeof r.zoneId === "string" ? r.zoneId : "",
      });
    else if (r.kind === "fwi")
      out.push({
        ...base,
        kind: "fwi",
        fwi: num(r.fwi, 5, 100, FWI_VERY_HIGH),
        days: num(r.days, 1, 7, 3),
      });
    else if (r.kind === "growth")
      out.push({ ...base, kind: "growth", ha: num(r.ha, 1, 99_999, 100) });
  }
  return out;
}

const dayName = (d: DayForecast) =>
  new Date(`${d.date}T12:00:00`).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
  });

export function describeRule(r: AlertRule, zoneName: (id: string) => string) {
  if (r.kind === "zone_fire")
    return `${r.min}+ detecciones en 48 h en ${r.zoneId ? zoneName(r.zoneId) : "cualquier zona"}`;
  if (r.kind === "risk")
    return `Riesgo meteorológico ≥ ${r.score} en los próximos ${r.days} ${r.days === 1 ? "día" : "días"}`;
  if (r.kind === "early_open")
    return `Alerta temprana sin confirmar en ${r.zoneId ? zoneName(r.zoneId) : "cualquier zona"}`;
  if (r.kind === "fwi")
    return `FWI ≥ ${r.fwi} (${fwiDanger(r.fwi).toLowerCase()}) en los próximos ${r.days} ${r.days === 1 ? "día" : "días"}`;
  if (r.kind === "growth")
    return `Un incidente creció ${r.ha.toLocaleString("es-AR")}+ ha en el último día`;
  return `${r.focos.toLocaleString("es-AR")}+ focos en 24 h en Argentina`;
}

/** Rules that are true right now, as rule id → human detail. Pure. */
export function evaluateRules(
  rules: AlertRule[],
  i: RuleInput,
): Map<string, string> {
  const firing = new Map<string, string>();
  for (const r of rules) {
    if (!r.enabled) continue;
    if (r.kind === "zone_fire") {
      const hits = i.zones.filter(
        (z) => (!r.zoneId || z.id === r.zoneId) && z.recent >= r.min,
      );
      if (hits.length)
        firing.set(
          r.id,
          hits.map((z) => `${z.name}: ${z.recent} detecciones`).join(" · "),
        );
    } else if (r.kind === "risk") {
      const d = i.forecast?.slice(0, r.days).find((x) => x.score >= r.score);
      if (d) firing.set(r.id, `${d.label} (${d.score}/100) el ${dayName(d)}`);
    } else if (r.kind === "early_open") {
      const hits = i.zones.filter(
        (z) =>
          (!r.zoneId || z.id === r.zoneId) && (i.earlyOpen?.[z.id] ?? 0) > 0,
      );
      if (hits.length)
        firing.set(
          r.id,
          hits
            .map((z) => {
              const n = i.earlyOpen?.[z.id] ?? 0;
              return `${z.name}: ${n} ${n === 1 ? "alerta temprana" : "alertas tempranas"} sin confirmar`;
            })
            .join(" · "),
        );
    } else if (r.kind === "fwi") {
      const d = i.forecast
        ?.slice(0, r.days)
        .find((x) => (x.fwi ?? -1) >= r.fwi);
      if (d?.fwi !== undefined)
        firing.set(
          r.id,
          `FWI ${Math.round(d.fwi)} (${fwiDanger(d.fwi)}) el ${dayName(d)}`,
        );
    } else if (r.kind === "growth") {
      const hits = (i.growth ?? []).filter((g) => g.ha >= r.ha);
      if (hits.length)
        firing.set(
          r.id,
          hits
            .map(
              (g) =>
                `${g.name}: +${Math.round(g.ha).toLocaleString("es-AR")} ha`,
            )
            .join(" · "),
        );
    } else if (i.last24 >= r.focos) {
      firing.set(r.id, `${i.last24.toLocaleString("es-AR")} focos en 24 h`);
    }
  }
  return firing;
}
