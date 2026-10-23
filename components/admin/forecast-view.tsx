"use client";

import { useEffect, useMemo, useState } from "react";
import { CloudOff } from "lucide-react";
import { centerOf } from "@/lib/admin/geo";
import { fetchForecast, type DayForecast } from "@/lib/admin/forecast";
import { compass } from "@/lib/admin/weather";
import { riskLabel, type MsgKey } from "@/lib/admin/i18n";
import { NUM_LOCALE } from "@/lib/admin/i18n-shell";
import { MODE_ROLE } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import type { Ctx } from "./ctx";
import { BriefingCard } from "./briefing-card";
import {
  Badge,
  Btn,
  Card,
  EmptyState,
  ErrorState,
  KV,
  Skeleton,
  Stat,
  ViewSkeleton,
} from "./ui";

const MAX_ZONES = 8;
/** FWI from which the day is flagged as dangerous (Muy alto) */
const FWI_HIGH = 20;
const REGION_ROW = "__region";

interface Row {
  id: string;
  name: string;
  days: DayForecast[] | null;
}

const weekday = (date: string, loc: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString(loc, {
    weekday: "short",
    day: "numeric",
  });

/** 7-day fire-danger outlook for the viewed region and each monitored zone (Open-Meteo). */
export function ForecastView({ ctx }: { ctx: Ctx }) {
  const { ws, center, t } = ctx;
  const loc = NUM_LOCALE[ws.settings.locale];
  const nameOf = (r: Row) =>
    r.id === REGION_ROW ? t("fc.region") : r.name || t("res.zone");
  const lbl = (s: string | undefined) => riskLabel(t, s ?? "");
  const zones = useMemo(
    () =>
      ws.features
        .filter((f) => MODE_ROLE[String(f.properties.mode)] === "zone")
        .slice(0, MAX_ZONES),
    [ws.features],
  );
  const [rows, setRows] = useState<Row[] | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [sel, setSel] = useState<{ row: string; day: number }>({
    row: REGION_ROW,
    day: 0,
  });

  useEffect(() => {
    let cancelled = false;
    const targets = [
      { id: REGION_ROW, name: "", at: center },
      ...zones.map((z) => ({
        id: z.id,
        name: ws.meta[z.id]?.name ?? "",
        at: centerOf(z),
      })),
    ];
    Promise.all(
      targets.map(async (t) => ({
        id: t.id,
        name: t.name,
        days: await fetchForecast(t.at[1], t.at[0]),
      })),
    ).then((r) => !cancelled && setRows(r));
    return () => {
      cancelled = true;
    };
  }, [zones, ws.meta, center, attempt]);

  const active = rows?.find((r) => r.id === sel.row) ?? rows?.[0];
  const day = active?.days?.[sel.day];
  const regionDays = rows?.[0]?.days;
  const region = regionDays?.length ? regionDays : null;
  const worst = region?.reduce((a, d) => (d.score > a.score ? d : a));
  const best = region?.reduce((a, d) => (d.score < a.score ? d : a));

  // the briefing and the zone counts need the detection feed: never leave this blank
  if (!ctx.payload && ctx.firesError)
    return (
      <ErrorState
        message={ctx.firesError}
        onRetry={ctx.reload}
        loading={ctx.loading}
      />
    );
  if (!ctx.payload && ctx.loading) return <ViewSkeleton />;

  return (
    <div className="view-in mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
      {ctx.firesError && (
        <ErrorState
          compact
          message={t("ui.showingLast", { error: ctx.firesError })}
          onRetry={ctx.reload}
          loading={ctx.loading}
        />
      )}
      <div>
        <h1 className="font-heading text-2xl font-bold">
          {t("fc.title")}
        </h1>
        <p className="text-[13px] text-foreground/55">
          {t("fc.intro")}
        </p>
      </div>

      {rows && <BriefingCard ctx={ctx} forecast={region} />}

      {!rows ? (
        <Skeleton className="h-64 w-full" />
      ) : !region ? (
        <EmptyState icon={<CloudOff className="size-5" />} title={t("fc.none")}
          action={
            <Btn
              onClick={() => {
                setRows(null);
                setAttempt((n) => n + 1);
              }}
            >
              {t("ui.retry")}
            </Btn>
          }
        >
          {t("fc.noneBody")}
        </EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card>
              <Stat
                label={t("fc.today")}
                value={lbl(region[0].label)}
                sub={
                  region[0].fwi === undefined
                    ? t("fc.idx", { s: region[0].score })
                    : t("fc.idxFwi", {
                        s: region[0].score,
                        v: Math.round(region[0].fwi),
                        label: lbl(region[0].fwiLabel).toLowerCase(),
                      })
                }
                tone={region[0].score >= 55 ? "fire" : "ok"}
              />
            </Card>
            <Card>
              <Stat
                label={t("fc.worst")}
                value={worst ? weekday(worst.date, loc) : "—"}
                sub={worst ? t("fc.worstSub", { label: lbl(worst.label), score: worst.score }) : undefined}
                tone={worst && worst.score >= 55 ? "fire" : undefined}
              />
            </Card>
            <Card>
              <Stat
                label={t("fc.best")}
                value={best ? weekday(best.date, loc) : "—"}
                sub={t("fc.bestSub")}
                tone="ok"
              />
            </Card>
            <Card>
              <Stat
                label={t("fc.zonesHigh")}
                value={
                  rows
                    .slice(1)
                    .filter((r) => r.days?.some((d) => d.score >= 55)).length
                }
                sub={t("fc.zonesHighSub", { n: rows.length - 1 })}
              />
            </Card>
          </div>

          <Card title={t("fc.heat")}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-separate border-spacing-1 text-[12px]">
                <thead>
                  <tr>
                    <th className="w-40" />
                    {region.map((d) => (
                      <th
                        key={d.date}
                        scope="col"
                        className="pb-1 text-[10.5px] font-medium capitalize text-foreground/60"
                      >
                        {weekday(d.date, loc)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <th
                        scope="row"
                        className="max-w-40 truncate pr-2 text-left text-[12px] font-medium"
                      >
                        {nameOf(r)}
                      </th>
                      {(r.days ?? region).map((d, i) => {
                        const on = sel.row === r.id && sel.day === i;
                        return (
                          <td key={d.date} className="p-0">
                            <button
                              type="button"
                              disabled={!r.days}
                              onClick={() => setSel({ row: r.id, day: i })}
                              aria-pressed={on}
                              aria-label={`${nameOf(r)}, ${weekday(d.date, loc)}: ${r.days ? t("fc.cellState", { label: lbl(d.label), score: d.score }) : t("fc.noData")}`}
                              className={cn(
                                "num h-11 w-full rounded-md text-[12px] font-semibold transition-[transform,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30",
                                on && "scale-[1.04] ring-2 ring-foreground/70",
                              )}
                              style={{
                                background: `${d.color}26`,
                                color: d.color,
                              }}
                            >
                              {r.days ? (
                                <>
                                  {d.score}
                                  <span className="block text-[9px] font-medium leading-none">
                                    {lbl(d.label)}
                                  </span>
                                </>
                              ) : (
                                "—"
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length === 1 && (
              <p className="mt-2 text-[12px] text-foreground/60">
                {t("fc.emptyZones")}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-foreground/60">
              {[
                ["risk.bajo", "var(--state-ok)", "0-34"],
                ["risk.moderado", "var(--state-warn)", "35-54"],
                ["risk.alto", "var(--state-watch)", "55-74"],
                ["risk.extremo", "var(--state-bad)", "75-100"],
              ].map(([l, c, range]) => (
                <span key={l} className="flex items-center gap-1.5">
                  <span
                    className="size-2.5 rounded-sm"
                    style={{ background: c }}
                    aria-hidden
                  />
                  {t(l as MsgKey)} <span className="num text-foreground/45">{range}</span>
                </span>
              ))}
              <span className="ml-auto">
                {t("fc.legendNote")}
              </span>
            </div>
          </Card>

          {active && day && (
            <Card
              title={`${nameOf(active)} · ${weekday(day.date, loc)}`}
              right={
                <Badge tone={day.score >= 55 ? "fire" : "ok"}>
                  {lbl(day.label)}
                </Badge>
              }
            >
              <dl className="grid gap-x-8 sm:grid-cols-2">
                <div>
                  <KV k={t("fc.tmax")}>
                    <span className="num">{Math.round(day.tmax)} °C</span>
                  </KV>
                  <KV k={t("fc.rhmin")}>
                    <span className="num">{Math.round(day.rhmin)} %</span>
                  </KV>
                </div>
                <div>
                  <KV k={t("fc.windmax")}>
                    <span className="num">
                      {Math.round(day.wind)} km/h · {t(`dir.${compass(day.windDir)}` as MsgKey)}
                    </span>
                  </KV>
                  <KV k={t("fc.rainDay")}>
                    <span className="num">{day.rain.toFixed(1)} mm</span>
                  </KV>
                </div>
              </dl>
              {day.fwi !== undefined && (
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--hairline)] pt-2 text-[12.5px]">
                  <span className="text-foreground/65">
                    {t("fc.fwi")}
                  </span>
                  <span className="num font-semibold">{day.fwi.toFixed(1)}</span>
                  <Badge tone={day.fwi >= FWI_HIGH ? "fire" : "ok"}>
                    {lbl(day.fwiLabel)}
                  </Badge>
                  <span className="text-[11px] text-foreground/50">
                    {t("risk.bajo")} &lt; 5 · {t("risk.moderado")} &lt; 10 · {t("risk.alto")} &lt; 20 · {t("risk.muy alto")} &lt; 30 · {t("risk.extremo")}
                  </span>
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
