"use client";

// Bottom dock of the "Incendios" tab, laid out like Sentinel's TimelineDock:
// a header row, then three mini charts and a list. With no fire selected it
// sums up the whole country; with one, it replays that fire.

import { useMemo, useRef, type ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Flame, GitMerge, Moon, MousePointerClick, Pause, Play, SkipBack, SkipForward, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { NUM_LOCALE } from "@/lib/admin/i18n-shell";
import type { Locale, Translate } from "@/lib/admin/i18n";
import type { LiveBundle, LiveFireMeta } from "@/lib/incident";
import { eventViews, type EventView } from "./events";
import type { ChartRow, Derived } from "./derive";
import { fmtDay, fmtDayTime, fmtInt, fmtRos, fmtTick, fmtTime, focos, halfLabel } from "./format";
import { IconBtn, Segmented } from "../ui";
import type { Tracking } from "./use-tracking";

const HOUR = 3_600_000;
// the same two colours as the fire circles on the map
const KIND_COLOR = { forestal: "#c2410c", agricola: "#e0a526" };
const tick = { fontSize: 9, fill: "var(--chart-axis)" };

// the language travels as a translator plus the BCP 47 tag for numbers and dates
interface L {
  tr: Translate;
  loc: string;
}

export function IncendiosDock({ t, tr, locale }: { t: Tracking; tr: Translate; locale: Locale }) {
  const d = t.d;
  const l: L = { tr, loc: NUM_LOCALE[locale] };
  return (
    <section aria-label={tr(d ? "trk.dock.fire" : "trk.dock.national")} className="shrink-0 border-t border-[var(--hairline)] bg-card">
      {d ? (
        <>
          <FireControls t={t} d={d} {...l} />
          <FireCharts t={t} d={d} height={150} {...l} />
        </>
      ) : t.live ? (
        <>
          <NationalHeader t={t} {...l} />
          <NationalCharts t={t} live={t.live} height={150} provinces {...l} />
        </>
      ) : (
        <Hint loading={!t.error} tr={tr} />
      )}
    </section>
  );
}

function Hint({ loading, tr }: { loading: boolean; tr: Translate }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3 text-[11.5px] text-foreground/55">
      <MousePointerClick className="size-4 shrink-0 text-foreground/40" />
      {tr(loading ? "trk.dock.loading" : "trk.dock.empty")}
    </div>
  );
}

// ---------- the whole country ----------

interface DayRow {
  day: string;
  label: string;
  forestal: number;
  agricola: number;
  fires: number;
  frp: number;
  today: boolean;
}

/** Detections, fires with activity and FRP per (Argentine) day over the live window, for the fires on show. */
function nationalDays(b: LiveBundle, shown: LiveFireMeta[], loc: string): DayRow[] {
  const kind = new Map(shown.map((m) => [m.id, m.forestal]));
  const dayKey = (ms: number) => new Date(ms - 3 * HOUR).toISOString().slice(0, 10);
  const rows = new Map<string, DayRow & { ids: Set<number> }>();
  const add = (key: string) =>
    rows.has(key) || rows.set(key, { day: key, label: fmtDay(Date.parse(`${key}T12:00:00-03:00`), loc), forestal: 0, agricola: 0, fires: 0, frp: 0, today: false, ids: new Set() });
  for (let x = b.live.windowStart + 24 * HOUR; x <= b.live.windowEnd + 1; x += 24 * HOUR) add(dayKey(x));
  add(dayKey(b.live.windowEnd));
  for (const p of b.pixels) {
    const forestal = kind.get(p[7]);
    if (forestal === undefined) continue;
    const r = rows.get(dayKey(b.t0 + p[2] * 60_000));
    if (!r) continue;
    if (forestal) r.forestal++;
    else r.agricola++;
    r.frp += p[4];
    r.ids.add(p[7]);
  }
  const out = [...rows.values()].map(({ ids, ...r }) => ({ ...r, fires: ids.size, frp: Math.round(r.frp) }));
  if (out.length) out[out.length - 1].today = true;
  return out;
}

