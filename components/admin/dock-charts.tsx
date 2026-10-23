"use client";

// Everything that touches recharts for the docks lives here so it loads as its own chunk
// (next/dynamic from dock-timeline.tsx and docks.tsx): recharts is ~200 kB of JS the first paint does not need.
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HourPoint } from "./ctx";

const AXIS = { fontSize: 9.5, fill: "var(--chart-axis)" };
const TIP = {
  fontSize: 11,
  borderRadius: 8,
  border: "1px solid var(--hairline)",
  background: "var(--chart-tip)",
  color: "var(--foreground)",
  boxShadow: "var(--shadow-2)",
};
const MARGIN = { top: 4, right: 6, left: 0, bottom: 0 };

function Fill({ id, color }: { id: string; color: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity={0.4} />
        <stop offset="100%" stopColor={color} stopOpacity={0.02} />
      </linearGradient>
    </defs>
  );
}

export function TimelineAreaChart({
  data,
  id,
  color,
  dataKey,
  unit,
  title,
  range,
  cursor,
  step,
  fmtDay,
  fmtFull,
}: {
  data: HourPoint[];
  id: string;
  color: string;
  dataKey: "cum" | "count" | "frp";
  unit: string;
  title: string;
  range: { t0: number; t1: number };
  cursor: number | null;
  step?: boolean;
  fmtDay: (t: number) => string;
  fmtFull: (t: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={MARGIN}>
        <Fill id={id} color={color} />
        <XAxis
          dataKey="t"
          type="number"
          domain={[range.t0, range.t1]}
          scale="time"
          tickFormatter={(v) => fmtDay(Number(v))}
          tick={AXIS}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          tickCount={5}
          minTickGap={34}
        />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={34} tickCount={3} />
        <Tooltip
          contentStyle={TIP}
          labelFormatter={(t) => fmtFull(Number(t))}
          formatter={(v) => [`${v} ${unit}`, title]}
        />
        <Area
          type={step ? "stepAfter" : "monotone"}
          dataKey={dataKey}
          stroke={color}
          strokeWidth={1.6}
          fill={`url(#${id})`}
          isAnimationActive={false}
        />
        <ReferenceLine x={cursor ?? range.t1} stroke="var(--fire)" strokeWidth={1.4} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TelemetryAreaChart({
  data,
  id,
  color,
  unit,
  title,
  domain,
  step,
  hm,
  loc,
}: {
  data: { t: number; v: number }[];
  id: string;
  color: string;
  unit: string;
  title: string;
  domain?: [number, number];
  step?: boolean;
  hm?: boolean;
  loc: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={MARGIN}>
        <Fill id={id} color={color} />
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
            new Date(t).toLocaleTimeString(
              loc,
              hm ? { hour: "2-digit", minute: "2-digit" } : { minute: "2-digit", second: "2-digit" },
            )
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
          labelFormatter={(t) => new Date(Number(t)).toLocaleTimeString(loc)}
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
  );
}
