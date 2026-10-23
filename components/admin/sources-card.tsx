"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { NUM_LOCALE } from "@/lib/admin/i18n-shell";
import type { MsgKey, Translate } from "@/lib/admin/i18n";
import { freshness, type Freshness } from "@/lib/admin/metrics";
import type { SourceStatus } from "@/lib/admin/types";
import { Badge, Card } from "./ui";
import type { Ctx } from "./ctx";

type SortKey = "source" | "count" | "last" | "age" | "fresh";
type Sort = { key: SortKey; dir: 1 | -1 };

const FRESH_RANK: Record<Freshness, number> = { ok: 0, late: 1, stale: 2, none: 3 };

/** The same shape and word as the color, so freshness never depends on hue alone. */
const FRESH_STYLE: Record<Freshness, { key: MsgKey; dot: string; ink: string; glyph: string }> = {
  ok: { key: "src.fresh.ok", dot: "bg-[var(--state-ok)]", ink: "text-foreground/80", glyph: "●" },
  late: { key: "src.fresh.late", dot: "bg-[var(--state-warn)]", ink: "text-[var(--state-warn-ink)]", glyph: "◐" },
  stale: { key: "src.fresh.stale", dot: "bg-[var(--state-bad)]", ink: "text-[var(--state-bad-ink)]", glyph: "○" },
  none: { key: "src.fresh.none", dot: "bg-[var(--state-idle)]", ink: "text-foreground/60", glyph: "–" },
};

