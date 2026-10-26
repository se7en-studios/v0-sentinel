"use client";

import { useMemo, useRef, useState } from "react";
import { FileText, Flame, MapPinned, Zap, MoveUpRight } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { buildIncidents, type Incident } from "@/lib/admin/incident";
import { nearestPlace } from "@/lib/admin/places";
import { uiT } from "@/lib/admin/ui-locale";
import { fmtArea } from "@/lib/admin/geo";
import {
  ASSIGNEE_MAX,
  INCIDENT_STATUSES,
  isOpenStatus,
  type IncidentStatus,
} from "@/lib/admin/incident-meta";
import { NUM_LOCALE } from "@/lib/admin/i18n-shell";
import type { Translate } from "@/lib/admin/i18n";
import { earlyNearby, printIncidentReport } from "@/lib/admin/report";
import { terrainLine } from "@/lib/admin/terrain";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Ctx } from "./ctx";
import { TerrainCard } from "./terrain-card";
import {
  Badge,
  Btn,
  Card,
  ChartFrame,
  DataGate,
  EmptyState,
  Field,
  Segmented,
  Stat,
  inputCls,
} from "./ui";

const REGION_KM = 300;
const LIST_MAX = 8;
type Scope = "region" | "ar";

const fmtWhen = (t: number, loc: string) =>
  new Date(t).toLocaleString(loc, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const TERRAIN_WAIT_MS = 4000;

/** Opens the printable incident report with terrain, early warnings and the status timeline. */
async function openReport(ctx: Ctx, inc: Incident) {
  const meta = ctx.incidentMeta[inc.id];
  const terrain = await Promise.race([
    ctx.terrainAt(inc.lat, inc.lng),
    new Promise<null>((r) => setTimeout(() => r(null), TERRAIN_WAIT_MS)),
  ]).catch(() => null);
  const ok = printIncidentReport({
    locale: ctx.ws.settings.locale,
    org: ctx.ws.settings.org || "Sentinel",
    place: nearestPlace(inc.lat, inc.lng).near,
    lat: inc.lat,
    lng: inc.lng,
    count: inc.count,
    frp: inc.frp,
    area: fmtArea(inc.areaHa, ctx.ws.settings.units, NUM_LOCALE[ctx.ws.settings.locale]),
    daysActive: inc.perDay.length,
    status: meta?.status ?? null,
    assignee: meta?.assignee ?? "",
    terrain: terrain ? terrainLine(terrain) || null : null,
    early: earlyNearby(ctx.early, inc.lat, inc.lng),
    history: meta?.history ?? [],
  });
  if (!ok) toast.error(uiT("inc.popup"), { description: uiT("inc.popupDesc") });
}

const kmFrom = (center: [number, number], i: Incident) => {
  const dy = (i.lat - center[1]) * 111.32;
  const dx = (i.lng - center[0]) * 111.32 * Math.cos((i.lat * Math.PI) / 180);
  return Math.hypot(dx, dy);
};

const AXIS = { fontSize: 11, fill: "var(--chart-axis)" };
const FIRST = [245, 165, 36];
const LAST = [200, 50, 30];
const ramp = (t: number) =>
  `rgb(${FIRST.map((c, i) => Math.round(c + (LAST[i] - c) * t)).join(",")})`;
const EVENT_ICON = { ignition: Flame, explosive: Zap, jump: MoveUpRight };

/** Outline of every day's cumulative perimeter, oldest in amber to newest in red. */
function Silhouette({ inc, t, loc }: { inc: Incident; t: Translate; loc: string }) {
  const last = inc.hulls[inc.hulls.length - 1].ring;
  const kx = Math.cos((inc.lat * Math.PI) / 180);
  const xs = last.map((p) => p[0] * kx);
  const ys = last.map((p) => p[1]);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  const [y0, y1] = [Math.min(...ys), Math.max(...ys)];
  const span = Math.max(x1 - x0, y1 - y0) || 1;
  const pad = 6;
  const sc = (100 - 2 * pad) / span;
  const path = (ring: [number, number][]) =>
    ring
      .map(
        (p, i) =>
          `${i ? "L" : "M"}${(pad + (p[0] * kx - x0) * sc).toFixed(1)},${(100 - pad - (p[1] - y0) * sc).toFixed(1)}`,
      )
      .join("") + "Z";
  const n = inc.hulls.length;
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={t("inc.silhouette", { n, ha: Math.round(inc.areaHa).toLocaleString(loc) })}
      className="size-full"
    >
      {[...inc.hulls].reverse().map((h, k) => {
        const step = n > 1 ? (n - 1 - k) / (n - 1) : 1;
        return (
          <path
            key={h.day}
            d={path(h.ring)}
            fill={ramp(step)}
            fillOpacity={0.28}
            stroke={ramp(step)}
            strokeWidth={0.8}
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
}

const fmtDay = (iso: string | undefined, loc: string) =>
  iso
    ? new Date(`${iso}T12:00:00`).toLocaleDateString(loc, {
        day: "numeric",
        month: "short",
      })
    : "—";

/** Day-by-day perimeter growth for the biggest clusters of detections in the 10-day window. */
// onOpenMap: optional bridge to the "Incendios" tracking tab (the same fire, reconstructed pass by pass)
export function IncidentsView({
  ctx,
  onOpenMap,
}: {
  ctx: Ctx;
  onOpenMap?: (i: Incident) => void;
}) {
  const { payload, ws, t } = ctx;
  const loc = NUM_LOCALE[ws.settings.locale];
  const dayLabel = (iso: string | undefined) => fmtDay(iso, loc);
  const when = (ms: number) => fmtWhen(ms, loc);
  const statusName = (s: IncidentStatus) => t(`rep.st.${s}`);
  const days = payload?.days ?? [];
  const all = useMemo(
    () => (payload ? buildIncidents(ctx.allFires, 60) : []),
    [payload, ctx.allFires],
  );
  // until the user picks one, show the region and fall back to Argentina when the region has none
  const detail = useRef<HTMLDivElement>(null);
  // below lg the list stacks above the detail: bring the detail into view after a tap
  const select = (id: string) => {
    setSelId(id);
    if (!window.matchMedia("(min-width: 1024px)").matches)
      detail.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const [picked, setScope] = useState<Scope | null>(null);
  const scope: Scope =
    picked ??
    (all.some((i) => kmFrom(ctx.center, i) <= REGION_KM) ? "region" : "ar");
  const incidents = useMemo(
    () =>
      (scope === "ar"
        ? all
        : all.filter((i) => kmFrom(ctx.center, i) <= REGION_KM)
      ).slice(0, LIST_MAX),
    [all, scope, ctx.center],
  );
  const selId = ctx.incidentSel;
  const setSelId = ctx.setIncidentSel;
  // an incident opened from the map popup may sit outside the region scope or past the list cut
  const chosen = selId ? all.find((i) => i.id === selId) : undefined;
  const shown = useMemo(
    () =>
      chosen && !incidents.includes(chosen)
        ? [chosen, ...incidents.slice(0, LIST_MAX - 1)]
        : incidents,
    [chosen, incidents],
  );
  const inc = chosen ?? incidents[0];
  const units = ws.settings.units;

  return (
    <DataGate
      payload={payload}
      loading={ctx.loading}
      error={ctx.firesError}
      reload={ctx.reload}
    >
      <div className="view-in mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold">{t("inc.title")}</h1>
            <p className="text-[13px] text-foreground/60">{t("inc.sub")}</p>
          </div>
          <Segmented
            label={t("inc.scope")}
            value={scope}
            onChange={setScope}
            options={[
              { value: "region", label: t("inc.scope.region", { km: REGION_KM }) },
              { value: "ar", label: t("inc.scope.ar") },
            ]}
          />
        </div>

        {!inc ? (
          <EmptyState
            icon={<Flame className="size-5" />}
            title={ctx.t("inc.empty.title")}
            action={
              scope === "region" && all.length > 0 ? (
                <Btn onClick={() => setScope("ar")}>
                  {ctx.t("inc.empty.goAr", { n: all.length })}
                </Btn>
              ) : undefined
            }
          >
            {ctx.t("inc.empty.what")}{" "}
            {scope === "region"
              ? ctx.t("inc.empty.region", { km: REGION_KM })
              : ctx.t("inc.empty.ar")}
          </EmptyState>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <ul className="space-y-2" aria-label={t("inc.list")}>
              {shown.map((i) => {
                const place = nearestPlace(i.lat, i.lng);
                const on = i.id === inc.id;
                return (
                  <li key={i.id}>
                    <button
                      type="button"
                      onClick={() => select(i.id)}
                      aria-pressed={on}
                      className={cn(
                        "w-full rounded-xl border bg-card p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        on
                          ? "border-primary/60 shadow-[var(--shadow-1)]"
                          : "border-[var(--hairline)] hover:bg-foreground/[0.03]",
                      )}
                    >
                      <div className="text-[13px] font-semibold">
                        {place.near}
                      </div>
                      <div className="mt-0.5 text-[11.5px] text-foreground/60">
                        {t("inc.card.sub", { km: place.km, n: i.count, mw: i.frp.toLocaleString(loc) })}
                      </div>
                      <div className="num mt-1 font-heading text-[17px] font-bold">
                        {fmtArea(i.areaHa, units, loc)}
                      </div>
                      {ctx.incidentMeta[i.id] && (
                        <div className="mt-1.5">
                          <Badge
                            tone={
                              isOpenStatus(ctx.incidentMeta[i.id].status)
                                ? "fire"
                                : "muted"
                            }
                          >
                            {statusName(ctx.incidentMeta[i.id].status)}
                          </Badge>
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div ref={detail} className="scroll-mt-16 space-y-4">
              <div className="grid overflow-hidden rounded-xl bg-[var(--brand-deep)] text-white shadow-[var(--shadow-1)] sm:grid-cols-[1fr_200px]">
                <div className="p-4 sm:p-5">
                  <Badge tone="sim" className="bg-white/15 text-amber-200">
                    {t("inc.sat")}
                  </Badge>
                  <h2 className="mt-2 font-heading text-[22px] font-bold leading-tight">
                    {nearestPlace(inc.lat, inc.lng).near}
                  </h2>
                  <div className="num mt-3 font-heading text-[40px] font-bold leading-none">
                    {fmtArea(inc.areaHa, units, loc)}
                  </div>
                  <p className="mt-1 text-[12px] text-white/70">
                    {t("inc.perimeter", { day: dayLabel(days[inc.perDay[inc.perDay.length - 1].day]) })}
                  </p>
                  {onOpenMap && (
                    <Btn
                      onClick={() => onOpenMap(inc)}
                      className="mt-4 border-white bg-white text-[#0f3d2c] hover:bg-white/90"
                    >
                      <MapPinned className="size-3.5" aria-hidden />
                      {t("inc.viewMap")}
                    </Btn>
                  )}
                </div>
                <div className="h-48 p-3 sm:h-auto">
                  <Silhouette inc={inc} t={t} loc={loc} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  inc.perDay.length < 2
                    ? {
                        label: t("inc.k.last"),
                        value: "—",
                        sub: t("inc.k.first"),
                      }
                    : {
                        label: t("inc.k.last"),
                        value: `${inc.growthHa >= 0 ? "+" : ""}${fmtArea(inc.growthHa, units, loc)}`,
                        tone: inc.growthHa > 0 ? ("fire" as const) : undefined,
                      },
                  { label: t("inc.k.fires"), value: inc.count.toLocaleString(loc) },
                  {
                    label: t("inc.k.power"),
                    value: `${inc.frp.toLocaleString(loc)} MW`,
                  },
                  { label: t("inc.k.days"), value: inc.perDay.length },
                ].map((k) => (
                  <Card key={k.label}>
                    <Stat {...k} />
                  </Card>
                ))}
              </div>

              <TerrainCard ctx={ctx} lat={inc.lat} lng={inc.lng} />
              <Card title={t("inc.follow")}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={t("inc.status")}>
                    <select
                      className={inputCls}
                      value={ctx.incidentMeta[inc.id]?.status ?? "detected"}
                      onChange={(e) =>
                        ctx.updateIncident(inc.id, {
                          status: e.target.value as IncidentStatus,
                        })
                      }
                    >
                      {INCIDENT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {statusName(s)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t("inc.assignee")}>
                    <input
                      key={inc.id}
                      className={inputCls}
                      defaultValue={ctx.incidentMeta[inc.id]?.assignee ?? ""}
                      maxLength={ASSIGNEE_MAX}
                      placeholder={t("inc.assignee.ph")}
                      onBlur={(e) => {
                        if (
                          e.target.value.trim() !==
                          (ctx.incidentMeta[inc.id]?.assignee ?? "")
                        )
                          ctx.updateIncident(inc.id, {
                            assignee: e.target.value,
                          });
                      }}
                    />
                  </Field>
                </div>
                <p className="mt-2 text-[11.5px] text-foreground/60">
                  {ctx.incidentMeta[inc.id]
                    ? t("inc.updated", { who: ctx.incidentMeta[inc.id].by || t("zd.operator"), when: when(ctx.incidentMeta[inc.id].t) })
                    : t("inc.noFollow")}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Btn onClick={() => void openReport(ctx, inc)}>
                    <FileText className="size-3.5" aria-hidden /> {t("inc.report")}
                  </Btn>
                  <span className="text-[11px] text-foreground/60">{t("inc.report.hint")}</span>
                </div>
                {(ctx.incidentMeta[inc.id]?.history?.length ?? 0) > 0 && (
                  <ol
                    className="mt-3 space-y-1.5 border-t border-[var(--hairline)] pt-3"
                    aria-label={t("inc.history")}
                  >
                    {[...(ctx.incidentMeta[inc.id]?.history ?? [])]
                      .reverse()
                      .map((h) => (
                        <li
                          key={`${h.t}-${h.status}-${h.assignee}`}
                          className="flex items-baseline justify-between gap-2 text-[12px]"
                        >
                          <span className="min-w-0">
                            <b className="font-semibold">
                              {statusName(h.status)}
                            </b>
                            {h.assignee && (
                              <span className="text-foreground/65">
                                {" "}
                                · {t("inc.inCharge", { who: h.assignee })}
                              </span>
                            )}
                            <span className="text-foreground/50">
                              {" "}
                              · {h.by || t("zd.operator")}
                            </span>
                          </span>
                          <span className="num shrink-0 text-[11px] text-foreground/55">
                            {when(h.t)}
                          </span>
                        </li>
                      ))}
                  </ol>
                )}
              </Card>

              <Card title={t("inc.areaPerDay")}>
                {inc.perDay.length < 2 ? (
                  <p className="py-10 text-center text-[12.5px] text-foreground/60">
                    {t("inc.oneDay")}
                  </p>
                ) : (
                  <ChartFrame
                    className="h-52"
                    label={t("inc.chart.label", { near: nearestPlace(inc.lat, inc.lng).near, from: fmtArea(inc.perDay[0].areaHa, units, loc), to: fmtArea(inc.areaHa, units, loc) })}
                    caption={t("inc.chart.caption")}
                    columns={[t("inc.col.day"), t("inc.col.area")]}
                    rows={inc.perDay.map((d) => [
                      dayLabel(days[d.day]),
                      d.areaHa.toLocaleString(loc),
                    ])}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={inc.perDay.map((d) => ({
                          label: dayLabel(days[d.day]),
                          ha: d.areaHa,
                        }))}
                        margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                      >
                        <CartesianGrid
                          vertical={false}
                          stroke="var(--border)"
                        />
                        <XAxis
                          dataKey="label"
                          tick={AXIS}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis tick={AXIS} tickLine={false} axisLine={false} />
                        <Tooltip
                          formatter={(v) => [
                            `${Number(v).toLocaleString(loc)} ha`,
                            t("inc.tip.area"),
                          ]}
                          contentStyle={{
                            fontSize: 12,
                            borderRadius: 6,
                            border: "1px solid var(--border)",
                            background: "var(--chart-tip)",
                            color: "var(--foreground)",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="ha"
                          stroke="var(--state-bad)"
                          strokeWidth={1.8}
                          fill="var(--state-bad)"
                          fillOpacity={0.15}
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartFrame>
                )}
              </Card>

              <Card title={t("inc.events")}>
                <ol className="space-y-2.5">
                  {[...inc.events].reverse().map((e) => {
                    const Icon = EVENT_ICON[e.kind];
                    return (
                      <li
                        key={`${e.kind}-${e.day}`}
                        className="flex items-start gap-3"
                      >
                        <span
                          className={cn(
                            "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full",
                            e.kind === "ignition" &&
                              "bg-[var(--state-watch)]/15 text-[var(--state-watch-ink)]",
                            e.kind === "explosive" &&
                              "bg-[var(--state-bad)]/15 text-[var(--state-bad-ink)]",
                            e.kind === "jump" &&
                              "bg-[var(--state-warn)]/20 text-[var(--state-warn-ink)]",
                          )}
                        >
                          <Icon className="size-3.5" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-[13px] font-semibold">
                              {t(`inc.ev.${e.kind}`)}
                            </span>
                            <span className="num text-[11px] text-foreground/55">
                              {dayLabel(days[e.day])}
                            </span>
                          </div>
                          <p className="text-[12px] text-foreground/65">
                            {e.kind === "ignition"
                              ? t("inc.ev.ignition.sub", { n: e.value })
                              : e.kind === "explosive"
                                ? t("inc.ev.explosive.sub", { ha: e.value.toLocaleString(loc) })
                                : t("inc.ev.jump.sub", { km: e.value.toFixed(1) })}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
                <p className="mt-3 border-t border-[var(--hairline)] pt-2 text-[11px] leading-snug text-foreground/55">
                  {t("inc.method")}
                </p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DataGate>
  );
}
