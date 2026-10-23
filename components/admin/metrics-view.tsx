"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { areaHa, fmtArea, fmtKm, lengthKm } from "@/lib/admin/geo";
import { BURNED_HISTORY } from "@/lib/admin/history";
import { riskLabel, type MsgKey, type Translate } from "@/lib/admin/i18n";
import { NUM_LOCALE } from "@/lib/admin/i18n-shell";
import { FIRE_SATS } from "@/lib/admin/fire-sources";
import { goesLeads, median, satCounts24, type GoesLead } from "@/lib/admin/metrics";
import { MODE_ROLE } from "@/lib/admin/types";
import type { Ctx } from "./ctx";
import { pointTs } from "./hooks/fire-time";
import { SourcesCard } from "./sources-card";
import { SeasonCard } from "./season-card";
import { Badge, Card, ChartFrame, DataGate, Stat } from "./ui";

const AXIS = { fontSize: 11, fill: "var(--chart-axis)" };
const TIP = {
  fontSize: 12,
  borderRadius: 6,
  border: "1px solid var(--border)",
  background: "var(--chart-tip)",
  color: "var(--foreground)",
};
const CONF_COLORS = ["#c9a300", "#e8710a", "#b83a3a"];
const DAY_MS = 86_400_000;
const LEAD_ROWS = 6;

const CONF_KEYS: Record<string, MsgKey> = {
  Baja: "met.conf.Baja",
  Nominal: "met.conf.Nominal",
  Alta: "met.conf.Alta",
};

