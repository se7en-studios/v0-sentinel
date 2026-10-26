// The text of an alert sent by email or WhatsApp: what happened, when, and what to do. Built from what the
// rule already says on screen (evaluateRules), in the language of the interface. Pure.

import { translate, type Locale, type MsgKey } from "./i18n";
import { NUM_LOCALE } from "./i18n-shell";
import type { AlertRule } from "./types";

export type AlertKind = AlertRule["kind"];

export interface AlertMessage {
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  link?: string;
}

export interface AlertMessageInput {
  kind: AlertKind;
  /** what the rule says right now, e.g. "Lote Norte: 3 focos" */
  detail: string;
  org: string;
  /** name of the map area the person works in */
  region: string;
  locale: Locale;
  /** ms epoch of the moment the rule was met */
  at: number;
  /** https link back to the panel (omitted on http, which the server rejects) */
  link?: string;
}

/** Kinds whose detail already names the places (zones, incidents); the others are about the whole area. */
const NAMES_PLACES: ReadonlySet<AlertKind> = new Set([
  "zone_fire",
  "early_open",
  "growth",
]);

const SEVERITY: Record<AlertKind, AlertMessage["severity"]> = {
  zone_fire: "critical",
  early_open: "warning",
  growth: "warning",
  risk: "warning",
  fwi: "warning",
  activity: "info",
};

// the server caps title at 120 and message at 1000 characters
const TITLE_MAX = 120;
const MESSAGE_MAX = 1000;
const DETAIL_MAX = 500;

const clip = (s: string, max: number) =>
  s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();
const noFinalStop = (s: string) => s.replace(/[.\s]+$/, "");

export function buildAlertMessage(i: AlertMessageInput): AlertMessage {
  const t = (k: MsgKey, vars?: Record<string, string | number>) =>
    translate(i.locale, k, vars);
  const when = new Date(i.at).toLocaleString(NUM_LOCALE[i.locale], {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    // 24 h: "a. m." would end in a full stop and double the one the sentence adds
    hourCycle: "h23",
  });
  const lines = [
    t("msg.what", { detail: noFinalStop(clip(oneLine(i.detail), DETAIL_MAX)) }),
    ...(NAMES_PLACES.has(i.kind)
      ? []
      : [t("msg.where", { region: noFinalStop(oneLine(i.region)) })]),
    t("msg.when", { when: noFinalStop(when) }),
    t(`msg.do.${i.kind}`),
    t("msg.foot"),
  ];
  const org = oneLine(i.org);
  return {
    title: clip(
      org ? `${t(`msg.t.${i.kind}`)} · ${org}` : t(`msg.t.${i.kind}`),
      TITLE_MAX,
    ),
    message: clip(lines.join("\n"), MESSAGE_MAX),
    severity: SEVERITY[i.kind],
    ...(i.link && i.link.startsWith("https://") ? { link: i.link } : {}),
  };
}

/** What the server turns into the single WhatsApp line (same rule as lib/server/notify.ts: title, message, link). */
export function whatsappLine(m: AlertMessage): string {
  return `${oneLine(`${m.title}: ${m.message}`)}${m.link ? ` ${m.link}` : ""}`;
}

/** A believable detail for each kind, built from the same templates the rules use, for the preview. */
export function sampleDetail(kind: AlertKind, locale: Locale, now = Date.now()): string {
  const t = (k: MsgKey, vars?: Record<string, string | number>) =>
    translate(locale, k, vars);
  const zone = t("msg.sampleZone");
  switch (kind) {
    case "zone_fire":
      return t("rul.e.zone", { name: zone, n: 3 });
    case "early_open":
      return t("rul.e.early1", { name: zone, n: 1 });
    case "growth":
      return t("rul.e.growth", {
        name: t("msg.sampleIncident"),
        ha: (120).toLocaleString(NUM_LOCALE[locale]),
      });
    case "risk":
      return t("rul.e.risk", {
        label: t("risk.alto"),
        score: 72,
        day: new Date(now + 86_400_000).toLocaleDateString(
          NUM_LOCALE[locale],
          { weekday: "long" },
        ),
      });
    case "fwi":
      return t("rul.e.fwi", {
        v: 38,
        label: t("risk.muy alto"),
        day: new Date(now + 86_400_000).toLocaleDateString(
          NUM_LOCALE[locale],
          { weekday: "long" },
        ),
      });
    case "activity":
      return t("rul.e.activity", {
        n: (250).toLocaleString(NUM_LOCALE[locale]),
      });
  }
}
