import type { Translate } from "./i18n";

/** "hace 5 min", "hace 3 h", "hace 2 d" in the interface language (right now when under a minute). */
export function ageText(t: Translate, since: number, now: number): string {
  const min = Math.floor(Math.max(0, now - since) / 60_000);
  if (min < 1) return t("conn.justNow");
  if (min < 60) return t("age.min", { n: min });
  const h = Math.floor(min / 60);
  return h < 48 ? t("age.hour", { n: h }) : t("age.day", { n: Math.floor(h / 24) });
}

/** A length of time ("45 min", "6,5 h", "3 d"), for sentences like "arrives with {t} of delay". */
export function durationText(min: number, locale: string): string {
  if (min < 60) return `${Math.max(1, Math.round(min))} min`;
  const h = min / 60;
  if (h < 48) return `${h.toLocaleString(locale, { maximumFractionDigits: 1 })} h`;
  return `${Math.round(h / 24)} d`;
}