const artTime = (ms: number, loc: string) =>
  new Date(ms).toLocaleString(loc, {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

const ageLabel = (ms: number, now: number, t: Translate, loc: string) => {
  const min = Math.max(0, Math.round((now - ms) / 60_000));
  if (min < 90) return t("src.min", { n: min });
  const h = min / 60;
  return h < 48
    ? t("src.hour", { n: h.toLocaleString(loc, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) })
    : t("src.day", { n: Math.round(h / 24) });
};

/** Attribution text of each provider; the names are proper nouns, the sentences are translated. */
const LICENSES: { name: string; text: MsgKey }[] = [
  { name: "NASA FIRMS · MODIS (Terra, Aqua) y VIIRS (NOAA-20, NOAA-21)", text: "lic.firms" },
  { name: "NOAA GOES-19 (ABI Fire/Hot Spot)", text: "lic.goes" },
  { name: "INPE · Programa Queimadas", text: "lic.inpe" },
  { name: "Copernicus DEM GLO-30", text: "lic.dem" },
  { name: "ESA WorldCover 10 m (2021)", text: "lic.wc" },
  { name: "Open-Meteo", text: "lic.om" },
];

const sortValue = (s: SourceStatus, key: SortKey, now: number): number | string => {
  switch (key) {
    case "source":
      return s.label;
    case "count":
      return s.count;
    case "last":
      return s.newestAt ?? 0;
    case "age":
      return s.newestAt ? now - s.newestAt : Number.MAX_SAFE_INTEGER;
    case "fresh":
      return FRESH_RANK[freshness(s.id, s.newestAt, now)];
  }
};

/** First click: text A to Z, counts biggest first, times and ages newest first. */
const firstDir = (key: SortKey): 1 | -1 => (key === "count" || key === "last" ? -1 : 1);

function SortHead({
  label,
  col,
  sort,
  onSort,
  t,
  right,
}: {
  label: string;
  col: SortKey;
  sort: Sort;
  onSort: (k: SortKey) => void;
  t: Translate;
  right?: boolean;
}) {
  const on = sort.key === col;
  const Icon = !on ? ChevronsUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      aria-sort={on ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
      className={cn("py-1 pr-3 font-semibold last:pr-0", right && "text-right")}
    >
      <button
        type="button"
        onClick={() => onSort(col)}
        title={t("src.sortBy", { col: label })}
        className={cn(
          "-mx-1 inline-flex min-h-6 items-center gap-1 rounded px-1 uppercase tracking-[0.08em] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          on && "text-foreground",
        )}
      >
        {label}
        <Icon className="size-3" aria-hidden />
      </button>
    </th>
  );
}

export function SourcesCard({ ctx }: { ctx: Ctx }) {
  const { sources, now, earlyError, firesError, t } = ctx;
  const loc = NUM_LOCALE[ctx.ws.settings.locale];
  const [sort, setSort] = useState<Sort>({ key: "age", dir: 1 });
  const onSort = (key: SortKey) =>
    setSort((p) =>
      p.key === key ? { key, dir: p.dir === 1 ? -1 : 1 } : { key, dir: firstDir(key) },
    );
  const rows = [...sources].sort((a, b) => {
    const x = sortValue(a, sort.key, now);
    const y = sortValue(b, sort.key, now);
    const c = typeof x === "string" ? x.localeCompare(String(y)) : x - (y as number);
    return c * sort.dir;
  });
  const newest = (pick: (s: SourceStatus) => boolean) =>
    Math.max(0, ...sources.filter(pick).map((s) => s.newestAt ?? 0));
  const newestGoes = newest((s) => s.id.startsWith("goes"));
  const newestPolar = newest((s) => !s.id.startsWith("goes"));
  const head = (label: string, col: SortKey, right?: boolean) => (
    <SortHead label={label} col={col} sort={sort} onSort={onSort} t={t} right={right} />
  );
  return (
    <Card
      id="fuentes"
      title={t("src.title")}
      right={<Badge tone="muted">{t("src.badge", { n: rows.length })}</Badge>}
    >
      {newestGoes > 0 && newestPolar > 0 && (
        <p className="mb-3 text-[12px] leading-snug text-foreground/70">
          {t("src.compare", {
            goes: ageLabel(newestGoes, now, t, loc),
            polar: ageLabel(newestPolar, now, t, loc),
          })}
        </p>
      )}
      {rows.length === 0 ? (
        <p className="text-[12px] text-foreground/60">
          {firesError ?? earlyError ?? t("src.empty")}
        </p>
      ) : (
        <div className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" tabIndex={0} role="region" aria-label={t("src.caption")}>
          <table className="w-full min-w-[600px] text-left text-[12px]">
            <caption className="sr-only">{t("src.caption")}</caption>
            <thead className="text-[10px] text-foreground/60">
              <tr>
                {head(t("src.col.source"), "source")}
                <th scope="col" className="py-1 pr-3 font-semibold uppercase tracking-[0.08em]">
                  {t("src.col.status")}
                </th>
                {head(t("src.col.fires"), "count", true)}
                {head(t("src.col.last"), "last")}
                {head(t("src.col.age"), "age", true)}
                {head(t("src.col.fresh"), "fresh")}
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const st = FRESH_STYLE[freshness(s.id, s.newestAt, now)];
                return (
                  <tr key={s.id} className="border-t border-[var(--hairline)]">
                    <th scope="row" className="py-1.5 pr-3 font-medium">{s.label}</th>
                    <td className="py-1.5 pr-3">
                      <Badge tone={s.ok ? "ok" : "fire"}>{s.ok ? t("src.active") : t("src.down")}</Badge>
                    </td>
                    <td className="num py-1.5 pr-3 text-right">{s.count.toLocaleString(loc)}</td>
                    <td className="num py-1.5 pr-3">{s.newestAt ? artTime(s.newestAt, loc) : "—"}</td>
                    <td className="num py-1.5 pr-3 text-right">
                      {s.newestAt ? ageLabel(s.newestAt, now, t, loc) : "—"}
                    </td>
                    <td className={cn("py-1.5 font-medium", st.ink)}>
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        <span className={cn("size-2 rounded-full", st.dot)} aria-hidden />
                        <span aria-hidden>{st.glyph}</span>
                        {t(st.key)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2 text-[11px] leading-snug text-foreground/60">{t("src.fresh.note")}</p>
      <details className="mt-3 text-[11.5px] text-foreground/70">
        <summary className="cursor-pointer font-medium text-foreground/85">
          {t("lic.summary")}
        </summary>
        <p className="mt-2 leading-snug">{t("lic.intro")}</p>
        <ul className="mt-2 space-y-1.5">
          {LICENSES.map((l) => (
            <li key={l.name}>
              <b className="text-foreground/85">{l.name}.</b> {t(l.text)}
            </li>
          ))}
          <li>
            <b className="text-foreground/85">{t("lic.base.name")}.</b> {t("lic.base")}
          </li>
        </ul>
      </details>
    </Card>
  );
}
