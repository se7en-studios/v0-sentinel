import type { FireCluster, SourceStatus } from "./types";
import type { DayForecast } from "./forecast";
import { riskLabel, translate, type Locale, type MsgKey } from "./i18n";
import { NUM_LOCALE } from "./i18n-shell";

export interface BriefingInput {
  org: string;
  now: Date;
  last24: number;
  total10d: number;
  frpMw: number;
  zones: { name: string; recent: number }[];
  clusters: FireCluster[];
  today?: DayForecast;
  best?: DayForecast;
  worst?: DayForecast;
  /** GOES early alerts still waiting for a polar pass to confirm them */
  earlyOpen?: number;
  /** labels of the feeds that failed or are behind (see delayedSources) */
  delayed?: string[];
}

const GOES_STALE_MS = 3600_000; // GOES scans every 10 min: an hour without news is a delay
const POLAR_STALE_MS = 12 * 3600_000; // polar satellites pass a few times a day

/** Feeds that answered with an error, or whose newest acquisition is older than their normal rhythm. */
export function delayedSources(sources: SourceStatus[], now: number): string[] {
  return sources
    .filter((s) => {
      if (!s.ok) return true;
      if (!s.newestAt) return false;
      const limit = s.id.startsWith("goes") ? GOES_STALE_MS : POLAR_STALE_MS;
      return now - s.newestAt > limit;
    })
    .map((s) => s.label);
}

export interface Briefing {
  /** Plain text, ready for WhatsApp / email. */
  text: string;
  tone: "alert" | "watch" | "calm";
  headline: string;
  points: string[];
  actions: string[];
}

/** Rule-based daily summary from the data the panel already holds. No LLM, so it is instant and offline-safe. Spanish unless another `locale` is given. */
export function buildBriefing(i: BriefingInput, locale: Locale = "es"): Briefing {
  const loc = NUM_LOCALE[locale];
  const t = (key: MsgKey, vars?: Record<string, string | number>) =>
    translate(locale, key, vars);
  const n = (v: number) => v.toLocaleString(loc);
  const day = (d: DayForecast) =>
    new Date(`${d.date}T12:00:00`).toLocaleDateString(loc, {
      weekday: "long",
      day: "numeric",
    });
  const label = (d: DayForecast) => riskLabel(t, d.label).toLowerCase();
  const hitZones = i.zones.filter((z) => z.recent > 0);
  const highRisk = (i.today?.score ?? 0) >= 55;
  const early = i.earlyOpen ?? 0;
  const tone: Briefing["tone"] =
    hitZones.length > 0
      ? "alert"
      : highRisk || i.last24 > 0 || early > 0
        ? "watch"
        : "calm";

  const headline =
    tone === "alert"
      ? hitZones.length === 1
        ? t("brf.h.alert1")
        : t("brf.h.alertN", { n: hitZones.length })
      : tone === "watch"
        ? highRisk
          ? t("brf.h.high")
          : t("brf.h.thermal")
        : t("brf.h.calm");

  const points = [
    t("brf.p.national", {
      a: n(i.last24),
      b: n(i.total10d),
      mw: n(Math.round(i.frpMw)),
    }),
  ];
  for (const z of hitZones)
    points.push(t("brf.p.zone", { name: z.name, n: z.recent }));
  const top = [...i.clusters].sort((a, b) => b.count - a.count)[0];
  if (top && top.count >= 3)
    points.push(t("brf.p.top", { n: top.count, km: top.km, near: top.near }));
  if (i.today)
    points.push(
      t("brf.p.risk", {
        label: label(i.today),
        score: i.today.score,
        tmax: Math.round(i.today.tmax),
        rh: Math.round(i.today.rhmin),
        wind: Math.round(i.today.wind),
        fwi:
          i.today.fwi === undefined
            ? ""
            : t("brf.p.fwi", {
                v: Math.round(i.today.fwi),
                label: riskLabel(t, i.today.fwiLabel ?? "").toLowerCase(),
              }),
      }),
    );
  if (early > 0)
    points.push(t(early === 1 ? "brf.p.early1" : "brf.p.earlyN", { n: early }));
  if (i.delayed?.length)
    points.push(t("brf.p.delayed", { list: i.delayed.join(", ") }));
  if (i.worst && i.worst.score >= 55)
    points.push(
      t("brf.p.worst", {
        day: day(i.worst),
        label: label(i.worst),
        score: i.worst.score,
      }),
    );

  const actions: string[] = [];
  for (const z of hitZones) actions.push(t("brf.a.verify", { name: z.name }));
  if (early > 0) actions.push(t("brf.a.early"));
  if (highRisk) actions.push(t("brf.a.avoid"));
  else if (i.best && i.best.score < 35)
    actions.push(t("brf.a.best", { day: day(i.best) }));
  if (actions.length === 0) actions.push(t("brf.a.none"));

  const date = i.now.toLocaleDateString(loc, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const text = [
    `*Briefing Sentinel${i.org ? ` · ${i.org}` : ""}* — ${date}`,
    headline,
    "",
    ...points.map((p) => `• ${p}`),
    "",
    t("brf.t.actions"),
    ...actions.map((a) => `→ ${a}`),
  ].join("\n");

  return { text, tone, headline, points, actions };
}
