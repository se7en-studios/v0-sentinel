// The data behind the weekly report: the last seven days, the person's zones, the biggest fires, the forecast and
// the state of the data. Pure: it takes what the panel already computed and returns what the PDF draws.

import type { Locale } from "./i18n";

export const WEEK_DAYS = 7;
export const ZONES_MAX = 12;
export const INCIDENTS_MAX = 5;
export const SOURCES_MAX = 8;

export interface WeeklyInput {
  org: string;
  region: string;
  locale: Locale;
  /** ms epoch of the moment the report is made */
  now: number;
  /** detections per day, oldest first (the panel keeps 10 days) */
  perDay: { label: string; count: number; frp: number }[];
  /** estimated burned area over the whole 10-day window */
  hectares10d: number;
  zones: { name: string; areaHa: number; recent: number; total: number }[];
  incidents: {
    place: string;
    areaHa: number;
    fires: number;
    frp: number;
    daysActive: number;
  }[];
  forecast:
    { label: string; score: number; risk: string; color: string }[] | null;
  sources: { label: string; ok: boolean; ageMin?: number }[];
  activeRules: number;
}

export interface WeeklyReport {
  org: string;
  region: string;
  locale: Locale;
  generatedAt: number;
  /** labels of the first and last day shown */
  period: { from: string; to: string } | null;
  days: { label: string; count: number }[];
  totals: {
    fires: number;
    frpMw: number;
    hectares10d: number;
    zonesHit: number;
    zones: number;
  };
  zones: { name: string; areaHa: number; recent: number; total: number }[];
  zonesOmitted: number;
  incidents: WeeklyInput["incidents"];
  forecast: WeeklyInput["forecast"];
  sources: WeeklyInput["sources"];
  activeRules: number;
}

const num = (v: unknown): number =>
  typeof v === "number" && Number.isFinite(v) ? v : 0;
const text = (v: unknown, max: number): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export function buildWeeklyReport(i: WeeklyInput): WeeklyReport {
  const days = i.perDay
    .slice(-WEEK_DAYS)
    .map((d) => ({
      label: text(d.label, 12),
      count: Math.max(0, num(d.count)),
      frp: Math.max(0, num(d.frp)),
    }));
  const zones = i.zones
    .map((z) => ({
      name: text(z.name, 60),
      areaHa: Math.max(0, num(z.areaHa)),
      recent: Math.max(0, num(z.recent)),
      total: Math.max(0, num(z.total)),
    }))
    .sort(
      (a, b) => b.recent - a.recent || b.total - a.total || b.areaHa - a.areaHa,
    );
  return {
    org: text(i.org, 80),
    region: text(i.region, 80),
    locale: i.locale,
    generatedAt: i.now,
    period: days.length
      ? { from: days[0].label, to: days[days.length - 1].label }
      : null,
    days: days.map(({ label, count }) => ({ label, count })),
    totals: {
      fires: days.reduce((s, d) => s + d.count, 0),
      frpMw: Math.round(days.reduce((s, d) => s + d.frp, 0)),
      hectares10d: Math.round(Math.max(0, num(i.hectares10d))),
      zonesHit: zones.filter((z) => z.recent > 0).length,
      zones: zones.length,
    },
    zones: zones.slice(0, ZONES_MAX),
    zonesOmitted: Math.max(0, zones.length - ZONES_MAX),
    incidents: [...i.incidents]
      .sort((a, b) => num(b.areaHa) - num(a.areaHa))
      .slice(0, INCIDENTS_MAX)
      .map((x) => ({
        place: text(x.place, 60),
        areaHa: Math.max(0, num(x.areaHa)),
        fires: Math.max(0, num(x.fires)),
        frp: Math.max(0, num(x.frp)),
        daysActive: Math.max(0, num(x.daysActive)),
      })),
    forecast: i.forecast
      ? i.forecast
          .slice(0, WEEK_DAYS)
          .map((f) => ({
            label: text(f.label, 12),
            score: Math.min(100, Math.max(0, num(f.score))),
            risk: text(f.risk, 20),
            color: text(f.color, 9),
          }))
      : null,
    sources: i.sources
      .slice(0, SOURCES_MAX)
      .map((s) => ({
        label: text(s.label, 60),
        ok: s.ok === true,
        ...(typeof s.ageMin === "number" && Number.isFinite(s.ageMin)
          ? { ageMin: Math.max(0, s.ageMin) }
          : {}),
      })),
    activeRules: Math.max(0, Math.round(num(i.activeRules))),
  };
}
