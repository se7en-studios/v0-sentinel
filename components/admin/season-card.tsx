"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MIN_AVG_TOTAL,
  compareSeason,
  parseHistory,
  windowDates,
  type Comparison,
  type HistoryView,
} from "@/lib/admin/history-compare";
import type { MsgKey } from "@/lib/admin/i18n";
import type { Ctx } from "./ctx";
import { Badge, Btn, Card, ChartFrame } from "./ui";

const W = 600;
const H = 180;
const PAD = { l: 38, r: 8, t: 10, b: 22 };
const TONE = {
  high: "fire",
  normal: "ok",
  low: "muted",
  unknown: "muted",
} as const;

type State =
  | { kind: "loading" }
  | { kind: "error"; key: MsgKey }
  | { kind: "ok"; view: HistoryView };

const dm = (iso: string) => `${iso.slice(8)}/${iso.slice(5, 7)}`;

function Chart({
  cmp,
  current,
  days,
}: {
  cmp: Comparison;
  current: number[] | null;
  days: string[];
}) {
  const n = days.length;
  const top = Math.max(1, ...cmp.band.map((b) => b.max), ...(current ?? []));
  const x = (i: number) => PAD.l + (i * (W - PAD.l - PAD.r)) / (n - 1);
  const y = (v: number) => PAD.t + (1 - v / top) * (H - PAD.t - PAD.b);
  const pts = (f: (i: number) => number) =>
    cmp.band.map((_, i) => `${x(i)},${f(i)}`);
  const band = cmp.used
    ? [
        ...pts((i) => y(cmp.band[i].max)),
        ...pts((i) => y(cmp.band[i].min)).reverse(),
      ].join(" ")
    : "";
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-full w-full"
      preserveAspectRatio="none"
    >
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line
            x1={PAD.l}
            x2={W - PAD.r}
            y1={y(top * f)}
            y2={y(top * f)}
            stroke="var(--border)"
          />
          <text
            x={PAD.l - 4}
            y={y(top * f) + 3}
            textAnchor="end"
            fontSize="10"
            fill="var(--chart-axis)"
          >
            {Math.round(top * f)}
          </text>
        </g>
      ))}
      {band && <polygon points={band} fill="currentColor" opacity="0.14" />}
      {cmp.used > 0 && (
        <polyline
          points={pts((i) => y(cmp.band[i].mean)).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.55"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
      )}
      {current && (
        <>
          <polyline
            points={current.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
            fill="none"
            stroke="#e8710a"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {current.map((v, i) => (
            <circle key={days[i]} cx={x(i)} cy={y(v)} r="2.8" fill="#e8710a" />
          ))}
        </>
      )}
      {[0, Math.floor((n - 1) / 2), n - 1].map((i) => (
        <text
          key={i}
          x={x(i)}
          y={H - 6}
          textAnchor="middle"
          fontSize="10"
          fill="var(--chart-axis)"
        >
          {dm(days[i])}
        </text>
      ))}
    </svg>
  );
}

function Verdict({
  cmp,
  t,
  fmt,
}: {
  cmp: Comparison;
  t: Ctx["t"];
  fmt: (n: number, d?: number) => string;
}) {
  const lead =
    cmp.ratio !== null
      ? fmt(cmp.ratio, 1) === "1"
        ? t("season.same")
        : t("season.phrase", { x: fmt(cmp.ratio, 1) })
      : cmp.currentTotal === null
        ? t("season.noCurrent")
        : cmp.avgTotal !== null
          ? t("season.tiny", { min: MIN_AVG_TOTAL })
          : t("season.empty");
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <Badge tone={TONE[cmp.verdict]}>
        {t(`season.v.${cmp.verdict}` as MsgKey)}
      </Badge>
      <p className="text-[13.5px] font-medium">{lead}</p>
    </div>
  );
}

