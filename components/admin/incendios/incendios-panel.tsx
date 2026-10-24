"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// Side panel of the "Incendios" tab, built with Sentinel's own admin
// primitives (Card, Stat, KV, Toggle, Segmented...) so it reads as part of
// the product in light and dark.

import { AlertTriangle, ArrowLeft, ArrowUp, CloudRain, Droplets, ExternalLink, Flame, GitBranch, Link2, RotateCcw, Search, Thermometer, TrendingUp, Wind } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { NUM_LOCALE } from "@/lib/admin/i18n-shell";
import type { Locale, Translate } from "@/lib/admin/i18n";
import type { LandCover } from "@/lib/engine/track";
import type { LiveAlert, LiveFireMeta } from "@/lib/incident";
import type { Derived } from "./derive";
import { SEVERITY } from "./severity";
import { FireSilhouette } from "./silhouette";
import { dirLong, dirShort, fmt2, fmtDayTime, fmtHa, fmtInt, fmtKm, fmtLong, fmtRos, focos, placeName, satLabel, windFrom } from "./format";
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
/** The town of a fire ("a 12 km de El Bolsón"), without its province, in the interface language. */
const place = (tr: Translate, m: LiveFireMeta) => placeName(tr, m.name.replace(/\s*\(.*\)$/, ""));

// the language travels as a translator plus the BCP 47 tag for numbers and dates
interface L {
  tr: Translate;
  loc: string;
}

export function IncendiosPanel({ t, tr, locale }: { t: Tracking; tr: Translate; locale: Locale }) {
  const l: L = { tr, loc: NUM_LOCALE[locale] };
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
          label={tr("trk.source.aria")}
          value={t.source}
          onChange={t.setSource}
          options={[{ value: "vivo", label: tr("trk.source.live") }, ...CASES.map((c) => ({ value: c.id, label: tr("trk.source.case", { name: c.label }) }))]}
        />
        <SourceLine t={t} {...l} />
      </Card>
      {t.error ? (
        <div className="p-4">
          <EmptyState icon={<AlertTriangle className="size-5" />} title={tr("trk.err.title")}>
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
        <FireDetail t={t} {...l} />
      ) : (
        <Overview t={t} {...l} />
      )}
    </div>
  );
}

function SourceLine({ t, tr, loc }: { t: Tracking } & L) {
  if (t.source !== "vivo") {
    const c = CASES.find((x) => x.id === t.source)!;
    return <p className="mt-2 text-[11px] leading-snug text-foreground/50">{tr("trk.src.case", { when: tr(c.whenKey) })}</p>;
  }
  if (!t.live) return null;
  const { origin, windowEnd } = t.live.live;
  return (
    <>
      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-foreground/50">
        <span className={cn("size-1.5 rounded-full", origin === "api" ? "animate-pulse bg-primary" : "bg-[#b9560a]")} />
        {tr(origin === "api" ? "trk.src.updated" : "trk.src.snapshot", { time: fmtDayTime(windowEnd, loc) })}
      </p>
      {origin === "snapshot" && (
        <p className="mt-2 flex gap-1.5 rounded-lg bg-[#b9560a]/10 px-2.5 py-2 text-[11px] leading-snug text-[#b9560a]">
          <RotateCcw className="mt-px size-3 shrink-0" />
          {t.note ? tr("trk.src.fallbackNote", { note: t.note }) : tr("trk.src.fallback")}
        </p>
      )}
    </>
  );
}

// ---------- national overview ----------