export interface Province {
  name: string;
  focos: number;
  activos: number;
  fires: number;
  bbox: [number, number, number, number];
}

/** Provinces ranked by detections in the last 24 h (by each fire's nearest town). */
export function byProvince(shown: LiveFireMeta[]): Province[] {
  const out = new Map<string, Province>();
  for (const f of shown) {
    const p = out.get(f.province) ?? { name: f.province, focos: 0, activos: 0, fires: 0, bbox: [...f.bbox] as Province["bbox"] };
    p.focos += f.detections24h;
    p.fires++;
    if (f.activity === "ahora") p.activos++;
    p.bbox = [Math.min(p.bbox[0], f.bbox[0]), Math.min(p.bbox[1], f.bbox[1]), Math.max(p.bbox[2], f.bbox[2]), Math.max(p.bbox[3], f.bbox[3])];
    out.set(f.province, p);
  }
  return [...out.values()].sort((a, b) => b.focos - a.focos || b.activos - a.activos || b.fires - a.fires);
}

function NationalHeader({ t, tr, loc }: { t: Tracking } & L) {
  const days = useMemo(() => (t.live ? nationalDays(t.live, t.shown, loc) : []), [t.live, t.shown, loc]);
  return (
    <div className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--hairline)] px-3 py-2 sm:h-14 sm:flex-nowrap sm:py-0">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground/50">{tr("trk.dock.national")}</h2>
      <span className="num text-[11px] text-foreground/45">
        {days[0]?.label}–{days.at(-1)?.label} · {tr(t.filter === "todos" ? "trk.dock.all" : t.filter === "forestales" ? "trk.dock.forestOnly" : "trk.dock.agriOnly")}
      </span>
      <span className="flex items-center gap-1.5 text-[11.5px] text-foreground/60 sm:ml-auto">
        <MousePointerClick className="size-3.5 shrink-0 text-foreground/45" aria-hidden />
        {tr("trk.dock.pick")}
      </span>
    </div>
  );
}

export function NationalCharts({ t, live, height, provinces, tr, loc }: { t: Tracking; live: LiveBundle; height: number; provinces?: boolean } & L) {
  const days = useMemo(() => nationalDays(live, t.shown, loc), [live, t.shown, loc]);
  const list = useMemo(() => byProvince(t.shown), [t.shown]);
  const focosBars = [
    ...(t.filter !== "agricolas" ? [{ key: "forestal" as const, color: KIND_COLOR.forestal, name: tr("trk.dock.forestal") }] : []),
    ...(t.filter !== "forestales" ? [{ key: "agricola" as const, color: KIND_COLOR.agricola, name: tr("trk.dock.agricola") }] : []),
  ];
  return (
    <div className={cn("grid grid-cols-1", provinces ? "sm:grid-cols-[1fr_1fr_1fr_270px]" : "sm:grid-cols-3")} style={{ height }}>
      <DayChart title={tr("trk.dock.fociDay")} unit={tr("trk.dock.fociUnit")} data={days} bars={focosBars} tr={tr} loc={loc} />
      <div className="hidden h-full min-h-0 border-l border-[var(--hairline)] sm:block">
        <DayChart title={tr("trk.dock.firesActive")} unit={tr("trk.dock.perDay")} data={days} bars={[{ key: "fires", color: "#e8710a", name: tr("trk.dock.firesName") }]} tr={tr} loc={loc} />
      </div>
      <div className="hidden h-full min-h-0 border-l border-[var(--hairline)] sm:block">
        <DayChart title={tr("trk.dock.frp")} unit="MW" data={days} bars={[{ key: "frp", color: "#c8321e", name: "MW" }]} tr={tr} loc={loc} />
      </div>
      {provinces && (
        <div className="hidden h-full min-h-0 border-l border-[var(--hairline)] sm:block">
          <Provinces list={list} onPick={(p) => t.fitTo(p.bbox)} tr={tr} loc={loc} />
        </div>
      )}
    </div>
  );
}

