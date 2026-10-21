import type { AlertRule } from "./types";
import type { DayForecast } from "./forecast";

export const MAX_RULES = 20;

export interface RuleInput {
  zones: { id: string; name: string; recent: number }[];
  last24: number;
  forecast?: DayForecast[] | null;
}

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
    } else if (i.last24 >= r.focos) {
      firing.set(r.id, `${i.last24.toLocaleString("es-AR")} focos en 24 h`);
    }
  }
  return firing;
}