const artStamp = (ms: number, loc: string) =>
  new Date(ms).toLocaleString(loc, {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

const leadLabel = (minutes: number, t: Translate) => {
  if (minutes <= 0) return t("met.lead.zero");
  if (minutes < 60) return t("met.lead.min", { n: minutes });
  return t("met.lead.hm", { h: Math.floor(minutes / 60), m: minutes % 60 });
};

export function MetricsView({ ctx }: { ctx: Ctx }) {
  const { stats, ws, zoneHits, drones, sensors, t } = ctx;
  const loc = NUM_LOCALE[ws.settings.locale];
  const fmt = (n: number) => n.toLocaleString(loc);
  const u = ws.settings.units;
  const zones = ws.features.filter(
    (f) => MODE_ROLE[String(f.properties.mode)] === "zone",
  );
  const routes = ws.features.filter(
    (f) => MODE_ROLE[String(f.properties.mode)] === "route",
  );
  const active = drones.filter((d) => d.route).length;
  const hist = BURNED_HISTORY.map((h) => ({ ...h, label: String(h.year) }));
  const nightPct = stats.total
    ? Math.round((stats.night / stats.total) * 100)
    : 0;
  const confName = (n: string) => (CONF_KEYS[n] ? t(CONF_KEYS[n]) : n);

  return (
    <DataGate
      payload={ctx.payload}
      loading={ctx.loading}
      error={ctx.firesError}
      reload={ctx.reload}
      t={t}
    >
    <div className="view-in mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">{t("tab.metricas")}</h1>
        <p className="text-[13px] text-foreground/65">{t("met.intro")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {
            label: t("met.fires10"),
            value: fmt(stats.total),
            sub: t("met.in24", { n: fmt(stats.last24) }),
            tone: "fire" as const,
          },
          {
            label: t("met.area"),
            value: fmtArea(stats.hectares, u),
            sub: t("met.area.sub"),
          },
          {
            label: t("met.frp"),
            value: `${fmt(stats.frp)} MW`,
            sub: t("met.night", { n: nightPct }),
          },
          {
            label: t("met.zonesWatched"),
            value: zones.length,
            sub: fmtArea(
              zones.reduce((a, z) => a + areaHa(z), 0),
              u,
            ),
            tone: "ok" as const,
          },
        ].map((k) => (
          <Card key={k.label}>
            <Stat {...k} />
          </Card>
        ))}
      </div>

      <TrendCard perDay={stats.perDay} t={t} loc={loc} />

      <SeasonCard ctx={ctx} loc={loc} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LeadCard ctx={ctx} loc={loc} />
        <SatCard ctx={ctx} loc={loc} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card
          title={t("met.perDay")}
          className="lg:col-span-2"
          right={<Badge tone="ok">NASA FIRMS</Badge>}
        >
          <ChartFrame
            className="h-60"
            label={t("met.perDay.aria", { d: stats.perDay.length, n: fmt(stats.total) })}
            caption={t("met.perDay.caption")}
            columns={[t("met.col.day"), t("met.col.fires"), t("met.col.mw")]}
            rows={stats.perDay.map((d) => [d.label, d.count, Math.round(d.frp)])}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.perDay}
                margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tick={AXIS}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={TIP}
                  formatter={(v, n) => [v, n === "count" ? t("met.tip.fires") : "MW"]}
                />
                <Bar dataKey="count" fill="#e8710a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
        </Card>
        <Card title={t("met.conf")}>
          <ChartFrame
            className="h-60"
            label={t("met.conf.aria", {
              list: stats.byConf.map((c) => `${confName(c.name)} ${c.value}`).join(", "),
            })}
            caption={t("met.conf.caption")}
            columns={[t("met.col.conf"), t("met.col.fires")]}
            rows={stats.byConf.map((c) => [confName(c.name), c.value])}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.byConf.map((c) => ({ ...c, name: confName(c.name) }))}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={78}
                  paddingAngle={2}
                >
                  {stats.byConf.map((c, i) => (
                    <Cell key={c.name} fill={CONF_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TIP} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartFrame>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card
          title={t("met.burned")}
          right={<Badge>{t("met.burned.badge")}</Badge>}
        >
          <ChartFrame
            className="h-52"
            label={t("met.burned.aria", {
              list: hist.map((h) => t("met.burned.item", { y: h.year, ha: fmt(h.ha) })).join(", "),
            })}
            caption={t("met.burned.caption")}
            columns={[t("met.col.year"), t("met.col.ha")]}
            rows={hist.map((h) => [h.year, fmt(h.ha)])}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={hist}
                margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tick={AXIS}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={AXIS}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v / 1000}k`}
                />
                <Tooltip
                  contentStyle={TIP}
                  formatter={(v) => [`${fmt(Number(v))} ha`, t("met.tip.burned")]}
                />
                <Bar dataKey="ha" fill="#b83a3a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
          <p className="mt-2 text-[11px] text-foreground/65">{t("met.burned.note")}</p>
          <ul className="mt-2 space-y-0.5 text-[11px] text-foreground/65">
            {BURNED_HISTORY.map((h) => (
              <li key={h.year}>
                {h.year}:{" "}
                <a
                  className="underline underline-offset-2 hover:text-primary"
                  href={h.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {h.source}
                </a>
              </li>
            ))}
            <li>{t("met.burned.foot")}</li>
          </ul>
        </Card>

        <Card
          title={t("met.zones")}
          right={<Badge tone="muted">{zones.length}</Badge>}
        >
          {zones.length === 0 ? (
            <p className="text-[12.5px] text-foreground/60">{t("met.zones.empty")}</p>
          ) : (
            <div className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" tabIndex={0} role="region" aria-label={t("met.zones")}>
              <table className="w-full min-w-[420px] text-left text-[12.5px]">
                <thead className="text-[10.5px] uppercase tracking-wider text-foreground/60">
                  <tr>
                    <th scope="col" className="pb-1.5 font-medium">{t("met.col.zone")}</th>
                    <th scope="col" className="pb-1.5 text-right font-medium">{t("met.col.area")}</th>
                    <th scope="col" className="pb-1.5 text-right font-medium">{t("met.col.risk")}</th>
                    <th scope="col" className="pb-1.5 text-right font-medium">{t("met.col.fires48")}</th>
                    <th scope="col" className="pb-1.5 text-right font-medium">{t("met.col.days10")}</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((z) => (
                    <tr key={z.id} className="border-t border-border">
                      <td className="py-1.5 pr-2">{ws.meta[z.id]?.name}</td>
                      <td className="py-1.5 text-right tabular-nums">
                        {fmtArea(areaHa(z), u)}
                      </td>
                      <td className="py-1.5 text-right text-[12px]" style={{ color: ctx.zoneRisk[z.id]?.color }}>
                        {ctx.zoneRisk[z.id]
                          ? `${riskLabel(t, ctx.zoneRisk[z.id].label)} (${ctx.zoneRisk[z.id].score})`
                          : "…"}
                      </td>
                      <td
                        className={`py-1.5 text-right tabular-nums ${zoneHits[z.id]?.recent ? "font-semibold text-[var(--state-bad-ink)]" : ""}`}
                      >
                        {zoneHits[z.id]?.recent ?? 0}
                      </td>
                      <td className="py-1.5 text-right tabular-nums">
                        {zoneHits[z.id]?.total ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <SourcesCard ctx={ctx} />
      <Card title={t("met.op")} right={<Badge tone="sim">{t("met.op.badge")}</Badge>}>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <Stat label={t("met.op.drones")} value={`${active}/${drones.length}`} />
          <Stat
            label={t("met.op.routes")}
            value={routes.length}
            sub={fmtKm(routes.reduce((a, r) => a + lengthKm(r), 0))}
          />
          <Stat label={t("met.op.sensors")} value={sensors.length} />
          <Stat
            label={t("met.op.sensorsAlert")}
            value={sensors.filter((s) => s.reading.alert).length}
            tone={sensors.some((s) => s.reading.alert) ? "fire" : undefined}
          />
          <Stat
            label={t("met.op.zonesAlert")}
            value={Object.values(zoneHits).filter((h) => h.recent > 0).length}
            tone="fire"
          />
        </div>
      </Card>
      <Card title={t("met.impact")} right={<Badge>{t("met.impact.badge")}</Badge>}>
        {ws.settings.valuePerHa > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label={t("met.impact.watched")} value={fmtArea(ctx.protectedHa, u)} sub={zones.length > 1 ? t("met.impact.overlap") : undefined} />
            <Stat label={t("met.impact.value")} value={`USD ${fmt(Math.round(ctx.protectedHa * ws.settings.valuePerHa))}`} tone="ok" />
            <Stat label={t("met.impact.hit")} value={fmtArea(ctx.atRiskHa, u)} tone={ctx.atRiskHa ? "fire" : undefined} />
            <Stat label={t("met.impact.exposed")} value={`USD ${fmt(Math.round(ctx.atRiskHa * ws.settings.valuePerHa))}`} tone={ctx.atRiskHa ? "fire" : undefined} />
          </div>
        ) : (
          <p className="text-[12.5px] text-foreground/65">{t("met.impact.empty")}</p>
        )}
      </Card>
    </div>
    </DataGate>
  );
}

/** How many minutes GOES-19 beat the polar satellites by, from the early warnings a polar pass later confirmed. */
function LeadCard({ ctx, loc }: { ctx: Ctx; loc: string }) {
  const { t } = ctx;
  const leads = goesLeads(ctx.early);
  const med = median(leads.map((l) => l.minutes));
  const best = Math.max(0, ...leads.map((l) => l.minutes));
  const off = !ctx.ws.settings.earlyAlerts;
  return (
    <Card title={t("met.lead")} right={<Badge tone="ok">{t("met.lead.badge")}</Badge>}>
      <p className="mb-3 text-[12px] leading-snug text-foreground/70">{t("met.lead.intro")}</p>
      {off || leads.length === 0 || med === null ? (
        <p className="rounded-lg bg-foreground/[0.04] px-3 py-2.5 text-[12.5px] text-foreground/70">
          {off ? t("met.lead.off") : t("met.lead.none")}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat label={t("met.lead.median")} value={leadLabel(Math.round(med), t)} tone="ok" />
            <Stat label={t("met.lead.count")} value={leads.length} />
            <Stat label={t("met.lead.best")} value={leadLabel(best, t)} />
          </div>
          <LeadTable leads={leads.slice(0, LEAD_ROWS)} t={t} loc={loc} />
          {leads.length > LEAD_ROWS && (
            <p className="mt-1.5 text-[11px] text-foreground/65">
              {t("met.lead.more", { n: leads.length - LEAD_ROWS })}
            </p>
          )}
        </>
      )}
    </Card>
  );
}

function LeadTable({ leads, t, loc }: { leads: GoesLead[]; t: Translate; loc: string }) {
  return (
    <div className="mt-3 overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" tabIndex={0} role="region" aria-label={t("met.lead.caption")}>
      <table className="w-full min-w-[420px] text-left text-[11.5px]">
        <caption className="sr-only">{t("met.lead.caption")}</caption>
        <thead className="text-[10px] uppercase tracking-[0.08em] text-foreground/60">
          <tr>
            <th scope="col" className="py-1 pr-2 font-semibold">{t("met.lead.place")}</th>
            <th scope="col" className="py-1 pr-2 font-semibold">{t("met.lead.seen")}</th>
            <th scope="col" className="py-1 pr-2 font-semibold">{t("met.lead.confirmed")}</th>
            <th scope="col" className="py-1 text-right font-semibold">{t("met.lead.gain")}</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={`${l.lat}:${l.lng}:${l.firstAt}`} className="border-t border-[var(--hairline)]">
              <th scope="row" className="num py-1 pr-2 font-medium">
                {l.lat.toFixed(2)}, {l.lng.toFixed(2)}
              </th>
              <td className="num py-1 pr-2">{artStamp(l.firstAt, loc)}</td>
              <td className="num py-1 pr-2">{artStamp(l.confirmedAt, loc)}</td>
              <td className="num py-1 text-right font-semibold">{leadLabel(l.minutes, t)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Last 24 h of detections that pass the filters, split by the polar satellite that saw them. */
function SatCard({ ctx, loc }: { ctx: Ctx; loc: string }) {
  const { t, now, allFires, early } = ctx;
  const days = ctx.payload?.days ?? [];
  const rows = satCounts24(allFires, (p) => pointTs(days, p), now).map((r) => ({
    ...r,
    label: FIRE_SATS.find((s) => s.code === r.code)?.label ?? t("met.sat.unknown"),
  }));
  const total = rows.reduce((a, r) => a + r.count, 0);
  const top = Math.max(1, ...rows.map((r) => r.count));
  const goesPoints = early.filter((e) => now - e.lastAt <= DAY_MS).length;
  return (
    <Card title={t("met.sat")} right={<Badge tone="muted">{t("met.sat.badge")}</Badge>}>
      <p className="mb-3 text-[12px] leading-snug text-foreground/70">{t("met.sat.intro")}</p>
      {rows.length === 0 ? (
        <p className="rounded-lg bg-foreground/[0.04] px-3 py-2.5 text-[12.5px] text-foreground/70">
          {t("met.sat.none")}
        </p>
      ) : (
        <ul aria-label={t("met.sat.list")} className="space-y-2">
          {rows.map((r) => (
            <li key={r.code ?? "none"}>
              <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
                <span className="font-medium">{r.label}</span>
                <span className="num text-foreground/80">
                  {r.count.toLocaleString(loc)}
                  <span className="ml-1.5 text-[11px] text-foreground/60">
                    {Math.round((r.count / total) * 100)}%
                  </span>
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/10" aria-hidden>
                <div
                  className="h-full rounded-full bg-[var(--state-watch)]"
                  style={{ width: `${(r.count / top) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      {goesPoints > 0 && (
        <p className="mt-3 text-[11px] leading-snug text-foreground/65">
          {t("met.sat.goes", { n: goesPoints.toLocaleString(loc) })}
        </p>
      )}
    </Card>
  );
}

/** Last half of the window vs the half before it, so a rising or falling season is visible at a glance. */
function TrendCard({
  perDay: all,
  t,
  loc,
}: {
  perDay: Ctx["stats"]["perDay"];
  t: Translate;
  loc: string;
}) {
  const perDay = all.slice(0, -1); // today is still filling in and would drag the comparison down
  const h = Math.floor(perDay.length / 2);
  if (h < 2) return null;
  const sum = (days: typeof perDay, k: "count" | "frp") =>
    days.reduce((a, d) => a + d[k], 0);
  const recent = perDay.slice(-h);
  const prev = perDay.slice(-2 * h, -h);
  const rows = (["count", "frp"] as const).map((k) => {
    const now = sum(recent, k);
    const before = sum(prev, k);
    return {
      label: k === "count" ? t("met.col.fires") : t("met.frp"),
      unit: k === "count" ? "" : " MW",
      now,
      before,
      pct: before > 0 ? Math.round(((now - before) / before) * 100) : null,
    };
  });
  const num = (n: number, unit: string) => `${Math.round(n).toLocaleString(loc)}${unit}`;
  return (
    <Card
      title={t("met.trend", { h })}
      right={<Badge>{t("met.trend.badge")}</Badge>}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-end justify-between gap-3">
            <Stat
              label={r.label}
              value={num(r.now, r.unit)}
              sub={t("met.trend.before", { v: num(r.before, r.unit) })}
            />
            <span
              className={
                r.pct === null
                  ? "num text-[13px] font-semibold text-foreground/60"
                  : r.pct > 0
                    ? "num text-[15px] font-bold text-[var(--state-bad-ink)]"
                    : "num text-[15px] font-bold text-primary"
              }
              aria-label={
                r.pct === null
                  ? t("met.trend.noPrev")
                  : t(r.pct > 0 ? "met.trend.up" : "met.trend.down", { n: Math.abs(r.pct) })
              }
            >
              {r.pct === null ? "—" : `${r.pct > 0 ? "▲ +" : r.pct < 0 ? "▼ " : ""}${r.pct}%`}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
