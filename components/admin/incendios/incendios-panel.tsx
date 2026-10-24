"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// Side panel of the "Incendios" tab, built with Sentinel's own admin
// primitives (Card, Stat, KV, Toggle, Segmented...) so it reads as part of
// the product in light and dark.

import { AlertTriangle, ArrowLeft, ArrowUp, CloudRain, Droplets, ExternalLink, Flame, GitBranch, Link2, RotateCcw, Search, Thermometer, TrendingUp, Wind } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { COVER_LABEL } from "@/lib/engine/landcover";
import type { LandCover } from "@/lib/engine/track";
import type { LiveAlert, LiveFireMeta } from "@/lib/incident";
import type { Derived } from "./derive";
import { SEVERITY } from "./severity";
import { FireSilhouette } from "./silhouette";
import { dirLong, fmtDayTime, fmtHa, fmtInt, fmtKm, fmtLong, fmtRos, satLabel, windFrom } from "./format";
import { Badge, Btn, Card, EmptyState, KV, Segmented, Skeleton, Stat, Toggle } from "../ui";
import { CASES, type FireFilter, type Tracking, type TrackingLayers, type TrackingSource } from "./use-tracking";

const COVER_COLOR: Record<LandCover, string> = {
  bosque: "#1f6b4a",
  arbustal: "#7a9a3c",
  pastizal: "#d2bd62",
  cultivo: "#e39b43",
  urbano: "#9a3b33",
  otro: "#a8a29a",
};
const HOUR = 3_600_000;
const focos = (n: number) => `${fmtInt(n)} ${n === 1 ? "foco" : "focos"}`;
const place = (m: LiveFireMeta) => m.name.replace(/\s*\(.*\)$/, "");

export function IncendiosPanel({ t }: { t: Tracking }) {
  // the admin's aside scrolls; a new fire or source starts at the top. On a
  // phone the whole page scrolls instead, map first, and it keeps the offset
  // of the tab it came from: bring the map back into view.
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const aside = ref.current?.closest("aside");
    aside?.scrollTo({ top: 0 });
    aside?.closest("main")?.scrollTo({ top: 0 });
  }, [t.selected, t.source]);
  return (
    <div ref={ref} className="flex flex-col">
      {/* no section title: the segmented control explains itself. On a phone the panel sits
          below the map and dock: lead with the fire, not the source switch */}
      <Card bare className={cn("py-3", t.d && "max-lg:hidden")}>
        <Segmented<TrackingSource>
          label="Fuente de datos"
          value={t.source}
          onChange={t.setSource}
          options={[{ value: "vivo", label: "En vivo · Argentina" }, ...CASES.map((c) => ({ value: c.id, label: `Caso: ${c.label}` }))]}
        />
        <SourceLine t={t} />
      </Card>
      {t.error ? (
        <div className="p-4">
          <EmptyState icon={<AlertTriangle className="size-5" />} title="No se pudieron cargar los incendios">
            {t.error}
          </EmptyState>
        </div>
      ) : !t.bundle ? (
        <div className="space-y-2 p-4">
          <Skeleton className="h-8" />
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
        </div>
      ) : t.d ? (
        <FireDetail t={t} />
      ) : (
        <Overview t={t} />
      )}
    </div>
  );
}

function SourceLine({ t }: { t: Tracking }) {
  if (t.source !== "vivo") {
    const c = CASES.find((x) => x.id === t.source)!;
    return <p className="mt-2 text-[11px] leading-snug text-foreground/50">Reconstrucción con el archivo científico de FIRMS y validación con Sentinel-2. {c.when}.</p>;
  }
  if (!t.live) return null;
  const { origin, windowEnd } = t.live.live;
  return (
    <>
      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-foreground/50">
        <span className={cn("size-1.5 rounded-full", origin === "api" ? "animate-pulse bg-primary" : "bg-[#b9560a]")} />
        {origin === "api" ? "Actualizado" : "Instantánea del"} {fmtDayTime(windowEnd)} · NOAA-20 y NOAA-21, últimos 10 días
      </p>
      {origin === "snapshot" && (
        <p className="mt-2 flex gap-1.5 rounded-lg bg-[#b9560a]/10 px-2.5 py-2 text-[11px] leading-snug text-[#b9560a]">
          <RotateCcw className="mt-px size-3 shrink-0" />
          La consulta en vivo no respondió{t.note ? ` (${t.note})` : ""}. Se muestra la última instantánea.
        </p>
      )}
    </>
  );
}