function Overview({ t, tr, loc }: { t: Tracking } & L) {
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
      <Card bare title={tr("trk.ov.title")} right={<Badge tone="ok">NASA FIRMS</Badge>}>
        <Segmented<FireFilter>
          label={tr("trk.ov.type")}
          value={t.filter}
          onChange={t.setFilter}
          options={[
            { value: "forestales", label: <Count label={tr("trk.f.forest")} n={counts.forestales} /> },
            { value: "todos", label: <Count label={tr("trk.f.all")} n={counts.todos} /> },
            { value: "agricolas", label: <Count label={tr("trk.f.agri")} n={counts.agricolas} /> },
          ]}
        />
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3">
          <Stat label={tr("trk.stat.active24")} value={fmtInt(now24.length, loc)} tone="fire" sub={tr("trk.stat.of", { n: fmtInt(t.shown.length, loc) })} />
          <Stat label={tr("trk.stat.dets24")} value={fmtInt(det24, loc)} />
          <Stat label={tr("trk.stat.growth24")} value={fmtHa(grow24, loc)} />
          <Stat label={tr("trk.stat.alerts48")} value={fmtInt(shownAlerts.length, loc)} />
        </div>
        <p className="mt-3 text-[10.5px] leading-snug text-foreground/45">
          {tr("trk.ov.forestNote")}
        </p>
      </Card>

      <Alerts t={t} alerts={shownAlerts} end={windowEnd} tr={tr} loc={loc} />

      <Card bare title={tr("trk.ov.bySize")} right={<span className="num text-[10.5px] text-foreground/40">{q ? tr("trk.ov.countOf", { n: fmtInt(found.length, loc), total: fmtInt(t.shown.length, loc) }) : fmtInt(t.shown.length, loc)}</span>}>
        <label className="relative mb-2 block">
          <span className="sr-only">{tr("trk.ov.searchLabel")}</span>
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-foreground/40" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tr("trk.ov.searchPh")}
            className="h-8 w-full rounded-lg border border-[var(--hairline)] bg-card pl-8 pr-2.5 text-[12px] placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        {found.length === 0 && <p className="py-2 text-[11.5px] text-foreground/50">{tr("trk.ov.noMatch", { q: q.trim() })}</p>}
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
                      {m.activity === "ahora" && <span aria-label={tr("trk.ov.activeAria")} className="size-1.5 shrink-0 rounded-full bg-[var(--fire)]" />}
                      <span className="truncate text-[12px] font-semibold">{place(tr, m)}</span>
                    </span>
                    <span className="num shrink-0 font-heading text-[12.5px] font-bold">{fmtHa(area.get(m.id) ?? 0, loc)}</span>
                  </span>
                  <span className="num mt-0.5 flex items-baseline justify-between gap-2 text-[10.5px] text-foreground/50">
                    <span className="flex min-w-0 gap-2 truncate">
                      <span>#{m.id}</span>
                      <span className="truncate">{m.province}</span>
                    </span>
                    {m.growth24hHa > 0 ? (
                      <span className="shrink-0 text-[#c8321e]">{tr("trk.ov.grew", { ha: fmtHa(m.growth24hHa, loc) })}</span>
                    ) : (
                      <span className="shrink-0">
                        {m.activity === "ahora"
                          ? tr(m.detections24h === 1 ? "trk.ov.today.one" : "trk.ov.today.other", { n: fmtInt(m.detections24h, loc) })
                          : m.activity === "activo"
                            ? tr("trk.ov.daysAgo")
                            : tr("trk.act.latent")}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
        {found.length > 40 && <p className="mt-1.5 text-[10.5px] text-foreground/45">{tr("trk.ov.more", { n: fmtInt(found.length - 40, loc) })}</p>}
      </Card>
    </>
  );
}

/** "5 ene 2026" for a scene date (the weekday goes). */
const sceneDate = (iso: string, loc: string) => fmtLong(Date.parse(`${iso}T12:00:00-03:00`), loc).replace(/^\S+\s/, "");

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
function copyLink(t: Tracking, tr: Translate, m?: LiveFireMeta) {
  const u = new URL(window.location.href);
  u.search = "";
  u.searchParams.set("tab", "incendios");
  if (t.source !== "vivo") u.searchParams.set("caso", t.source);
  else if (m) u.searchParams.set("en", `${m.center[1].toFixed(4)},${m.center[0].toFixed(4)}`);
  const url = u.toString();
  const done = () => toast.success(tr("trk.link.done"), { description: tr("trk.link.doneDesc") });
  const manual = () => toast(tr("trk.link.manual"), { description: url, duration: 15_000 });
  if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, manual);
  else manual();
}

