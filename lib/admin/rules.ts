import type { AlertRule } from "./types";
import type { DayForecast } from "./forecast";
import { fwiDanger } from "./fwi";
import { riskLabel, translate, type Locale, type MsgKey } from "./i18n";
import { NUM_LOCALE } from "./i18n-shell";

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

const dayName = (d: DayForecast, locale: Locale) =>
  new Date(`${d.date}T12:00:00`).toLocaleDateString(NUM_LOCALE[locale], {
    weekday: "long",
    day: "numeric",
  });

/** Spanish unless another `locale` is given. */
export function describeRule(
  r: AlertRule,
  zoneName: (id: string) => string,
  locale: Locale = "es",
) {
  const t = (key: MsgKey, vars?: Record<string, string | number>) =>
    translate(locale, key, vars);
  const num = (n: number) => n.toLocaleString(NUM_LOCALE[locale]);
  const where = (zoneId: string) =>
    zoneId ? zoneName(zoneId) : t("rul.anyZone");
  const unit = (days: number) => t(days === 1 ? "rul.day" : "rul.days");
  if (r.kind === "zone_fire")
    return t("rul.d.zone_fire", { n: r.min, where: where(r.zoneId) });
  if (r.kind === "risk")
    return t("rul.d.risk", { score: r.score, days: r.days, unit: unit(r.days) });
  if (r.kind === "early_open")
    return t("rul.d.early_open", { where: where(r.zoneId) });
  if (r.kind === "fwi")
    return t("rul.d.fwi", {
      fwi: r.fwi,
      danger: riskLabel(t, fwiDanger(r.fwi)).toLowerCase(),
      days: r.days,
      unit: unit(r.days),
    });
  if (r.kind === "growth") return t("rul.d.growth", { ha: num(r.ha) });
  return t("rul.d.activity", { n: num(r.focos) });
}

/** Rules that are true right now, as rule id → human detail. Pure. */
export function evaluateRules(
  rules: AlertRule[],
  i: RuleInput,
  locale: Locale = "es",
): Map<string, string> {
  const t = (key: MsgKey, vars?: Record<string, string | number>) =>
    translate(locale, key, vars);
  const num = (n: number) => n.toLocaleString(NUM_LOCALE[locale]);
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
          hits
            .map((z) => t("rul.e.zone", { name: z.name, n: z.recent }))
            .join(" · "),
        );
    } else if (r.kind === "risk") {
      const d = i.forecast?.slice(0, r.days).find((x) => x.score >= r.score);
      if (d)
        firing.set(
          r.id,
          t("rul.e.risk", {
            label: riskLabel(t, d.label),
            score: d.score,
            day: dayName(d, locale),
          }),
        );
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
              return t(n === 1 ? "rul.e.early1" : "rul.e.earlyN", {
                name: z.name,
                n,
              });
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
          t("rul.e.fwi", {
            v: Math.round(d.fwi),
            label: riskLabel(t, fwiDanger(d.fwi)),
            day: dayName(d, locale),
          }),
        );
    } else if (r.kind === "growth") {
      const hits = (i.growth ?? []).filter((g) => g.ha >= r.ha);
      if (hits.length)
        firing.set(
          r.id,
          hits
            .map((g) =>
              t("rul.e.growth", { name: g.name, ha: num(Math.round(g.ha)) }),
            )
            .join(" · "),
        );
    } else if (i.last24 >= r.focos) {
      firing.set(r.id, t("rul.e.activity", { n: num(i.last24) }));
    }
  }
  return firing;
}