function Body({
  view,
  ctx,
  fmt,
}: {
  view: HistoryView;
  ctx: Ctx;
  fmt: (n: number, d?: number) => string;
}) {
  const { t } = ctx;
  const cmp = compareSeason(view.current, view.past);
  const year = Number(view.end.slice(0, 4));
  const days = windowDates(view.end, year);
  const used = view.past.filter((p) => p.counts).map((p) => p.year);
  const avgRound = cmp.avgTotal === null ? "—" : fmt(cmp.avgTotal);
  return (
    <>
      <Verdict cmp={cmp} t={t} fmt={fmt} />
      {cmp.used === 0 ? null : (
        <>
          <ChartFrame
            className="h-44 text-foreground"
            label={t("season.aria", {
              cur: cmp.currentTotal === null ? "—" : fmt(cmp.currentTotal),
              avg: avgRound,
            })}
            caption={t("season.caption")}
            columns={[
              t("season.col.day"),
              t("season.col.now"),
              t("season.col.min"),
              t("season.col.mean"),
              t("season.col.max"),
            ]}
            rows={days.map((d, i) => [
              dm(d),
              view.current?.[i] ?? "—",
              cmp.band[i].min,
              Math.round(cmp.band[i].mean),
              cmp.band[i].max,
            ])}
          >
            <Chart cmp={cmp} current={view.current} days={days} />
          </ChartFrame>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-foreground/70">
            <li className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block h-0.5 w-4 bg-[#e8710a]"
              />
              {t("season.legend.now")}
            </li>
            <li className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block h-2.5 w-4 rounded-sm bg-foreground/15"
              />
              {t("season.legend.band")}
            </li>
            <li className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block w-4 border-t border-dashed border-foreground/55"
              />
              {t("season.legend.mean")}
            </li>
          </ul>
          <p className="mt-2 text-[12px] text-foreground/75">
            {t("season.basis", {
              used: cmp.used,
              asked: cmp.asked,
              years: used.join(", "),
            })}{" "}
            {cmp.minTotal !== null &&
            cmp.maxTotal !== null &&
            cmp.currentTotal !== null
              ? t("season.range", {
                  min: fmt(cmp.minTotal),
                  max: fmt(cmp.maxTotal),
                  cur: fmt(cmp.currentTotal),
                })
              : null}
          </p>
        </>
      )}
      <p className="mt-2 text-[11px] text-foreground/65">{t("season.note")}</p>
    </>
  );
}

export function SeasonCard({ ctx, loc }: { ctx: Ctx; loc: string }) {
  const { t } = ctx;
  // ponytail: ref keeps load() stable even if the parent rebuilds authedFetch each render (no refetch loop)
  const authed = useRef(ctx.authedFetch);
  authed.current = ctx.authedFetch;
  const [state, setState] = useState<State>({ kind: "loading" });
  const fmt = (n: number, d = 0) =>
    n.toLocaleString(loc, { maximumFractionDigits: d });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const res = await authed.current("/api/admin/history");
      const view = res.ok ? parseHistory(await res.json()) : null;
      if (view) setState({ kind: "ok", view });
      else
        setState({
          kind: "error",
          key:
            res.status === 401 || res.status === 403
              ? "season.denied"
              : "season.error",
        });
    } catch {
      setState({ kind: "error", key: "season.error" });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Card
      title={t("season.title")}
      right={<Badge tone="ok">{t("season.badge")}</Badge>}
    >
      <p className="mb-3 text-[12px] leading-snug text-foreground/70">
        {t("season.intro")}
      </p>
      <div aria-live="polite">
        {state.kind === "loading" && (
          <div role="status" className="space-y-2">
            <div className="h-44 animate-pulse rounded-lg bg-foreground/[0.05]" />
            <p className="text-[12px] text-foreground/65">
              {t("season.loading")}
            </p>
          </div>
        )}
        {state.kind === "error" && (
          <div
            role="alert"
            className="rounded-lg bg-foreground/[0.04] px-3 py-2.5"
          >
            <p className="mb-2 text-[12.5px] text-[var(--state-bad-ink)]">
              {t(state.key)}
            </p>
            <Btn onClick={() => void load()}>{t("season.retry")}</Btn>
          </div>
        )}
        {state.kind === "ok" && <Body view={state.view} ctx={ctx} fmt={fmt} />}
      </div>
    </Card>
  );
}