const Count = ({ label, n }: { label: string; n: number }) => (
  <span className="whitespace-nowrap">
    {label} <span className="num text-[10px] text-foreground/40">{n}</span>
  </span>
);

const ALERT_KINDS: LiveAlert["kind"][] = ["nuevo", "crecimiento", "salto", "reactivacion"];
const ALERT_VIEW: Record<LiveAlert["kind"], { Icon: typeof Flame; color: string }> = {
  nuevo: { Icon: Flame, color: "#c8321e" },
  crecimiento: { Icon: TrendingUp, color: "#c8321e" },
  salto: { Icon: AlertTriangle, color: "#b9560a" },
  reactivacion: { Icon: GitBranch, color: "#c2378f" },
};
const ALERTS_SHOWN = 6;

function Alerts({ t, alerts, end, tr, loc }: { t: Tracking; alerts: LiveAlert[]; end: number } & L) {
  const [kind, setKind] = useState<LiveAlert["kind"] | null>(null);
  const [all, setAll] = useState(false);
  const count = (k: LiveAlert["kind"]) => alerts.filter((a) => a.kind === k).length;
  const list = kind ? alerts.filter((a) => a.kind === kind) : alerts;
  const kinds = ALERT_KINDS.filter((k) => count(k) > 0);
  return (
    <Card bare title={tr("trk.al.title")} right={<span className="text-[10.5px] text-foreground/40">{tr("trk.al.last48")}</span>}>
      {alerts.length === 0 ? (
        <p className="text-[11.5px] text-foreground/50">{tr("trk.al.none")}</p>
      ) : (
        <>
          {kinds.length > 1 && (
            <div className="mb-2 flex flex-wrap gap-1" role="group" aria-label={tr("trk.al.type")}>
              <Chip on={kind === null} onClick={() => setKind(null)} label={tr("trk.al.all")} n={alerts.length} />
              {kinds.map((k) => (
                <Chip key={k} on={kind === k} onClick={() => setKind(kind === k ? null : k)} label={tr(`trk.al.p.${k}`)} n={count(k)} color={ALERT_VIEW[k].color} />
              ))}
            </div>
          )}
          <ol className="-mx-1 space-y-px">
            {(all ? list : list.slice(0, ALERTS_SHOWN)).map((a, i) => (
              <AlertRow key={`${a.kind}-${a.fire}-${a.t}-${i}`} a={a} m={t.meta.get(a.fire)} end={end} onSelect={t.select} tr={tr} loc={loc} />
            ))}
          </ol>
          {list.length > ALERTS_SHOWN && (
            <button onClick={() => setAll(!all)} className="mt-1 rounded text-[11px] font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {all ? tr("trk.al.less") : tr("trk.al.more", { n: fmtInt(list.length, loc) })}
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

function AlertRow({ a, m, end, onSelect, tr, loc }: { a: LiveAlert; m?: LiveFireMeta; end: number; onSelect: (id: number) => void } & L) {
  const v = ALERT_VIEW[a.kind];
  const what =
    a.kind === "nuevo"
      ? tr(a.forestal ? "trk.al.w.nuevoF" : "trk.al.w.nuevo", { foci: focos(tr, a.value ?? 0, loc) })
      : a.kind === "crecimiento"
        ? tr("trk.al.w.crecimiento", { ha: fmtHa(a.value ?? 0, loc) })
        : a.kind === "salto"
          ? tr("trk.al.w.salto", { km: fmtKm((a.value ?? 0) / 1000, loc) })
          : tr("trk.al.w.reactivacion", { foci: focos(tr, a.value ?? 0, loc) });
  const h = Math.max(0, Math.round((end - a.t) / HOUR));
  return (
    <li>
      <button onClick={() => onSelect(a.fire)} className="flex w-full items-start gap-2.5 rounded-md px-1 py-1.5 text-left hover:bg-foreground/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="mt-px grid size-6 shrink-0 place-items-center rounded-full" style={{ background: `${v.color}1a`, color: v.color }}>
          <v.Icon className="size-3.5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[12px] font-semibold">{m ? place(tr, m) : tr("trk.fire.n", { id: a.fire })}</span>
            <span className="num shrink-0 text-[10px] text-foreground/40">{h < 24 ? tr("age.hour", { n: h }) : tr("age.day", { n: Math.round(h / 24) })}</span>
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

function FireDetail({ t, tr, loc }: { t: Tracking } & L) {
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
              <ArrowLeft className="size-3.5" /> {tr("trk.back.all")}
            </Btn>
          ) : (
            <Btn onClick={() => t.setSource("vivo")} className="min-h-7 border-transparent bg-transparent px-1.5">
              <ArrowLeft className="size-3.5" /> {tr("trk.back.live")}
            </Btn>
          )}
          <Btn onClick={() => copyLink(t, tr, m)} className="min-h-7 px-2" title={tr("trk.copyLink.title")}>
            <Link2 className="size-3.5" /> {tr("trk.copyLink")}
          </Btn>
        </div>
        <div className="relative pr-24">
          <div className="flex flex-wrap items-center gap-1.5">
            {before ? <Badge>{tr("trk.b.before")}</Badge> : active ? <Badge tone="fire">{tr("trk.b.active")}</Badge> : <Badge>{tr("trk.b.latent")}</Badge>}
            <Badge tone={forestShare >= 0.5 ? "ok" : "muted"}>{tr(forestShare >= 0.5 ? "trk.b.forest" : "trk.b.agri")}</Badge>
            {dnbr && <Badge tone="ok">{tr("trk.b.valid")}</Badge>}
          </div>
          <h2 className="mt-2 font-heading text-[18px] font-extrabold leading-tight tracking-[-0.02em]">
            {official ? b.name.replace("Incendio ", "") : m ? place(tr, m) : tr("trk.fire.n", { id: fire.id })}
          </h2>
          <p className="text-[11.5px] text-foreground/55">{official ? b.place : `${tr("trk.fire.n", { id: fire.id })}${m ? `, ${m.province}` : ""}`}</p>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="num font-heading text-[28px] font-extrabold leading-none tracking-[-0.03em]">{before ? "0" : fmtInt(fs?.areaHa ?? 0, loc)}</span>
            <span className="font-heading text-[14px] font-bold text-[var(--fire)]">ha</span>
          </div>
          <p className="mt-1 text-[10.5px] text-foreground/45">{before ? tr("trk.d.noDet") : tr("trk.d.perim", { time: fmtDayTime(fs!.t1, loc) })}</p>
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

      <Card bare title={tr("trk.now.title")} right={step.t0 !== null ? <span className="num text-[10.5px] text-foreground/40">{fmtDayTime(step.t0, loc)}</span> : undefined}>
        {before ? (
          <p className="text-[11.5px] text-foreground/50">{tr("trk.now.before")}</p>
        ) : !own ? (
          <p className="text-[11.5px] leading-snug text-foreground/50">{tr("trk.now.noFoci")}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-3 gap-y-3">
              <Stat label={tr("trk.st.growth12")} value={`+${fmtHa(Math.max(0, own.growthHa), loc)}`} sub={tr("trk.st.detected", { foci: focos(tr, own.newPixels, loc) })} tone={own.growthHa > 1000 ? "fire" : undefined} />
              <Stat label={tr("trk.st.maxAdv")} value={own.rosMaxMh ? fmtRos(own.rosMaxMh, loc) : "—"} sub={own.rosDir ? tr("trk.toward", { dir: dirLong(tr, own.rosDir) }) : tr("trk.st.noAdv")} tone={own.rosMaxMh && own.rosMaxMh > 300 ? "warn" : undefined} />
              <Stat label={tr("trk.st.front")} value={fmtKm(own.fireLineKm, loc)} sub={tr("trk.st.frontSub")} />
              <Stat label={tr("trk.st.power")} value={`${fmtInt(own.frpSum, loc)} MW`} sub={tr("trk.st.powerSub")} />
            </div>
            {stateTotal > 0 && (
              <div className="mt-3">
                <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
                  {states.nuevo > 0 && <span style={{ flex: states.nuevo, background: "var(--st-nuevo)" }} />}
                  {states.persistente > 0 && <span style={{ flex: states.persistente, background: "var(--st-persistente)" }} />}
                  {states.reactivado > 0 && <span style={{ flex: states.reactivado, background: "var(--st-reactivado)" }} />}
                </div>
                <div className="num mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10.5px] text-foreground/55">
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[var(--st-nuevo)]" /> {tr("trk.state.new", { n: fmtInt(states.nuevo, loc) })}</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[var(--st-persistente)]" /> {tr("trk.state.persist", { n: fmtInt(states.persistente, loc) })}</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[var(--st-reactivado)]" /> {tr("trk.state.react", { n: fmtInt(states.reactivado, loc) })}</span>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <Card bare title={tr(wx?.stale ? "trk.wx.latest" : "trk.wx.then")} right={<span className="text-[9.5px] text-foreground/40">NASA POWER</span>}>
        {wx ? (
          <>
          {wx.stale && (
            <p className="mb-2 text-[10.5px] leading-snug text-foreground/50">
              {tr("trk.wx.stale", { time: fmtDayTime(wx.at, loc) })}
            </p>
          )}
          <div className="grid grid-cols-2 gap-1.5">
            <Tile icon={Thermometer} label={tr("trk.wx.temp")} value={`${Math.round(wx.temp)} °C`} />
            <Tile icon={Droplets} label={tr("trk.wx.humidity")} value={`${Math.round(wx.rh)}%`} tone={wx.rh < 25 ? "#b9560a" : undefined} />
            <Tile
              icon={Wind}
              label={tr("trk.wx.wind")}
              value={
                <span className="inline-flex items-center gap-1">
                  {Math.round(wx.wind)} km/h
                  <ArrowUp className="size-3 text-foreground/55" style={{ transform: `rotate(${(wx.dir + 180) % 360}deg)` }} aria-label={tr("trk.wx.from", { dir: dirShort(tr, windFrom(wx.dir)) })} />
                </span>
              }
              sub={tr("trk.wx.from", { dir: dirShort(tr, windFrom(wx.dir)) })}
            />
            <Tile icon={CloudRain} label={tr("trk.wx.rain")} value={`${wx.rain24} mm`} />
          </div>
          </>
        ) : (
          <p className="text-[11.5px] leading-snug text-foreground/50">{tr(b.weather ? "trk.wx.noData" : "trk.wx.loading")}</p>
        )}
      </Card>

      <Card bare title={tr(official ? "trk.area.final" : "trk.area.sofar")}>
        {official || dnbr ? (
          <div className="space-y-2.5">
            <Bar label={tr("trk.bar.sat")} sub={tr("trk.bar.satSub")} value={final.areaHa} max={maxArea} color="var(--fire)" loc={loc} />
            {dnbr && <Bar label={tr("trk.bar.s2")} sub={tr("trk.bar.s2Sub")} value={dnbr.insidePerimeterHa} max={maxArea} color="#8c1d04" loc={loc} />}
            {official && <Bar label={tr("trk.bar.official")} sub={official.areaSource} value={official.areaHa} max={maxArea} color="#2563a8" loc={loc} />}
          </div>
        ) : (
          <dl>
            <KV k={tr("trk.bar.sat")}>{fmtHa(final.areaHa, loc)}</KV>
            <KV k={tr("trk.kv.grew24")}>{m && m.growth24hHa > 0 ? `+${fmtHa(m.growth24hHa, loc)}` : tr("trk.kv.noGrowth")}</KV>
            <KV k={tr("trk.kv.perimLen")}>{fmtKm(final.perimeterKm, loc)}</KV>
          </dl>
        )}
        <p className="mt-2.5 text-[10.5px] leading-snug text-foreground/45">
          {tr(dnbr ? "trk.area.note" : "trk.area.noteCase")}
        </p>
      </Card>

      {dnbr && (
        <Card bare title={tr("trk.sev.title")}>
          <Stack items={SEVERITY.map((c) => ({ key: c.key, label: tr(c.labelKey), color: c.color, value: dnbr.areasInsidePerimeterHa[c.key] }))} fmt={(v) => fmtHa(v, loc)} />
          <p className="mt-2 text-[10.5px] leading-snug text-foreground/45">
            {tr("trk.sev.note", {
              pct: Math.round(dnbr.validation.dnbr010.recall * 100),
              iou: fmt2(dnbr.iou10, loc),
              pre: sceneDate(dnbr.scenes.pre.date, loc),
              post: sceneDate(dnbr.scenes.post.date, loc),
            })}
          </p>
        </Card>
      )}

      <Card bare title={tr("trk.veg.title")} right={<span className="text-[9.5px] text-foreground/40">ESA WorldCover</span>}>
        <Stack
          items={(Object.entries(fire.cover) as [LandCover, number][]).sort((a, c) => c[1] - a[1]).map(([c, v]) => ({ key: c, label: tr(`trk.cover.${c}`), color: COVER_COLOR[c], value: v }))}
          fmt={(v) => `${Math.round(v * 100)}%`}
          share
        />
      </Card>

      {official ? (
        <Card bare title={tr("trk.off.title")}>
          <dl>
            <KV k={tr("trk.kv.start")}>{fmtDayTime(Date.parse(official.start), loc)}</KV>
            <KV k={tr("trk.kv.first")}>
              {fmtDayTime(fire.ignition.t, loc)}, {satLabel(fire.ignition.sat)}
            </KV>
            <KV k={tr("trk.kv.controlled")}>{fmtLong(Date.parse(`${official.controlled}T12:00:00-03:00`), loc)}</KV>
            <KV k={tr("trk.kv.cause")}>{official.cause}</KV>
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
        <Card bare title={tr("trk.det.title")}>
          <dl>
            <KV k={tr("trk.kv.first")}>
              {fmtDayTime(fire.ignition.t, loc)}, {satLabel(fire.ignition.sat)}
            </KV>
            <KV k={tr("trk.kv.last")}>{fmtDayTime(fire.lastT, loc)}</KV>
            <KV k={tr("trk.kv.passes")}>{fmtInt(fire.steps.length, loc)}</KV>
            <KV k={tr("trk.kv.foci")}>{fmtInt(final.pixels, loc)}</KV>
          </dl>
          <p className="mt-2 text-[10.5px] leading-snug text-foreground/45">{tr("trk.det.note")}</p>
        </Card>
      )}

      <Card bare title={tr("trk.lyr.title")}>
        <LayerToggles t={t} tr={tr} />
      </Card>

      <Card bare title={tr("trk.method.title")}>
        <p className="text-[11px] leading-relaxed text-foreground/60">{tr("trk.method.body")}</p>
      </Card>
    </>
  );
}

function LayerToggles({ t, tr }: { t: Tracking; tr: Translate }) {
  const set = (k: keyof TrackingLayers) => (v: boolean) => t.setLayers({ ...t.layers, [k]: v });
  return (
    <div>
      <Toggle checked={t.layers.focos} onChange={set("focos")} label={tr("trk.lyr.foci")} swatch="#ff5a2a" hint={tr("trk.lyr.fociHint")} />
      <Toggle checked={t.layers.isocronas} onChange={set("isocronas")} label={tr("trk.lyr.iso")} swatch="#f2711c" hint={tr("trk.lyr.isoHint")} />
      <Toggle checked={t.layers.frente} onChange={set("frente")} label={tr("trk.lyr.front")} swatch="#ffe08a" />
      <Toggle checked={t.layers.vectores} onChange={set("vectores")} label={tr("trk.lyr.vectors")} swatch="#ffd166" />
      <Toggle checked={t.layers.otros} onChange={set("otros")} label={tr("trk.lyr.others")} swatch="#9a948a" />
      {t.dnbr && <Toggle checked={t.layers.dnbr} onChange={set("dnbr")} label={tr("trk.lyr.dnbr")} swatch="#8c1d04" hint={tr("trk.lyr.dnbrHint")} />}
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

function Bar({ label, sub, value, max, color, loc }: { label: string; sub: string; value: number; max: number; color: string; loc: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-[11.5px]">
        <span className="font-medium text-foreground/80">{label}</span>
        <span className="num font-heading font-bold">{fmtHa(value, loc)}</span>
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
