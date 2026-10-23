"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Flame } from "lucide-react";
import { distKm } from "@/lib/admin/geo";
import { FLEET, droneTelemetry, hash } from "@/lib/admin/sim";
import { opsSeries } from "@/lib/admin/resources";
import { NUM_LOCALE } from "@/lib/admin/i18n-shell";
import type { Ctx } from "./ctx";
import { Badge } from "./ui";

const AXIS = { fontSize: 9.5, fill: "var(--chart-axis)" };
const TIP = {
  fontSize: 11,
  borderRadius: 8,
  border: "1px solid var(--hairline)",
  background: "var(--chart-tip)",
  color: "var(--foreground)",
  boxShadow: "var(--shadow-2)",
};

interface Pt {
  t: number;
  v: number;
}

function Mini({
  title,
  unit,
  color,
  data,
  domain,
  step,
  hm,
  loc,
  noData,
  noActivity,
}: {
  loc: string;
  noData: string;
  noActivity: string;
  title: string;
  unit: string;
  color: string;
  data: Pt[];
  domain?: [number, number];
  step?: boolean;
  hm?: boolean;
}) {
  const id = `m-${title.replace(/\W/g, "")}`;
  const empty = data.length > 0 && data.every((d) => d.v === 0);
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col px-3 pb-1.5 pt-2">
      <div className="mb-0.5 flex items-baseline justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.09em] text-foreground/65">
          {title}
        </h3>
        <span className="num text-[10.5px] font-medium text-foreground/70">
          {data.length
            ? Math.round(data[data.length - 1].v).toLocaleString(loc)
            : "—"}{" "}
          <span className="text-foreground/60">{unit}</span>
        </span>
      </div>
      <div
        className="relative min-h-0 flex-1"
        role="img"
        aria-label={`${title}: ${data.length ? Math.round(data[data.length - 1].v).toLocaleString(loc) : noData} ${unit}`}
      >
        {empty && (
          <span className="pointer-events-none absolute inset-0 z-10 grid place-items-center text-[11px] text-foreground/60">
            {noActivity}
          </span>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 6, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="t"
              type="number"
              domain={["dataMin", "dataMax"]}
              scale="time"
              tick={AXIS}
              tickLine={false}
              axisLine={false}
              tickCount={4}
              minTickGap={36}
              tickFormatter={(t) =>
                new Date(t).toLocaleTimeString(loc, hm ? { hour: "2-digit", minute: "2-digit" } : { minute: "2-digit", second: "2-digit" })
              }
            />
            <YAxis
              tick={AXIS}
              tickLine={false}
              axisLine={false}
              width={34}
              tickCount={3}
              domain={domain ?? ["auto", "auto"]}
            />
            <Tooltip
              contentStyle={TIP}
              labelFormatter={(t) =>
                new Date(Number(t)).toLocaleTimeString(loc)
              }
              formatter={(v) => [`${Math.round(Number(v))} ${unit}`, title]}
            />
            <Area
              type={step ? "stepAfter" : "monotone"}
              dataKey="v"
              stroke={color}
              strokeWidth={1.6}
              fill={`url(#${id})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Drone mode dock: telemetry charts for the active drone plus nearby detections. */
export function DroneDock({ ctx }: { ctx: Ctx }) {
  const { t: tr } = ctx;
  const loc = NUM_LOCALE[ctx.ws.settings.locale];
  const miniProps = { loc, noData: tr("fc.noData"), noActivity: tr("dck.noActivity") };
  const d =
    ctx.drones.find((x) => x.spec.id === ctx.activeDrone) ??
    ctx.drones.find((x) => x.track) ??
    ctx.drones[0];
  const second = Math.floor(ctx.now / 1000) * 1000;
  const pos = d.track?.pos;

  const detections = useMemo(() => {
    if (!pos) return [];
    return ctx.fires
      .map((p) => ({ p, km: distKm(pos, [p[1], p[0]]) }))
      .filter((x) => x.km < 6)
      .sort((a, b) => a.km - b.km)
      .slice(0, 5)
      .map(({ p, km }) => ({
        id: `${p[0]}${p[1]}${p[5]}`,
        temp: Math.min(1100, Math.round(300 + p[2] * 14)),
        km,
        conf: p[3],
      }));
  }, [pos, ctx.fires]);
  const heat = detections.length ? Math.min(1, 1.4 - detections[0].km / 5) : 0;

  const series = useMemo(() => {
    const alt: Pt[] = [];
    const temp: Pt[] = [];
    const bat: Pt[] = [];
    for (let i = 59; i >= 0; i--) {
      const t = second - i * 1000;
      const tl = droneTelemetry(d.spec, t);
      alt.push({ t, v: tl.altitude });
      bat.push({ t, v: tl.battery });
      const base = 24 + 5 * Math.sin(t / 7000 + hash(d.spec.id) * 6);
      temp.push({
        t,
        v: Math.round(
          base +
            (i < 22 ? heat * (detections[0]?.temp ?? 0) * (1 - i / 22) : 0),
        ),
      });
    }
    return { alt, temp, bat };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [second, d.spec, heat, detections.length]);

  return (
    <section
      aria-label={tr("dck.droneAria")}
      className="shrink-0 border-t border-[var(--hairline)] bg-card"
    >
      <div className="flex items-center gap-2 border-b border-[var(--hairline)] px-3 py-1.5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground/65">
          {tr("dck.droneTitle", { name: d.spec.name })}
        </h2>
        <Badge tone="sim">{tr("res.sim")}</Badge>
        <div className="ml-auto flex gap-1" role="group" aria-label={tr("dck.active")}>
          {FLEET.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={f.id === d.spec.id}
              onClick={() => ctx.setActiveDrone(f.id)}
              className={`rounded-md px-2 py-2 text-[10.5px] font-medium transition-colors sm:py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${f.id === d.spec.id ? "bg-foreground text-background" : "text-foreground/55 hover:bg-foreground/[0.06]"}`}
            >
              {f.name.replace("SNT-", "")}
            </button>
          ))}
        </div>
      </div>
      <div className="grid h-[132px] grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_270px]">
        <Mini {...miniProps} title={tr("dck.alt")} unit="m" color="#0f7a4f" data={series.alt} />
        <div className="hidden h-full min-h-0 border-l border-[var(--hairline)] sm:block">
          <Mini
            {...miniProps}
            title={tr("dck.temp")}
            unit="°C"
            color="#c8321e"
            data={series.temp}
          />
        </div>
        <div className="hidden h-full min-h-0 border-l border-[var(--hairline)] sm:block">
          <Mini
            {...miniProps}
            title={tr("drw.battery")}
            unit="%"
            color="#1b6fb8"
            data={series.bat}
            domain={[0, 100]}
          />
        </div>
        <div className="hidden h-full min-h-0 overflow-y-auto border-l border-[var(--hairline)] px-3 pb-2 pt-2 sm:block">
          <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.09em] text-foreground/65">
            {tr("dck.near")}
          </h3>
          {detections.length === 0 && (
            <p className="text-[11px] text-foreground/60">
              {d.track ? tr("dck.noNear") : tr("dck.grounded")}
            </p>
          )}
          <ul className="space-y-0.5">
            {detections.map((x) => (
              <li key={x.id} className="flex items-center gap-2 text-[11px]">
                <Flame className="size-3 shrink-0 text-[#c8321e]" aria-hidden />
                <span className="num font-medium">
                  {tr("dck.hotspot", { n: x.temp })}
                </span>
                <span className="num ml-auto text-foreground/45">
                  {x.km.toFixed(1)} km
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** Resources dock: simulated operation charts and the dispatch log. */
export function ResourcesDock({ ctx }: { ctx: Ctx }) {
  const { t: tr } = ctx;
  const loc = NUM_LOCALE[ctx.ws.settings.locale];
  const miniProps = { loc, noData: tr("fc.noData"), noActivity: tr("dck.noActivity") };
  const minute = Math.floor(ctx.now / 60_000) * 60_000;
  const s = useMemo(() => opsSeries(ctx.units, minute), [ctx.units, minute]);
  const people: Pt[] = s.map((x) => ({ t: x.t, v: x.people }));
  const water: Pt[] = s.map((x) => ({ t: x.t, v: x.water }));
  const line: Pt[] = s.map((x) => ({ t: x.t, v: x.lineKm }));
  return (
    <section
      aria-label={tr("dck.opsAria")}
      className="shrink-0 border-t border-[var(--hairline)] bg-card"
    >
      <div className="flex items-center gap-2 border-b border-[var(--hairline)] px-3 py-1.5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground/65">
          {tr("dck.opsTitle")}
        </h2>
        <Badge tone="sim">{tr("res.sim")}</Badge>
      </div>
      <div className="grid grid-cols-1 grid-rows-[96px_auto] sm:h-[132px] sm:grid-rows-none sm:grid-cols-[1fr_1fr_1fr_270px]">
        <Mini
          {...miniProps}
          title={tr("dck.people")} hm
          unit={tr("dck.persUnit")}
          color="#0f7a4f"
          data={people}
          step
        />
        <div className="hidden h-full min-h-0 border-l border-[var(--hairline)] sm:block">
          <Mini
            {...miniProps}
            title={tr("dck.water")} hm
            unit="L"
            color="#1b6fb8"
            data={water}
            step
          />
        </div>
        <div className="hidden h-full min-h-0 border-l border-[var(--hairline)] sm:block">
          <Mini
            {...miniProps}
            title={tr("dck.line")} hm
            unit="km"
            color="#e8710a"
            data={line}
          />
        </div>
        <div className="flex max-h-24 min-h-0 flex-col border-t border-[var(--hairline)] px-3 pb-2 pt-2 sm:max-h-none sm:border-l sm:border-t-0">
          <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.09em] text-foreground/65">
            {tr("dck.log")}
          </h3>
          {ctx.opsLog.length === 0 && (
            <p className="text-[11px] text-foreground/60">
              {tr("dck.logEmpty")}
            </p>
          )}
          <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
            {ctx.opsLog.map((e) => (
              <li key={e.id} className="text-[10.5px] leading-snug">
                <span className="num mr-1.5 text-foreground/60">
                  {new Date(e.t).toLocaleTimeString(loc, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {e.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
