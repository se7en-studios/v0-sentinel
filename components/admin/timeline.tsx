"use client";

import { useEffect, useMemo, useState } from "react";
import { Pause, Play } from "lucide-react";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import { cn } from "@/lib/utils";
import type { Ctx } from "./ctx";

const AXIS = { fontSize: 10, fill: "var(--chart-axis)" };
const TIP = {
  fontSize: 11,
  borderRadius: 6,
  border: "1px solid var(--border)",
  background: "var(--chart-tip)", color: "var(--foreground)",
};

export function Timeline({ ctx }: { ctx: Ctx }) {
  const { stats, dayFilter, setDayFilter, payload } = ctx;
  const data = useMemo(() => stats.perDay.map((d, i) => ({ ...d, i })), [stats.perDay]);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing || data.length === 0) return;
    const t = setInterval(() => setDayFilter(((dayFilter ?? -1) + 1) % data.length), 1100);
    return () => clearInterval(t);
  }, [playing, dayFilter, data.length, setDayFilter]);
  return (
    <div
      className="grid shrink-0 grid-cols-1 gap-px border-t border-border bg-border sm:grid-cols-3"
      aria-label="Línea de tiempo de detecciones"
    >
      <div className="bg-background px-3 pb-1 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[10.5px] font-semibold uppercase tracking-wider text-foreground/55">
            Focos por día · click para filtrar
          </h3>
          <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              if (!playing && dayFilter === null) setDayFilter(0);
              setPlaying((v) => !v);
            }}
            aria-label={playing ? "Pausar reproducción" : "Reproducir los 10 días"}
            className="grid size-5 place-items-center rounded bg-primary/12 text-primary hover:bg-primary/20"
          >
            {playing ? <Pause className="size-3" /> : <Play className="size-3" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setDayFilter(null);
            }}
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-medium",
              dayFilter === null
                ? "bg-primary/12 text-primary"
                : "text-foreground/55 hover:bg-foreground/5",
            )}
          >
            10 días
          </button>
          </div>
        </div>
        <div className="h-[104px]">
          {payload ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 6, right: 4, left: -22, bottom: 0 }}
              >
                <XAxis
                  dataKey="label"
                  tick={AXIS}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={TIP}
                  cursor={{ fill: "rgba(15,122,79,0.08)" }}
                  formatter={(v) => [v, "focos"]}
                />
                <Bar
                  dataKey="count"
                  radius={[3, 3, 0, 0]}
                  onClick={(_, i) => setDayFilter(dayFilter === i ? null : i)}
                  cursor="pointer"
                >
                  {data.map((d) => (
                    <Cell
                      key={d.day}
                      fill={
                        dayFilter === null || dayFilter === d.i
                          ? "#e8710a"
                          : "rgba(232,113,10,0.28)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty />
          )}
        </div>
      </div>
      <div className="hidden bg-background px-3 pb-1 pt-2 sm:block">
        <h3 className="text-[10.5px] font-semibold uppercase tracking-wider text-foreground/55">
          Potencia radiativa (FRP, MW)
        </h3>
        <div className="h-[104px]">
          {payload ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 6, right: 4, left: -18, bottom: 0 }}
              >
                <XAxis
                  dataKey="label"
                  tick={AXIS}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={TIP}
                  formatter={(v) => [`${v} MW`, "FRP total"]}
                />
                <Area
                  dataKey="frp"
                  stroke="#b83a3a"
                  fill="rgba(184,58,58,0.18)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Empty />
          )}
        </div>
      </div>
      <div className="hidden bg-background px-3 pb-1 pt-2 sm:block">
        <h3 className="text-[10.5px] font-semibold uppercase tracking-wider text-foreground/55">
          Hora del día (ART)
        </h3>
        <div className="h-[104px]">
          {payload ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.perHour}
                margin={{ top: 6, right: 4, left: -22, bottom: 0 }}
              >
                <XAxis
                  dataKey="hour"
                  tick={AXIS}
                  tickLine={false}
                  axisLine={false}
                  interval={3}
                />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={TIP}
                  labelFormatter={(h) => `${h}:00 hs`}
                  formatter={(v) => [v, "focos"]}
                />
                <Bar isAnimationActive={false} dataKey="count" fill="#0f7a4f" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty />
          )}
        </div>
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="grid h-full place-items-center text-[11px] text-foreground/40">
      Sin datos satelitales
    </div>
  );
}