// ---------- national overview ----------

function Overview({ t }: { t: Tracking }) {
  const b = t.live;
  const [q, setQ] = useState("");
  const found = useMemo(() => {
    const needle = norm(q.trim());
    return needle ? t.shown.filter((m) => norm(`${m.name} ${m.province}`).includes(needle)) : t.shown;
  }, [q, t.shown]);
  if (!b) return null;
  const { meta, alerts, windowEnd } = b.live;
  const area = new Map(b.fires.map((f) => [f.id, f.areaHa]));
  const counts = { forestales: meta.filter((m) => m.forestal).length, todos: meta.length, agricolas: meta.filter((m) => !m.forestal).length };
  const now24 = t.shown.filter((m) => m.activity === "ahora");
  const det24 = t.shown.reduce((s, m) => s + m.detections24h, 0);
  const grow24 = t.shown.reduce((s, m) => s + m.growth24hHa, 0);
  const shownAlerts = alerts.filter((a) => (t.filter === "todos" ? true : t.filter === "forestales" ? a.forestal : !a.forestal));

  return (
    <>
      <Card bare title="Incendios seguidos" right={<Badge tone="ok">NASA FIRMS</Badge>}>
        <Segmented<FireFilter>
          label="Tipo de incendio"
          value={t.filter}
          onChange={t.setFilter}
          options={[
            { value: "forestales", label: <Count label="Forestales" n={counts.forestales} /> },
            { value: "todos", label: <Count label="Todos" n={counts.todos} /> },
            { value: "agricolas", label: <Count label="Agrícolas" n={counts.agricolas} /> },
          ]}
        />
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3">
          <Stat label="Activos en 24 h" value={fmtInt(now24.length)} tone="fire" sub={`de ${fmtInt(t.shown.length)} seguidos`} />
          <Stat label="Focos en 24 h" value={fmtInt(det24)} />
          <Stat label="Crecimiento 24 h" value={fmtHa(grow24)} />
          <Stat label="Alertas 48 h" value={fmtInt(shownAlerts.length)} />
        </div>
        <p className="mt-3 text-[10.5px] leading-snug text-foreground/45">
          Forestal: la mayoría de los focos del incendio cae sobre bosque o arbustal (ESA WorldCover, 1 km). Es una estimación, no una verificación en campo.
        </p>
      </Card>

      <Alerts t={t} alerts={shownAlerts} end={windowEnd} />

      <Card bare title="Por superficie" right={<span className="num text-[10.5px] text-foreground/40">{q ? `${fmtInt(found.length)} de ${fmtInt(t.shown.length)}` : fmtInt(t.shown.length)}</span>}>
        <label className="relative mb-2 block">
          <span className="sr-only">Buscar un incendio por lugar o provincia</span>
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-foreground/40" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar lugar o provincia"
            className="h-8 w-full rounded-lg border border-[var(--hairline)] bg-card pl-8 pr-2.5 text-[12px] placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        {found.length === 0 && <p className="py-2 text-[11.5px] text-foreground/50">Ningún incendio coincide con “{q.trim()}”. Probá con otra localidad o elegí “Todos”.</p>}
        <ol className="-mx-1">
          {found.slice(0, 40).map((m) => (
            <li key={m.id}>
              <button
                onClick={() => t.select(m.id)}
                className="flex w-full items-stretch gap-2.5 rounded-lg px-1 py-2 text-left transition-colors hover:bg-foreground/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span aria-hidden className="w-[3px] shrink-0 rounded-full" style={{ background: m.forestal ? "var(--fire)" : "#d4a017" }} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      {m.activity === "ahora" && <span aria-label="activo" className="size-1.5 shrink-0 rounded-full bg-[var(--fire)]" />}
                      <span className="truncate text-[12px] font-semibold">{place(m)}</span>
                    </span>
                    <span className="num shrink-0 font-heading text-[12.5px] font-bold">{fmtHa(area.get(m.id) ?? 0)}</span>
                  </span>
                  <span className="num mt-0.5 flex items-baseline justify-between gap-2 text-[10.5px] text-foreground/50">
                    <span className="flex min-w-0 gap-2 truncate">
                      <span>#{m.id}</span>
                      <span className="truncate">{m.province}</span>
                    </span>
                    {m.growth24hHa > 0 ? <span className="shrink-0 text-[#c8321e]">+{fmtHa(m.growth24hHa)} en 24 h</span> : <span className="shrink-0">{m.activity === "ahora" ? `${focos(m.detections24h)} hoy` : m.activity === "activo" ? "hace días" : "latente"}</span>}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
        {found.length > 40 && <p className="mt-1.5 text-[10.5px] text-foreground/45">Y {fmtInt(found.length - 40)} más, casi todos de un solo foco. Buscalos por lugar.</p>}
      </Card>
    </>
  );
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** The weather at t, or else the latest hour NASA POWER has published before it (it runs ~2 days behind). */
function latestWeather(d: Derived, t: number) {
  const now = d.weatherAt(t);
  if (now) return { ...now, at: t, stale: false };
  const w = d.b.weather;
  if (!w) return null;
  for (let i = Math.min(w.temp.length - 1, Math.round((t - w.t0) / HOUR)); i >= 0; i--) {
    if (Number.isNaN(w.temp[i])) continue;
    const at = w.t0 + i * HOUR;
    const v = d.weatherAt(at);
    return v ? { ...v, at, stale: true } : null;
  }
  return null;
}

/** A link that opens this fire: a case by id, a live fire by where it is (numbers change between runs). */
function copyLink(t: Tracking, m?: LiveFireMeta) {
  const u = new URL(window.location.href);
  u.search = "";
  u.searchParams.set("tab", "incendios");
  if (t.source !== "vivo") u.searchParams.set("caso", t.source);
  else if (m) u.searchParams.set("en", `${m.center[1].toFixed(4)},${m.center[0].toFixed(4)}`);
  const url = u.toString();
  const done = () => toast.success("Enlace copiado", { description: "Abre este incendio directamente en la pestaña Incendios." });
  const manual = () => toast("Copiá este enlace", { description: url, duration: 15_000 });
  if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, manual);
  else manual();
}

const Count = ({ label, n }: { label: string; n: number }) => (
  <span className="whitespace-nowrap">
    {label} <span className="num text-[10px] text-foreground/40">{n}</span>
  </span>
);

const ALERT_KINDS: LiveAlert["kind"][] = ["nuevo", "crecimiento", "salto", "reactivacion"];
const ALERT_VIEW: Record<LiveAlert["kind"], { title: string; plural: string; Icon: typeof Flame; color: string }> = {
  nuevo: { title: "Nuevo incendio", plural: "Nuevos", Icon: Flame, color: "#c8321e" },
  crecimiento: { title: "Crecimiento explosivo", plural: "Crecimiento", Icon: TrendingUp, color: "#c8321e" },
  salto: { title: "Posible salto de fuego", plural: "Saltos", Icon: AlertTriangle, color: "#b9560a" },
  reactivacion: { title: "Reactivación", plural: "Reactivaciones", Icon: GitBranch, color: "#c2378f" },
};
const ALERTS_SHOWN = 6;

function Alerts({ t, alerts, end }: { t: Tracking; alerts: LiveAlert[]; end: number }) {
  const [kind, setKind] = useState<LiveAlert["kind"] | null>(null);
  const [all, setAll] = useState(false);
  const count = (k: LiveAlert["kind"]) => alerts.filter((a) => a.kind === k).length;
  const list = kind ? alerts.filter((a) => a.kind === kind) : alerts;
  const kinds = ALERT_KINDS.filter((k) => count(k) > 0);
  return (
    <Card bare title="Alertas" right={<span className="text-[10.5px] text-foreground/40">últimas 48 h</span>}>
      {alerts.length === 0 ? (
        <p className="text-[11.5px] text-foreground/50">Sin alertas para este tipo de incendio.</p>
      ) : (
        <>
          {kinds.length > 1 && (
            <div className="mb-2 flex flex-wrap gap-1" role="group" aria-label="Tipo de alerta">
              <Chip on={kind === null} onClick={() => setKind(null)} label="Todas" n={alerts.length} />
              {kinds.map((k) => (
                <Chip key={k} on={kind === k} onClick={() => setKind(kind === k ? null : k)} label={ALERT_VIEW[k].plural} n={count(k)} color={ALERT_VIEW[k].color} />
              ))}
            </div>
          )}
          <ol className="-mx-1 space-y-px">
            {(all ? list : list.slice(0, ALERTS_SHOWN)).map((a, i) => (
              <AlertRow key={`${a.kind}-${a.fire}-${a.t}-${i}`} a={a} m={t.meta.get(a.fire)} end={end} onSelect={t.select} />
            ))}
          </ol>
          {list.length > ALERTS_SHOWN && (
            <button onClick={() => setAll(!all)} className="mt-1 rounded text-[11px] font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {all ? "Ver menos" : `Ver las ${fmtInt(list.length)} alertas`}
            </button>
          )}
        </>
      )}
    </Card>
  );
}

function Chip({ on, onClick, label, n, color }: { on: boolean; onClick: () => void; label: string; n: number; color?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        on ? "border-foreground bg-foreground text-background" : "border-[var(--hairline)] text-foreground/65 hover:bg-foreground/[0.05]",
      )}
    >
      {color && <span className="size-1.5 rounded-full" style={{ background: color }} aria-hidden />}
      {label}
      <span className={cn("num text-[10px]", on ? "text-background/70" : "text-foreground/40")}>{n}</span>
    </button>
  );
}

function AlertRow({ a, m, end, onSelect }: { a: LiveAlert; m?: LiveFireMeta; end: number; onSelect: (id: number) => void }) {
  const v = ALERT_VIEW[a.kind];
  const what =
    a.kind === "nuevo"
      ? `${a.forestal ? "Nuevo incendio forestal" : v.title}, ${focos(a.value ?? 0)}`
      : a.kind === "crecimiento"
        ? `${v.title}, +${fmtHa(a.value ?? 0)} en 12 h`
        : a.kind === "salto"
          ? `${v.title}, foco a ${fmtKm((a.value ?? 0) / 1000)} del perímetro`
          : `${v.title}, ${focos(a.value ?? 0)} en el área quemada`;
  const h = Math.max(0, Math.round((end - a.t) / HOUR));
  return (
    <li>
      <button onClick={() => onSelect(a.fire)} className="flex w-full items-start gap-2.5 rounded-md px-1 py-1.5 text-left hover:bg-foreground/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="mt-px grid size-6 shrink-0 place-items-center rounded-full" style={{ background: `${v.color}1a`, color: v.color }}>
          <v.Icon className="size-3.5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[12px] font-semibold">{m ? place(m) : `Incendio #${a.fire}`}</span>
            <span className="num shrink-0 text-[10px] text-foreground/40">{h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} d`}</span>
          </span>
          <span className="block truncate text-[10.5px] text-foreground/55">
            {what}
            {m ? ` · ${m.province}` : ""}
          </span>
        </span>
      </button>
    </li>
  );
}

// ---------- one fire ----------

function FireDetail({ t }: { t: Tracking }) {
  const d = t.d!;
  const { b, fire } = d;
  const cur = t.cur;
  const fs = d.fireStepAt[cur];
  const own = fire.steps.find((s) => s.step === cur) ?? null;
  const before = cur < d.firstStep;
  const active = !!fs && cur - fs.step <= 10;
  const m = t.meta.get(fire.id);
  const official = b.official;
  const dnbr = t.dnbr;
  const final = fire.steps.at(-1)!;
  const finalHull = [...fire.steps].reverse().find((s) => s.hull)?.hull ?? [];
  const currentHull = fs ? ([...fire.steps].reverse().find((s) => s.step <= fs.step && s.hull)?.hull ?? null) : null;
  const wx = latestWeather(d, d.stepTime[cur]);
  const step = b.steps[cur];
  const states = own?.states ?? { nuevo: 0, persistente: 0, reactivado: 0 };
  const stateTotal = states.nuevo + states.persistente + states.reactivado;
  const maxArea = Math.max(final.areaHa, official?.areaHa ?? 0, dnbr?.insidePerimeterHa ?? 0);
  const forestShare = (fire.cover.bosque ?? 0) + (fire.cover.arbustal ?? 0);

  return (
    <>
      <Card bare>
        <div className="-mx-1 mb-2 flex items-center justify-between gap-2">
          {t.source === "vivo" ? (
            <Btn onClick={() => t.select(null)} className="min-h-7 border-transparent bg-transparent px-1.5">
              <ArrowLeft className="size-3.5" /> Todos los incendios
            </Btn>
          ) : (
            <Btn onClick={() => t.setSource("vivo")} className="min-h-7 border-transparent bg-transparent px-1.5">
              <ArrowLeft className="size-3.5" /> Volver a En vivo
            </Btn>
          )}
          <Btn onClick={() => copyLink(t, m)} className="min-h-7 px-2" title="Copia un enlace que abre este incendio">
            <Link2 className="size-3.5" /> Copiar enlace
          </Btn>
        </div>
        <div className="relative pr-24">
          <div className="flex flex-wrap items-center gap-1.5">
            {before ? <Badge>Antes del fuego</Badge> : active ? <Badge tone="fire">Activo</Badge> : <Badge>Latente</Badge>}
            <Badge tone={forestShare >= 0.5 ? "ok" : "muted"}>{forestShare >= 0.5 ? "Forestal" : "Agrícola o pastizal"}</Badge>
            {dnbr && <Badge tone="ok">Validado S-2</Badge>}
          </div>
          <h2 className="mt-2 font-heading text-[18px] font-extrabold leading-tight tracking-[-0.02em]">
            {official ? b.name.replace("Incendio ", "") : m ? place(m) : `Incendio #${fire.id}`}
          </h2>
          <p className="text-[11.5px] text-foreground/55">{official ? b.place : `Incendio #${fire.id}${m ? `, ${m.province}` : ""}`}</p>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="num font-heading text-[28px] font-extrabold leading-none tracking-[-0.03em]">{before ? "0" : fmtInt(fs?.areaHa ?? 0)}</span>
            <span className="font-heading text-[14px] font-bold text-[var(--fire)]">ha</span>
          </div>
          <p className="mt-1 text-[10.5px] text-foreground/45">{before ? "Todavía sin detecciones" : `Perímetro satelital al ${fmtDayTime(fs!.t1)}`}</p>
          {finalHull.length > 0 && (
            <FireSilhouette
              final={finalHull}
              current={before ? null : currentHull}
              base="var(--foreground)"
              accent="var(--fire)"
              className="pointer-events-none absolute -right-1 top-0 size-[92px]"
            />
          )}
        </div>
      </Card>

      <Card bare title="En este momento" right={step.t0 !== null ? <span className="num text-[10.5px] text-foreground/40">{fmtDayTime(step.t0)}</span> : undefined}>
        {before ? (
          <p className="text-[11.5px] text-foreground/50">El incendio todavía no aparece en las pasadas satelitales.</p>
        ) : !own ? (
          <p className="text-[11.5px] leading-snug text-foreground/50">Sin focos de este incendio en esta pasada. El perímetro queda como en la última detección.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-3 gap-y-3">
              <Stat label="Crecimiento 12 h" value={`+${fmtHa(Math.max(0, own.growthHa))}`} sub={`${focos(own.newPixels)} detectados`} tone={own.growthHa > 1000 ? "fire" : undefined} />
              <Stat label="Avance máximo" value={own.rosMaxMh ? fmtRos(own.rosMaxMh) : "—"} sub={own.rosDir ? `hacia el ${dirLong(own.rosDir)}` : "sin avance medible"} tone={own.rosMaxMh && own.rosMaxMh > 300 ? "warn" : undefined} />
              <Stat label="Frente activo" value={fmtKm(own.fireLineKm)} sub="borde con fuego nuevo" />
              <Stat label="Potencia" value={`${fmtInt(own.frpSum)} MW`} sub="suma de la pasada" />
            </div>
            {stateTotal > 0 && (
              <div className="mt-3">
                <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
                  {states.nuevo > 0 && <span style={{ flex: states.nuevo, background: "var(--st-nuevo)" }} />}
                  {states.persistente > 0 && <span style={{ flex: states.persistente, background: "var(--st-persistente)" }} />}
                  {states.reactivado > 0 && <span style={{ flex: states.reactivado, background: "var(--st-reactivado)" }} />}
                </div>
                <div className="num mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10.5px] text-foreground/55">
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[var(--st-nuevo)]" /> {fmtInt(states.nuevo)} nuevos</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[var(--st-persistente)]" /> {fmtInt(states.persistente)} persistentes</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[var(--st-reactivado)]" /> {fmtInt(states.reactivado)} reactivados</span>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <Card bare title={wx?.stale ? "Clima más reciente" : "Clima en ese momento"} right={<span className="text-[9.5px] text-foreground/40">NASA POWER</span>}>
        {wx ? (
          <>
          {wx.stale && (
            <p className="mb-2 text-[10.5px] leading-snug text-foreground/50">
              Dato del {fmtDayTime(wx.at)}: NASA POWER publica con unos 2 días de demora y todavía no tiene este momento.
            </p>
          )}
          <div className="grid grid-cols-2 gap-1.5">
            <Tile icon={Thermometer} label="Temp." value={`${Math.round(wx.temp)} °C`} />
            <Tile icon={Droplets} label="Humedad" value={`${Math.round(wx.rh)}%`} tone={wx.rh < 25 ? "#b9560a" : undefined} />
            <Tile
              icon={Wind}
              label="Viento"
              value={
                <span className="inline-flex items-center gap-1">
                  {Math.round(wx.wind)} km/h
                  <ArrowUp className="size-3 text-foreground/55" style={{ transform: `rotate(${(wx.dir + 180) % 360}deg)` }} aria-label={`del ${windFrom(wx.dir)}`} />
                </span>
              }
              sub={`del ${windFrom(wx.dir)}`}
            />
            <Tile icon={CloudRain} label="Lluvia 24 h" value={`${wx.rain24} mm`} />
          </div>
          </>
        ) : (
          <p className="text-[11.5px] leading-snug text-foreground/50">{b.weather ? "NASA POWER todavía no publicó datos para este incendio." : "Cargando el clima de este incendio…"}</p>
        )}
      </Card>

      <Card bare title={official ? "Superficie final" : "Superficie hasta ahora"}>
        {official || dnbr ? (
          <div className="space-y-2.5">
            <Bar label="Perímetro satelital" sub="VIIRS 375 m, método FEDS: cota superior" value={final.areaHa} max={maxArea} color="var(--fire)" />
            {dnbr && <Bar label="Quemado según Sentinel-2" sub="dNBR a 20 m, dentro del perímetro" value={dnbr.insidePerimeterHa} max={maxArea} color="#8c1d04" />}
            {official && <Bar label="Cifra oficial" sub={official.areaSource} value={official.areaHa} max={maxArea} color="#2563a8" />}
          </div>
        ) : (
          <dl>
            <KV k="Perímetro satelital">{fmtHa(final.areaHa)}</KV>
            <KV k="Creció en 24 h">{m && m.growth24hHa > 0 ? `+${fmtHa(m.growth24hHa)}` : "sin crecimiento"}</KV>
            <KV k="Largo del perímetro">{fmtKm(final.perimeterKm)}</KV>
          </dl>
        )}
        <p className="mt-2.5 text-[10.5px] leading-snug text-foreground/45">
          Un píxel VIIRS mide 375 m y marca calor en algún punto de esa superficie: el perímetro satelital la envuelve por exceso{dnbr ? "." : " (en Puerto Patriada, Sentinel-2 midió un 36% menos)."}
        </p>
      </Card>

      {dnbr && (
        <Card bare title="Severidad · Sentinel-2">
          <Stack items={SEVERITY.map((c) => ({ key: c.key, label: c.label, color: c.color, value: dnbr.areasInsidePerimeterHa[c.key] }))} fmt={fmtHa} />
          <p className="mt-2 text-[10.5px] leading-snug text-foreground/45">
            El perímetro satelital abarca el {Math.round(dnbr.validation.dnbr010.recall * 100)}% del área quemada (IoU {dnbr.iou10.toFixed(2).replace(".", ",")}). Imágenes del{" "}
            {fmtLong(Date.parse(`${dnbr.scenes.pre.date}T12:00:00-03:00`)).replace(/^\S+\s/, "")} y del {fmtLong(Date.parse(`${dnbr.scenes.post.date}T12:00:00-03:00`)).replace(/^\S+\s/, "")}.
          </p>
        </Card>
      )}

      <Card bare title="Vegetación afectada" right={<span className="text-[9.5px] text-foreground/40">ESA WorldCover</span>}>
        <Stack
          items={(Object.entries(fire.cover) as [LandCover, number][]).sort((a, c) => c[1] - a[1]).map(([c, v]) => ({ key: c, label: COVER_LABEL[c], color: COVER_COLOR[c], value: v }))}
          fmt={(v) => `${Math.round(v * 100)}%`}
          share
        />
      </Card>

      {official ? (
        <Card bare title="Datos oficiales">
          <dl>
            <KV k="Inicio oficial">{fmtDayTime(Date.parse(official.start))}</KV>
            <KV k="Primera detección">
              {fmtDayTime(fire.ignition.t)}, {satLabel(fire.ignition.sat)}
            </KV>
            <KV k="Controlado">{fmtLong(Date.parse(`${official.controlled}T12:00:00-03:00`))}</KV>
            <KV k="Causa">{official.cause}</KV>
          </dl>
          <p className="mt-2 text-[11.5px] leading-snug text-foreground/75">{official.impact}.</p>
          <ul className="mt-2 space-y-1 border-l border-[var(--hairline)] pl-2.5 text-[11px] leading-snug text-foreground/60">
            {official.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <ul className="mt-2.5 space-y-1">
            {official.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer" className="flex items-start gap-1 text-[10.5px] leading-snug text-primary hover:underline">
                  <ExternalLink className="mt-px size-3 shrink-0" /> {s.label}
                </a>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card bare title="Detección satelital">
          <dl>
            <KV k="Primera detección">
              {fmtDayTime(fire.ignition.t)}, {satLabel(fire.ignition.sat)}
            </KV>
            <KV k="Última detección">{fmtDayTime(fire.lastT)}</KV>
            <KV k="Pasadas con fuego">{fmtInt(fire.steps.length)}</KV>
            <KV k="Focos detectados">{fmtInt(final.pixels)}</KV>
          </dl>
          <p className="mt-2 text-[10.5px] leading-snug text-foreground/45">Sin verificación en campo. La causa y el estado oficial los informa el servicio de manejo del fuego.</p>
        </Card>
      )}

      <Card bare title="Capas del seguimiento">
        <LayerToggles t={t} />
      </Card>

      <Card bare title="Método">
        <p className="text-[11px] leading-relaxed text-foreground/60">
          Seguimiento de objetos de incendio estilo NASA FEDS (Chen et al. 2022): pasos de 12 h, agrupamiento a 0,7 km, enganche de 5 km en bosque y 1 km en el resto, perímetro por forma alfa
          de 1 km más medio píxel. Velocidad: avance máximo del perímetro entre pasadas (Cardil et al. 2023).
        </p>
      </Card>
    </>
  );
}

function LayerToggles({ t }: { t: Tracking }) {
  const set = (k: keyof TrackingLayers) => (v: boolean) => t.setLayers({ ...t.layers, [k]: v });
  return (
    <div>
      <Toggle checked={t.layers.focos} onChange={set("focos")} label="Focos por estado" swatch="#ff5a2a" hint="brasas y pasada" />
      <Toggle checked={t.layers.isocronas} onChange={set("isocronas")} label="Avance en el tiempo" swatch="#f2711c" hint="perímetro por pasada" />
      <Toggle checked={t.layers.frente} onChange={set("frente")} label="Frente activo" swatch="#ffe08a" />
      <Toggle checked={t.layers.vectores} onChange={set("vectores")} label="Vectores de avance" swatch="#ffd166" />
      <Toggle checked={t.layers.otros} onChange={set("otros")} label="Otros incendios" swatch="#9a948a" />
      {t.dnbr && <Toggle checked={t.layers.dnbr} onChange={set("dnbr")} label="Área quemada (Sentinel-2)" swatch="#8c1d04" hint="severidad dNBR" />}
    </div>
  );
}

function Tile({ icon: Icon, label, value, sub, tone }: { icon: typeof Wind; label: string; value: React.ReactNode; sub?: string; tone?: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-foreground/[0.04] px-2.5 py-2">
      <div className="flex items-center gap-1 text-[9.5px] font-medium uppercase tracking-wider text-foreground/45">
        <Icon className="size-3 shrink-0" aria-hidden />
        <span className="truncate">{label}</span>
      </div>
      <div className="num mt-0.5 truncate font-heading text-[15px] font-bold leading-tight" style={tone ? { color: tone } : undefined}>
        {value}
      </div>
      {sub && <div className="truncate text-[9.5px] text-foreground/45">{sub}</div>}
    </div>
  );
}

function Bar({ label, sub, value, max, color }: { label: string; sub: string; value: number; max: number; color: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-[11.5px]">
        <span className="font-medium text-foreground/80">{label}</span>
        <span className="num font-heading font-bold">{fmtHa(value)}</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-foreground/[0.07]">
        <div className="h-full rounded-full" style={{ width: `${Math.max(1.5, (value / max) * 100)}%`, background: color }} />
      </div>
      <div className="mt-0.5 truncate text-[10px] text-foreground/45">{sub}</div>
    </div>
  );
}

function Stack({ items, fmt, share }: { items: { key: string; label: string; color: string; value: number }[]; fmt: (v: number) => string; share?: boolean }) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  return (
    <>
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
        {items.map((i) => (
          <span key={i.key} title={`${i.label}: ${fmt(i.value)}`} style={{ flex: i.value, background: i.color }} />
        ))}
      </div>
      <dl className="mt-2 space-y-0.5">
        {items.map((i) => (
          <div key={i.key} className="flex items-center gap-2 text-[11.5px]">
            <span className="size-2 shrink-0 rounded-full" style={{ background: i.color }} />
            <dt className="flex-1 text-foreground/65">{i.label}</dt>
            <dd className="num font-medium">{fmt(i.value)}</dd>
            {!share && <dd className="num w-8 text-right text-foreground/40">{Math.round((i.value / total) * 100)}%</dd>}
          </div>
        ))}
      </dl>
    </>
  );
}
