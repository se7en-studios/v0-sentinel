"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Flame,
  MapPin,
  Pause,
  Play,
  Radio,
  SkipBack,
  SkipForward,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HOUR_MS, artTicks, earlyMarks } from "@/lib/admin/timeline-marks";
import type { Ctx, HourPoint, KeyEvent } from "./ctx";
import { IconBtn, Segmented } from "./ui";

const AXIS = { fontSize: 9.5, fill: "var(--chart-axis)" };
const TIP = {
  fontSize: 11,
  borderRadius: 8,
  border: "1px solid var(--hairline)",
  background: "var(--chart-tip)",
  color: "var(--foreground)",
  boxShadow: "var(--shadow-2)",
};
const HOUR = HOUR_MS;
const MINOR_STEP_H = 6;
/** more 6 h ticks than this would sit under ~6 px apart: draw only the day marks */
const MAX_MINOR_TICKS = 60;
/** hour labels collide with the day labels past this many ticks (about 3 days) */
const MAX_LABELLED_TICKS = 12;

// every time on screen is Argentine local time (ART), whatever the browser says
const TZ = "America/Argentina/Buenos_Aires";
const fmtDay = (t: number) =>
  new Date(t).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    timeZone: TZ,
  });
const fmtFull = (t: number) =>
  new Date(t).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: TZ,
  });
const fmtHour = (t: number) =>
  new Date(t).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    hourCycle: "h23",
    timeZone: TZ,
  });

const EVENT_ICON = {
  first: Flame,
  peak: Activity,
  frp: Zap,
  zone: MapPin,
  sensor: Radio,
} as const;
const EVENT_TONE = {
  first: "#e8710a",
  peak: "#c9a300",
  frp: "#c8321e",
  zone: "#b83a3a",
  sensor: "#0e9aa7",
} as const;

/** Time scrubber: day ticks, event markers and a draggable playhead. */
function Scrubber({ ctx }: { ctx: Ctx }) {
  const { range, cursor, events } = ctx;
  const track = useRef<HTMLDivElement>(null);
  const span = range.t1 - range.t0;
  // 0.1% steps: the server and the browser render a few seconds apart, and the range ends at the clock
  const at = (t: number) => Math.round(((t - range.t0) / span) * 1000) / 10;
  const days = useMemo(() => artTicks(range.t0, range.t1, 24 * HOUR), [range]);
  const minor = useMemo(() => {
    const all = artTicks(range.t0, range.t1, MINOR_STEP_H * HOUR);
    const dayTicks = new Set(days);
    return all.length > MAX_MINOR_TICKS
      ? []
      : all.filter((t) => !dayTicks.has(t));
  }, [range, days]);
  const marks = useMemo(
    () => earlyMarks(ctx.early, range.t0, range.t1),
    [ctx.early, range],
  );

  const seek = (clientX: number) => {
    const r = track.current?.getBoundingClientRect();
    if (!r) return;
    const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    ctx.setPlaying(false);
    ctx.setCursor(f >= 0.995 ? null : range.t0 + f * span);
  };

  const head = cursor ?? range.t1;
  return (
    <div className="relative flex-1 select-none px-3 pb-1 pt-5 max-sm:order-last max-sm:basis-full">
      <div
        ref={track}
        role="slider"
        suppressHydrationWarning // range ends at Date.now(), differs between server and client
        tabIndex={0}
        aria-label="Línea de tiempo de detecciones"
        aria-valuemin={range.t0}
        aria-valuemax={range.t1}
        aria-valuenow={head}
        aria-valuetext={`${fmtFull(head)} hs (hora de Argentina)`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          seek(e.clientX);
        }}
        onPointerMove={(e) => e.buttons === 1 && seek(e.clientX)}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 24 * HOUR : 3 * HOUR;
          if (e.key === "ArrowRight")
            ctx.setCursor(Math.min(range.t1, head + step));
          if (e.key === "ArrowLeft")
            ctx.setCursor(Math.max(range.t0, head - step));
          if (e.key === "Home") ctx.setCursor(range.t0);
          if (e.key === "End") ctx.setCursor(null);
          if (e.key.startsWith("Arrow") || e.key === "Home" || e.key === "End")
            e.preventDefault();
        }}
        className="relative h-6 cursor-ew-resize rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-foreground/[0.09]" />
        <div
          className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--fire)]/70"
          style={{ width: `${at(head)}%` }}
        />
        {minor.map((t) => (
          <div
            key={t}
            className="absolute top-1/2 -translate-x-1/2"
            style={{ left: `${at(t)}%` }}
            aria-hidden
          >
            <div className="h-1 w-px -translate-y-1/2 bg-foreground/15" />
            <span
              className="num absolute left-1/2 top-2 -translate-x-1/2 text-[8px] text-foreground/30 max-sm:hidden"
              hidden={minor.length > MAX_LABELLED_TICKS}
            >
              {fmtHour(t)}
            </span>
          </div>
        ))}
        {marks.map((m) => (
          <button
            key={m.id}
            type="button"
            tabIndex={-1}
            title={`${m.kind === "first" ? "Alerta temprana detectada" : "Alerta confirmada por satélite polar"} · ${fmtFull(m.t)} hs`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              ctx.setPlaying(false);
              ctx.setCursor(m.t);
              ctx.map.current?.flyTo(m.at, 11);
            }}
            className={cn(
              "absolute -top-2.5 z-10 size-2 -translate-x-1/2 rotate-45 border transition-transform hover:scale-150 max-sm:size-2.5",
              m.kind === "first"
                ? "border-[#0b1f26] bg-[#22d3ee]"
                : "border-[#22d3ee] bg-[#0b1f26]",
            )}
            style={{ left: `${at(m.t)}%` }}
          />
        ))}
        {days.map((t) => (
          <div
            key={t}
            className="absolute top-1/2 -translate-x-1/2"
            style={{ left: `${at(t)}%` }}
          >
            <div className="h-2 w-px -translate-y-1/2 bg-foreground/25" />
            <span className="num absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap text-[9.5px] text-foreground/40">
              {fmtDay(t)}
            </span>
          </div>
        ))}
        {events.map((ev) => (
          <button
            key={ev.id}
            type="button"
            tabIndex={-1}
            title={`${ev.title} · ${fmtFull(ev.t)}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => ctx.setCursor(ev.t)}
            className="absolute -top-0.5 z-10 size-2.5 -translate-x-1/2 rounded-full border border-card shadow-sm transition-transform hover:scale-150"
            style={{ left: `${at(ev.t)}%`, background: EVENT_TONE[ev.kind] }}
          />
        ))}
        <div
          className="pointer-events-none absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${at(head)}%` }}
        >
          <div className="size-3.5 rounded-full border-2 border-card bg-[var(--fire)] shadow-md" />
          <div
            className="num absolute -top-6 left-1/2 whitespace-nowrap rounded-md bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background"
            // keep the bubble inside the track at both ends (390 px screens clipped it)
            style={{
              transform: `translateX(${at(head) > 85 ? "-88%" : at(head) < 15 ? "-12%" : "-50%"})`,
            }}
          >
            {cursor === null ? "En vivo" : `${fmtFull(cursor)} hs`}
          </div>
        </div>
      </div>
    </div>
  );
}