function DayChart({ title, unit, data, bars, tr, loc }: { title: string; unit: string; data: DayRow[]; bars: { key: keyof DayRow; color: string; name: string }[] } & L) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col px-3 pb-1.5 pt-2">
      <div className="mb-0.5 flex items-baseline justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.09em] text-foreground/50">{title}</h3>
        <span className="text-[9.5px] text-foreground/35">{unit}</span>
      </div>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 2, bottom: 2, left: 0 }} barCategoryGap="18%">
            <XAxis dataKey="day" tick={tick} tickFormatter={(v: string) => String(Number(v.slice(8)))} interval={0} axisLine={false} tickLine={false} height={16} />
            <YAxis width={30} tick={tick} tickFormatter={(v: number) => fmtTick(v, loc)} axisLine={false} tickLine={false} />
            <Tooltip content={<DayTip bars={bars} tr={tr} loc={loc} />} cursor={{ fill: "var(--foreground)", fillOpacity: 0.05 }} />
            {bars.map((b, i) => (
              <Bar key={String(b.key)} dataKey={b.key as string} stackId="d" fill={b.color} isAnimationActive={false} radius={i === bars.length - 1 ? [2, 2, 0, 0] : 0}>
                {data.map((r) => (
                  <Cell key={r.day} fillOpacity={r.today ? 1 : 0.62} />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DayTip({ active, payload, bars, tr, loc }: { active?: boolean; payload?: { payload: DayRow }[]; bars: { key: keyof DayRow; color: string; name: string }[] } & L) {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  return (
    <div className="rounded-md border border-[var(--hairline)] bg-[var(--chart-tip)] px-2 py-1 text-[10.5px] shadow-[var(--shadow-2)]">
      <div className="font-semibold">{r.today ? tr("trk.dock.todayTip", { label: r.label }) : r.label}</div>
      {bars.map((b) => (
        <div key={String(b.key)} className="num flex items-center gap-1.5 text-foreground/65">
          <span className="size-2 rounded-full" style={{ background: b.color }} />
          {fmtInt(Number(r[b.key]), loc)} {b.name}
        </div>
      ))}
    </div>
  );
}

export function Provinces({ list, onPick, bare, tr, loc }: { list: Province[]; onPick: (p: Province) => void; bare?: boolean } & L) {
  const max = Math.max(1, ...list.map((p) => p.focos));
  return (
    <div className={cn("flex min-h-0 flex-col", bare ? "" : "h-full px-3 pb-2 pt-2")}>
      <div className="mb-1 flex items-baseline justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.09em] text-foreground/50">{tr("trk.dock.provinces")}</h3>
        <span className="text-[9.5px] text-foreground/35">{tr("trk.dock.fociIn24")}</span>
      </div>
      <ul className={cn("-mx-1 space-y-px", !bare && "min-h-0 flex-1 overflow-y-auto")}>
        {(bare ? list.slice(0, 8) : list).map((p) => (
          <li key={p.name}>
            <button
              onClick={() => onPick(p)}
              title={tr("trk.dock.provTitle", { name: p.name, fires: fmtInt(p.fires, loc), active: fmtInt(p.activos, loc) })}
              className="group relative flex w-full items-center gap-2 overflow-hidden rounded-md px-1 py-1 text-left hover:bg-foreground/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span aria-hidden className="absolute inset-y-1 left-0 rounded-sm bg-[var(--fire)]/10" style={{ width: `${(p.focos / max) * 100}%` }} />
              <span className="relative min-w-0 flex-1 truncate text-[11px] font-medium">{p.name}</span>
              <span className="num relative shrink-0 text-[10px] text-foreground/45">{tr("trk.dock.activeN", { n: fmtInt(p.activos, loc) })}</span>
              <span className="num relative w-8 shrink-0 text-right text-[11px] font-semibold">{fmtInt(p.focos, loc)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- one fire ----------

/** The timeline spans the fire's life, not the whole window: a live fire seen for two days fills the dock instead of a sliver of ten days. */
function useFireWindow(d: Derived, tr: Translate, loc: string) {
  return useMemo(() => {
    const i0 = Math.max(0, d.firstStep - 2);
    const i1 = Math.min(d.b.steps.length - 1, d.lastStep + 2);
    return { i0, i1, rows: d.rows.slice(i0, i1 + 1), events: eventViews(d.fire, d.b.official ? Date.parse(d.b.official.start) : null, tr, loc) };
  }, [d, tr, loc]);
}

export function FireControls({ t, d, right, tr, loc }: { t: Tracking; d: Derived; right?: ReactNode } & L) {
  const { i0, i1, rows, events } = useFireWindow(d, tr, loc);
  const step = d.b.steps[t.cur];
  const own = d.fire.steps.find((s) => s.step === t.cur);
  const go = (i: number) => t.setCur(Math.max(i0, Math.min(i1, i)));
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-[var(--hairline)] pl-2 pr-2 last:border-b-0 sm:h-14 sm:flex-nowrap">
      <h2 className="mr-2 hidden whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground/50 sm:block">{tr("trk.dock.fire")}</h2>
      <IconBtn aria-label={tr("trk.dock.prev")} onClick={() => go(t.cur - 1)}>
        <SkipBack className="size-3.5" />
      </IconBtn>
      <IconBtn
        aria-label={tr(t.playing ? "trk.dock.pause" : "trk.dock.play")}
        active={t.playing}
        className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
        onClick={() => t.play(!t.playing)}
      >
        {t.playing ? <Pause className="size-3.5" /> : <Play className="size-3.5 translate-x-px" />}
      </IconBtn>
      <IconBtn aria-label={tr("trk.dock.next")} onClick={() => go(t.cur + 1)}>
        <SkipForward className="size-3.5" />
      </IconBtn>
      <Segmented label={tr("trk.dock.speed")} value={t.speed} onChange={t.setSpeed} className="ml-1 w-[104px]" options={[1, 2, 4].map((v) => ({ value: v, label: `${v}×` }))} />
      <div className="ml-2 min-w-[150px] leading-tight">
        <div className="num text-[11.5px] font-semibold">
          {step.t0 !== null && step.t1 !== null && step.t1 - step.t0 > 60_000 ? `${fmtDayTime(step.t0, loc)}–${fmtTime(step.t1, loc)}` : fmtDayTime(step.t0 ?? d.stepTime[t.cur], loc)}
        </div>
        <div className="num text-[10px] text-foreground/45">
          {halfLabel(tr, step.half)} · {own ? focos(tr, own.newPixels, loc) : tr("trk.dock.noFoci")}
        </div>
      </div>
      <Scrubber t={t} d={d} rows={rows} i0={i0} i1={i1} events={events} go={go} tr={tr} loc={loc} />
      {right}
    </div>
  );
}

export function FireCharts({ t, d, height, events: withEvents = true, tr, loc }: { t: Tracking; d: Derived; height: number; events?: boolean } & L) {
  const { rows, events } = useFireWindow(d, tr, loc);
  return (
    <div className={cn("grid grid-cols-1", withEvents ? "sm:grid-cols-[1fr_1fr_1fr_270px]" : "sm:grid-cols-3")} style={{ height }}>
      <MiniChart title={tr("trk.dock.area")} unit="ha" data={rows} dataKey="areaHa" color="#e8710a" cur={t.cur} refY={d.b.official?.areaHa} refLabel={tr("trk.dock.official")} loc={loc} />
      <div className="hidden h-full min-h-0 border-l border-[var(--hairline)] sm:block">
        <MiniChart title={tr("trk.dock.maxAdv")} unit="m/h" data={rows} dataKey="rosMax" color="#c9a300" cur={t.cur} bars fmt={(v) => fmtRos(v, loc)} loc={loc} />
      </div>
      <div className="hidden h-full min-h-0 border-l border-[var(--hairline)] sm:block">
        <MiniChart title={tr("trk.dock.frp")} unit="MW" data={rows} dataKey="frp" color="#c8321e" cur={t.cur} bars loc={loc} />
      </div>
      {withEvents && (
        <div className="hidden h-full min-h-0 sm:block">
          <Events events={events} cur={t.cur} setCur={t.setCur} tr={tr} loc={loc} />
        </div>
      )}
    </div>
  );
}

function Scrubber({ t, d, rows, i0, i1, events, go, tr, loc }: { t: Tracking; d: Derived; rows: ChartRow[]; i0: number; i1: number; events: EventView[]; go: (i: number) => void } & L) {
  const ref = useRef<HTMLDivElement>(null);
  const n = i1 - i0 + 1;
  const maxN = Math.max(1, ...rows.map((r) => r.nuevo + r.persistente + r.reactivado));
  const pct = (i: number) => ((i - i0 + 0.5) / n) * 100;
  const pick = (x: number) => {
    const r = ref.current!.getBoundingClientRect();
    go(i0 + Math.floor(((x - r.left) / r.width) * n));
  };
  const days = d.b.steps.filter((s) => s.half === "AM" && s.index >= i0 && s.index <= i1);
  const every = Math.ceil(days.length / 8);
  return (
    <div className="relative min-w-[200px] flex-1 select-none px-2 pb-4 pt-2 max-sm:order-last max-sm:basis-full">
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label={tr("trk.dock.moment")}
        aria-valuemin={1}
        aria-valuemax={n}
        aria-valuenow={t.cur - i0 + 1}
        aria-valuetext={fmtDayTime(d.stepTime[t.cur], loc)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(t.cur + 1);
          if (e.key === "ArrowLeft") go(t.cur - 1);
          if (e.key === "Home") go(i0);
          if (e.key === "End") go(i1);
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          pick(e.clientX);
        }}
        onPointerMove={(e) => e.buttons === 1 && pick(e.clientX)}
        className="relative h-8 cursor-ew-resize touch-none rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {rows.map((r) => {
          const total = r.nuevo + r.persistente + r.reactivado;
          if (!total) return null;
          const h = 3 + (Math.sqrt(total) / Math.sqrt(maxN)) * 22;
          return (
            <div
              key={r.step}
              className="absolute bottom-0 flex flex-col-reverse overflow-hidden rounded-[2px]"
              style={{ left: `calc(${((r.step - i0) / n) * 100}% + 1px)`, width: `calc(${100 / n}% - 2px)`, height: h, opacity: r.step <= t.cur ? 1 : 0.3 }}
            >
              <span style={{ flex: r.persistente, background: "var(--st-persistente)" }} />
              <span style={{ flex: r.reactivado, background: "var(--st-reactivado)" }} />
              <span style={{ flex: r.nuevo, background: "var(--st-nuevo)" }} />
            </div>
          );
        })}
        {events.map((e) => (
          <span
            key={e.key}
            title={`${e.title} · ${fmtDayTime(e.t, loc)}`}
            className={cn("absolute -top-0.5 size-2 -translate-x-1/2 rounded-full border border-card", toneBg(e.tone))}
            style={{ left: `${pct(e.step)}%` }}
          />
        ))}
        <div className="pointer-events-none absolute inset-y-0 z-10 w-0.5 -translate-x-1/2 bg-foreground" style={{ left: `${pct(t.cur)}%` }}>
          <span className="absolute -top-1 left-1/2 size-2.5 -translate-x-1/2 rounded-full border-2 border-card bg-[var(--fire)] shadow-sm" />
        </div>
      </div>
      <div className="relative">
        {days
          .filter((_, i) => i % every === 0)
          .map((s) => (
            <span key={s.index} className="num absolute top-0.5 -translate-x-1/2 whitespace-nowrap text-[9.5px] text-foreground/40" style={{ left: `${pct(s.index)}%` }}>
              {fmtDay(d.stepTime[s.index], loc)}
            </span>
          ))}
      </div>
    </div>
  );
}

function MiniChart({
  title,
  unit,
  data,
  dataKey,
  color,
  cur,
  bars,
  refY,
  refLabel,
  fmt,
  loc,
}: {
  title: string;
  unit: string;
  data: ChartRow[];
  dataKey: keyof ChartRow;
  color: string;
  cur: number;
  bars?: boolean;
  refY?: number;
  refLabel?: string;
  fmt?: (v: number) => string;
  loc: string;
}) {
  // a fire seen in one pass has a single value, and an area needs two to draw
  const single = data.filter((r) => r[dataKey] != null).length === 1;
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col px-3 pb-1.5 pt-2">
      <div className="mb-0.5 flex items-baseline justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.09em] text-foreground/50">{title}</h3>
        <span className="text-[9.5px] text-foreground/35">{unit}</span>
      </div>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          {bars ? (
            <BarChart data={data} margin={{ top: 4, right: 2, bottom: 0, left: 0 }}>
              <XAxis dataKey="step" hide />
              <YAxis width={30} tick={tick} tickFormatter={(v: number) => fmtTick(v, loc)} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip unit={unit} fmt={fmt} loc={loc} />} cursor={{ fill: "var(--foreground)", fillOpacity: 0.05 }} />
              <Bar dataKey={dataKey as string} fill={color} isAnimationActive={false} radius={[2, 2, 0, 0]} />
              <ReferenceLine x={cur} stroke="var(--foreground)" strokeOpacity={0.55} />
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`g-${String(dataKey)}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="step" hide />
              <YAxis width={30} tick={tick} tickFormatter={(v: number) => fmtTick(v, loc)} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip unit={unit} fmt={fmt} loc={loc} />} />
              {refY !== undefined && <ReferenceLine y={refY} stroke="#2563a8" strokeDasharray="3 3" label={{ value: refLabel, fontSize: 9, fill: "#2563a8", position: "insideTopLeft" }} />}
              <Area type="stepAfter" dataKey={dataKey as string} stroke={color} strokeWidth={1.6} fill={`url(#g-${String(dataKey)})`} isAnimationActive={false} connectNulls={false} dot={single ? { r: 2.5, fill: color, strokeWidth: 0 } : false} />
              <ReferenceLine x={cur} stroke="var(--foreground)" strokeOpacity={0.55} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Tip({ active, payload, unit, fmt, loc }: { active?: boolean; payload?: { value: number; payload: ChartRow }[]; unit: string; fmt?: (v: number) => string; loc: string }) {
  if (!active || !payload?.length || payload[0].value == null) return null;
  const v = payload[0].value;
  return (
    <div className="rounded-md border border-[var(--hairline)] bg-[var(--chart-tip)] px-2 py-1 text-[10.5px] shadow-[var(--shadow-2)]">
      <div className="font-semibold">{payload[0].payload.label}</div>
      <div className="num text-foreground/65">{fmt ? fmt(v) : `${fmtInt(v, loc)} ${unit}`}</div>
    </div>
  );
}

function toneBg(t: EventView["tone"]) {
  return { fire: "bg-[var(--fire)]", warn: "bg-[#d97706]", info: "bg-[#2563a8]", calm: "bg-foreground/40" }[t];
}
const ICON = { fire: Flame, warn: AlertTriangle, info: GitMerge, calm: Moon };

function Events({ events, cur, setCur, tr, loc }: { events: EventView[]; cur: number; setCur: (v: number) => void } & L) {
  return (
    <div className="flex h-full min-h-0 flex-col border-l border-[var(--hairline)] px-3 pb-2 pt-2">
      <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.09em] text-foreground/50">{tr("trk.dock.events")}</h3>
      <ul className="-mx-1 min-h-0 flex-1 space-y-px overflow-y-auto">
        {events.map((e) => {
          const Icon = e.kind === "avance" ? Zap : ICON[e.tone];
          return (
            <li key={e.key}>
              <button
                onClick={() => setCur(e.step)}
                className={cn(
                  "flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-left hover:bg-foreground/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  e.step === cur && "bg-[var(--fire-soft)]",
                  e.step > cur && "opacity-45",
                )}
              >
                <Icon className="size-3 shrink-0" style={{ color: e.tone === "fire" ? "#c8321e" : e.tone === "warn" ? "#b9560a" : e.tone === "info" ? "#2563a8" : undefined }} aria-hidden />
                <span className="min-w-0 flex-1 truncate text-[11px] font-medium">{e.title}</span>
                <span className="num shrink-0 text-[10px] text-foreground/40">{fmtDayTime(e.t, loc)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