// memo: recharts is the costliest thing in the dock and only needs data, range and cursor
const MiniChart = memo(function MiniChart({
  title,
  data,
  dataKey,
  color,
  unit,
  range,
  cursor,
  step,
}: {
  title: string;
  data: HourPoint[];
  dataKey: "cum" | "count" | "frp";
  color: string;
  unit: string;
  range: Ctx["range"];
  cursor: Ctx["cursor"];
  step?: boolean;
}) {
  const id = `g-${dataKey}`;
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col px-3 pb-1.5 pt-2">
      <div className="mb-0.5 flex items-baseline justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.09em] text-foreground/50">
          {title}
        </h3>
        <span className="text-[9.5px] text-foreground/35">{unit}</span>
      </div>
      <div className="min-h-0 flex-1">
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
              domain={[range.t0, range.t1]}
              scale="time"
              tickFormatter={fmtDay}
              tick={AXIS}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              tickCount={5}
              minTickGap={34}
            />
            <YAxis
              tick={AXIS}
              tickLine={false}
              axisLine={false}
              width={34}
              tickCount={3}
            />
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
            <ReferenceLine
              x={cursor ?? range.t1}
              stroke="var(--fire)"
              strokeWidth={1.4}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

function EventsList({ ctx }: { ctx: Ctx }) {
  return (
    <div className="flex min-h-0 flex-col border-l border-[var(--hairline)] px-3 pb-2 pt-2">
      <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.09em] text-foreground/50">
        Eventos clave
      </h3>
      {ctx.events.length === 0 && (
        <p className="text-[11px] text-foreground/40">
          Sin eventos en el período.
        </p>
      )}
      <ul className="-mx-1 min-h-0 flex-1 space-y-px overflow-y-auto">
        {ctx.events.map((ev: KeyEvent) => {
          const Icon = EVENT_ICON[ev.kind];
          const active =
            ctx.cursor !== null && Math.abs(ctx.cursor - ev.t) < HOUR;
          return (
            <li key={ev.id}>
              <button
                type="button"
                onClick={() => {
                  ctx.setCursor(ev.t);
                  ctx.setPlaying(false);
                  if (ev.at) ctx.map.current?.flyTo(ev.at, 11);
                  const f = ev.featId
                    ? ctx.ws.features.find((x) => x.id === ev.featId)
                    : undefined;
                  if (f) ctx.map.current?.fitFeature(f);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-foreground/[0.05]",
                  active && "bg-[var(--fire-soft)]",
                )}
              >
                <Icon
                  className="size-3 shrink-0"
                  style={{ color: EVENT_TONE[ev.kind] }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-[11px] font-medium">
                  {ev.title}
                </span>
                <span className="num shrink-0 text-[10px] text-foreground/40">
                  {fmtFull(ev.t)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** True when the key press belongs to something else: a field, a button, a dialog or the map canvas arrows. */
const isForeignTarget = (el: EventTarget | null, key: string) => {
  if (!(el instanceof HTMLElement)) return false;
  if (
    el.isContentEditable ||
    el.closest(
      "input,textarea,select,[role=dialog],[role=menu],[role=listbox],button,a,[role=slider]",
    )
  )
    return true;
  // arrows pan the focused map; only Space is shared with it
  return key !== " " && el.tagName === "CANVAS";
};

/** Space plays / pauses, arrows move the cursor 1 h (Shift: 6 h) while nothing else owns the key. */
function useTimelineKeys(ctx: Ctx) {
  const ref = useRef(ctx);
  useEffect(() => {
    ref.current = ctx;
  });
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key !== " " && e.key !== "ArrowLeft" && e.key !== "ArrowRight")
        return;
      if (isForeignTarget(e.target, e.key)) return;
      const c = ref.current;
      e.preventDefault();
      if (e.key === " ") {
        if (!c.playing && c.cursor === null) c.setCursor(c.range.t0);
        c.setPlaying(!c.playing);
        return;
      }
      const d = (e.shiftKey ? 6 : 1) * HOUR * (e.key === "ArrowRight" ? 1 : -1);
      c.setPlaying(false);
      c.setCursor(
        Math.min(
          c.range.t1,
          Math.max(c.range.t0, (c.cursor ?? c.range.t1) + d),
        ),
      );
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);
}

export function TimelineDock({ ctx }: { ctx: Ctx }) {
  const { series, cursor, range } = ctx;
  const live = cursor === null;
  useTimelineKeys(ctx);
  const step = (dir: 1 | -1) =>
    ctx.setCursor(
      Math.min(
        range.t1,
        Math.max(range.t0, (cursor ?? range.t1) + dir * 6 * HOUR),
      ),
    );
  return (
    <section
      aria-label="Línea de tiempo"
      className="shrink-0 border-t border-[var(--hairline)] bg-card"
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-[var(--hairline)] pl-2 pr-1 sm:flex-nowrap">
        <h2 className="mr-2 hidden text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground/50 sm:block">
          Línea de tiempo
          <span className="ml-1 font-normal normal-case tracking-normal text-foreground/35">
            (hora ART)
          </span>
        </h2>
        <IconBtn aria-label="Retroceder 6 horas" onClick={() => step(-1)}>
          <SkipBack className="size-3.5" />
        </IconBtn>
        <IconBtn
          aria-label={ctx.playing ? "Pausar" : "Reproducir"}
          active={ctx.playing}
          className="bg-foreground text-background hover:bg-foreground/85 hover:text-background"
          onClick={() => {
            if (!ctx.playing && live) ctx.setCursor(range.t0);
            ctx.setPlaying(!ctx.playing);
          }}
        >
          {ctx.playing ? (
            <Pause className="size-3.5" />
          ) : (
            <Play className="size-3.5 translate-x-px" />
          )}
        </IconBtn>
        <IconBtn aria-label="Avanzar 6 horas" onClick={() => step(1)}>
          <SkipForward className="size-3.5" />
        </IconBtn>
        <Segmented
          label="Velocidad"
          value={ctx.speed}
          onChange={ctx.setSpeed}
          className="ml-1 w-[136px]"
          options={[1, 2, 4, 8].map((v) => ({ value: v, label: `${v}×` }))}
        />
        <Scrubber ctx={ctx} />
        <button
          type="button"
          onClick={() => {
            ctx.setPlaying(false);
            ctx.setCursor(null);
          }}
          aria-pressed={live}
          className={cn(
            "mr-1 flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold transition-colors",
            live
              ? "border-[var(--fire)]/40 bg-[var(--fire-soft)] text-[var(--fire)]"
              : "border-[var(--hairline)] text-foreground/60 hover:bg-foreground/[0.05]",
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full bg-[var(--fire)]",
              live && "animate-pulse",
            )}
          />
          En vivo
        </button>
        <span className="mr-2 hidden text-[10px] text-foreground/35 xl:inline">
          Espacio ▶/❚❚ · ←/→ 1 h
        </span>
      </div>
      <div className="grid h-[132px] grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_270px]">
        <MiniChart
          title="Focos acumulados"
          data={series}
          dataKey="cum"
          color="#e8710a"
          unit="focos"
          range={range}
          cursor={cursor}
        />
        <div className="hidden h-full min-h-0 border-l border-[var(--hairline)] sm:block">
          <MiniChart
            title="Detección por hora"
            data={series}
            dataKey="count"
            color="#c9a300"
            unit="focos/h"
            range={range}
            cursor={cursor}
            step
          />
        </div>
        <div className="hidden h-full min-h-0 border-l border-[var(--hairline)] sm:block">
          <MiniChart
            title="Potencia radiativa"
            data={series}
            dataKey="frp"
            color="#c8321e"
            unit="MW/h"
            range={range}
            cursor={cursor}
          />
        </div>
        <div className="hidden h-full min-h-0 sm:block">
          <EventsList ctx={ctx} />
        </div>
      </div>
    </section>
  );
}
