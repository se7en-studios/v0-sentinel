"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BellRing,
  Download,
  FileText,
  Flame,
  MapPin,
  NotebookPen,
  Plane,
  Radio,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HORIZONS } from "@/lib/admin/spread";
import { isAcked, zoneKey } from "@/lib/admin/alert-ack";
import { NOTE_TEXT_MAX } from "@/lib/admin/store";
import { alertLinks, mapsLink } from "@/lib/admin/report";
import { centerOf } from "@/lib/admin/geo";
import { riskLabel, type MsgKey } from "@/lib/admin/i18n";
import { NUM_LOCALE } from "@/lib/admin/i18n-shell";
import type { Confidence } from "@/lib/admin/types";
import type { Ctx } from "./ctx";
import { ActivityCard } from "./activity-card";
import { EarlyCard } from "./early-card";
import { LayersPanel } from "./panel-layers";
import { OverviewCard, WeatherCard } from "./panel-overview";
import { Onboarding } from "./onboarding";
import { RulesCard } from "./rules-card";
import { Badge, Btn, Card, EmptyState, Segmented } from "./ui";

const SEGS = ["Capas", "Análisis", "Alertas", "Notas"] as const;
const SEG_KEY: Record<(typeof SEGS)[number], MsgKey> = {
  Capas: "gen.seg.layers",
  Análisis: "gen.seg.analysis",
  Alertas: "gen.seg.alerts",
  Notas: "gen.seg.notes",
};

const WINDOWS = [
  { value: 24, label: "24 h" },
  { value: 48, label: "48 h" },
  { value: 168, label: "7 d" },
  { value: 240, label: "10 d" },
];
const CONFS: { value: Confidence; label: MsgKey }[] = [
  { value: "l", label: "gen.conf.l" },
  { value: "n", label: "gen.conf.n" },
  { value: "h", label: "gen.conf.h" },
];

const timeAgo = (ctx: Ctx, at: number) => {
  const m = Math.max(0, Math.round((ctx.now - at) / 60000));
  return m < 1
    ? ctx.t("gen.now")
    : m < 60
      ? ctx.t("age.min", { n: m })
      : m < 1440
        ? ctx.t("age.hour", { n: Math.round(m / 60) })
        : ctx.t("age.day", { n: Math.round(m / 1440) });
};

function ShareRow({ text, ws, subject }: { text: string; ws: Ctx["ws"]; subject: string }) {
  const l = alertLinks(
    text,
    ws.settings.notify.whatsapp,
    ws.settings.notify.email,
    subject,
  );
  const cls =
    "rounded-md border border-[var(--hairline)] bg-card px-2 py-1 text-[10.5px] font-medium text-foreground/70 transition-colors hover:bg-foreground/[0.05]";
  return (
    <div className="mt-1.5 flex gap-1.5">
      <a className={cls} href={l.whatsapp} target="_blank" rel="noreferrer">
        WhatsApp
      </a>
      <a className={cls} href={l.email}>
        Email
      </a>
    </div>
  );
}

function AnalysisTab({ ctx }: { ctx: Ctx }) {
  const { t } = ctx;
  const s = ctx.ws.settings;
  const loc = NUM_LOCALE[s.locale];
  return (
    <>
      <Card bare title={t("gen.winConf")}>
        <div className="space-y-2.5">
          <Segmented
            label={t("gen.window")}
            value={ctx.hours}
            onChange={ctx.setHours}
            options={WINDOWS}
          />
          <Segmented
            label={t("gen.minConf")}
            value={s.minConfidence}
            onChange={(v) => ctx.setSettings({ minConfidence: v })}
            options={CONFS.map((c) => ({ ...c, label: t(c.label) }))}
          />
        </div>
      </Card>

      <Card
        bare
        title={t("gen.spreadTitle")}
        right={<Badge tone="sim">{t("gen.demo")}</Badge>}
      >
        <div className="flex items-center justify-between gap-2 text-[12px]">
          <span className="font-medium">
            {ctx.predH ? t("top.spreadTo", { h: ctx.predH }) : t("top.spreadOff")}
          </span>
          <PredPlay ctx={ctx} />
        </div>
        <p className="mt-0.5 text-[10.5px] text-foreground/45">
          {t("gen.spreadNote1")}
        </p>
        <input
          type="range"
          min={0}
          max={HORIZONS.length}
          step={1}
          value={
            ctx.predH
              ? HORIZONS.indexOf(ctx.predH as (typeof HORIZONS)[number]) + 1
              : 0
          }
          onChange={(e) =>
            ctx.setPredH(
              Number(e.target.value) === 0
                ? 0
                : HORIZONS[Number(e.target.value) - 1],
            )
          }
          aria-label={t("gen.horizon")}
          className="mt-2 w-full accent-[var(--fire)]"
        />
        <div className="num flex justify-between text-[9.5px] text-foreground/40">
          <span>off</span>
          {HORIZONS.map((h) => (
            <span key={h}>+{h}h</span>
          ))}
        </div>
        {ctx.predH > 0 && ctx.spreadInfo.length > 0 && (
          <ul
            className="mt-3 space-y-1.5"
            aria-label={t("gen.spreadConds")}
          >
            {ctx.spreadInfo.map((c, i) => (
              <li
                key={`${c.near}-${i}`}
                className="rounded-lg bg-foreground/[0.04] px-2.5 py-2 text-[11px] leading-snug"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-medium">{c.near}</span>
                  <span
                    className={cn(
                      "shrink-0 text-[10px] font-semibold uppercase tracking-wide",
                      c.level === "bajo" && "text-primary",
                      c.level === "moderado" && "text-[#8a6a00]",
                      c.level === "alto" && "text-[#c2540a]",
                      c.level === "extremo" && "text-[#b83a3a]",
                    )}
                  >
                    {riskLabel(t, c.level)}
                  </span>
                </div>
                <div className="num mt-0.5 text-foreground/55">
                  {t("gen.windLine", {
                    w: Math.round(c.wind),
                    dir: t(`dir.${compass(c.windDir)}` as MsgKey),
                    rh: Math.round(c.rh),
                    temp: Math.round(c.temp),
                    rain: Math.round(c.rain7d),
                  })}
                </div>
                <div className="num text-foreground/55">
                  {t("gen.rateLine", {
                    rate: c.rate.toFixed(1),
                    km: c.reachKm.toFixed(1),
                    max: c.reachMaxKm.toFixed(1),
                    h: ctx.predH,
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[10.5px] leading-snug text-foreground/45">
          {t("gen.spreadNote2")}
        </p>
      </Card>

      <Card bare title={t("gen.clusters")}>
        {ctx.clusters.length === 0 && (
          <p className="text-[12px] text-foreground/45">
            {ctx.payload
              ? t("gen.clustersNone")
              : t("gen.noSat")}
          </p>
        )}
        <ol className="-mx-1.5 space-y-px">
          {ctx.clusters.map((c, i) => (
            <li key={`${c.lat}-${c.lng}`}>
              <button
                type="button"
                onClick={() => ctx.map.current?.flyTo([c.lng, c.lat], 10.8)}
                className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-foreground/[0.05]"
              >
                <span className="num grid size-5 shrink-0 place-items-center rounded-full bg-[var(--fire-soft)] text-[10px] font-bold text-[var(--fire)]">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-medium">
                    {t("gen.clusterWhere", { km: c.km, near: c.near })}
                  </span>
                  <span className="num text-[10.5px] text-foreground/50">
                    {t("gen.clusterStats", { n: c.count, mw: c.frp.toLocaleString(loc) })}
                  </span>
                </span>
                <MapPin className="size-3.5 text-foreground/30" aria-hidden />
              </button>
            </li>
          ))}
        </ol>
      </Card>

      <Card bare title={t("gen.export")}>
        <div className="grid grid-cols-2 gap-2">
          <Btn onClick={ctx.exportCsv} disabled={!ctx.payload}>
            <Download className="size-3.5" /> {t("gen.csv")}
          </Btn>
          <Btn onClick={ctx.exportReport} disabled={!ctx.payload}>
            <FileText className="size-3.5" /> {t("gen.pdf")}
          </Btn>
        </div>
      </Card>
    </>
  );
}

const PRED_STEP_MS = 1400;

/** Steps the projection through its horizons so the advance of the front reads as motion. */
function PredPlay({ ctx }: { ctx: Ctx }) {
  const [playing, setPlaying] = useState(false);
  const { predH, setPredH, t: tr } = ctx;
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      const i = HORIZONS.indexOf(predH as (typeof HORIZONS)[number]);
      setPredH(HORIZONS[(i + 1) % HORIZONS.length]);
    }, PRED_STEP_MS);
    return () => clearTimeout(t);
  }, [playing, predH, setPredH]);
  return (
    <Btn
      onClick={() => {
        if (!playing && !predH) setPredH(HORIZONS[0]);
        setPlaying((p) => !p);
      }}
      aria-pressed={playing}
      className="min-h-8"
    >
      {playing ? tr("gen.pause") : tr("gen.animate")}
    </Btn>
  );
}

function AlertsTab({ ctx }: { ctx: Ctx }) {
  const { ws, zoneHits, sensors, t } = ctx;
  const loc = NUM_LOCALE[ws.settings.locale];
  const zoneAlerts = ws.features.filter(
    (f) => (zoneHits[f.id]?.recent ?? 0) > 0,
  );
  const sensorAlerts = sensors.filter((x) => x.reading.alert);
  return (
    <>
      <EarlyCard ctx={ctx} />
      <Card
        bare
        title={t("gen.activeAlerts")}
        right={
          ctx.alertCount > 0 ? (
            <Badge tone="fire">{ctx.alertCount}</Badge>
          ) : undefined
        }
      >
        {zoneAlerts.length + sensorAlerts.length + ctx.ruleFirings.size === 0 && (
          <EmptyState
            icon={<BellRing className="size-4" />}
            title={t("gen.allGood")}
          >
            {t("gen.allGoodBody", { km: ws.settings.bufferKm })}
          </EmptyState>
        )}
        <div className="space-y-2">
          {zoneAlerts.map((z) => {
            const hits = zoneHits[z.id].recent;
            const ack = ctx.alertAck[zoneKey(z.id)];
            const handled = isAcked(ack, hits, ctx.now);
            return (
            <div
              key={z.id}
              className={cn(
                "rounded-lg border p-2.5",
                handled
                  ? "border-[var(--hairline)] bg-foreground/[0.03]"
                  : "border-[#b83a3a]/25 bg-[#b83a3a]/[0.06]",
              )}
            >
              <button
                type="button"
                onClick={() => {
                  ctx.select(z.id);
                  ctx.map.current?.fitFeature(z);
                }}
                className="flex w-full items-start gap-2.5 text-left"
              >
                <Flame
                  className="mt-0.5 size-4 shrink-0 text-[#b83a3a]"
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-semibold text-[#b83a3a]">
                    {ws.meta[z.id]?.name ?? t("res.zone")}
                  </span>
                  <span className="text-[11px] text-foreground/65">
                    {t("gen.zoneHits", { n: zoneHits[z.id].recent, km: ws.settings.bufferKm })}
                  </span>
                </span>
              </button>
              <ShareRow
                ws={ws}
                subject={t("rep.alertSubject")}
                text={t("gen.shareText", {
                  name: ws.meta[z.id]?.name ?? t("res.zone"),
                  n: zoneHits[z.id].recent,
                  link: mapsLink(...centerOf(z)),
                })}
              />
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                {handled ? (
                  <>
                    <span className="text-foreground/65">
                      {ack?.until && ack.until > ctx.now ? t("gen.snoozedBy") : t("gen.ackedBy")}{" "}
                      <b>{ack?.by || t("zd.operator")}</b> · <span className="num">{when(ack?.t ?? 0, loc)}</span>
                    </span>
                    <Btn onClick={() => ctx.reopenZoneAlert(z.id)} className="min-h-7">
                      {t("early.reopen")}
                    </Btn>
                  </>
                ) : (
                  <>
                    <Btn variant="solid" onClick={() => ctx.ackZoneAlert(z.id, hits)} className="min-h-7">
                      {t("early.ack")}
                    </Btn>
                    <Btn onClick={() => ctx.ackZoneAlert(z.id, hits, 60)} className="min-h-7">
                      {t("early.snooze")}
                    </Btn>
                    {ack && (
                      <span className="text-foreground/55">{t("gen.reopened")}</span>
                    )}
                  </>
                )}
              </div>
            </div>
            );
          })}
          {sensorAlerts.map((x) => (
            <div
              key={x.feat.id}
              className="rounded-lg border border-[#e8710a]/30 bg-[#e8710a]/[0.07] p-2.5"
            >
              <button
                type="button"
                onClick={() => {
                  ctx.select(x.feat.id);
                  ctx.map.current?.fitFeature(x.feat);
                }}
                className="flex w-full items-start gap-2.5 text-left"
              >
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0 text-[var(--state-watch-ink)]"
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-semibold text-[var(--state-watch-ink)]">
                    {x.meta.name}
                  </span>
                  <span className="text-[11px] text-foreground/65">
                    {t("gen.sensorOut", { v: x.reading.value, unit: x.reading.unit })}{" "}
                    <Badge tone="sim">{t("res.sim")}</Badge>
                  </span>
                </span>
              </button>
            </div>
          ))}
        </div>
      </Card>

      <RulesCard ctx={ctx} />

      <ActivityCard ctx={ctx} />

      <Card
        bare
        title={t("gen.recent")}
        right={<Badge tone="ok">{t("gen.live")}</Badge>}
      >
        {ctx.feed.length === 0 && (
          <p className="text-[12px] text-foreground/45">
            {t("gen.noEvents")}
          </p>
        )}
        <ol className="-mx-1.5 space-y-px">
          {ctx.feed.map((it) => {
            const Icon =
              it.kind === "fire" || it.kind === "zone"
                ? Flame
                : it.kind === "sensor"
                  ? Radio
                  : Plane;
            const tone =
              it.kind === "zone"
                ? "#b83a3a"
                : it.kind === "fire"
                  ? "#e8710a"
                  : "#0e9aa7";
            return (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (it.at) ctx.map.current?.flyTo(it.at, 11);
                    const f = it.featId
                      ? ws.features.find((x) => x.id === it.featId)
                      : undefined;
                    if (f) {
                      ctx.select(f.id);
                      ctx.map.current?.fitFeature(f);
                    }
                  }}
                  className="flex w-full items-start gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-foreground/[0.05]"
                >
                  <Icon
                    className="mt-0.5 size-3.5 shrink-0"
                    style={{ color: tone }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium leading-snug">
                      {it.title} {it.sim && <Badge tone="sim">{t("lay.b.sim")}</Badge>}
                    </span>
                    <span className="block truncate text-[10.5px] text-foreground/50">
                      {it.sub}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] text-foreground/40">
                    {timeAgo(ctx, it.t)}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </Card>
    </>
  );
}

const when = (at: number, loc: string) =>
  new Date(at).toLocaleString(loc, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Dated, attributed log (who wrote what and when) plus the old free-text scratchpad. */
function NotesTab({ ctx }: { ctx: Ctx }) {
  const { t } = ctx;
  const loc = NUM_LOCALE[ctx.ws.settings.locale];
  const [draft, setDraft] = useState("");
  const [link, setLink] = useState(false);
  const sel = ctx.selectedId
    ? ctx.ws.features.find((f) => f.id === ctx.selectedId)
    : undefined;
  const selName = sel ? (ctx.ws.meta[sel.id]?.name ?? t("res.element")) : "";
  const add = () => {
    if (!draft.trim()) return;
    ctx.addNote(draft, link && sel ? sel.id : undefined);
    setDraft("");
  };
  return (
    <>
      <Card bare title={t("gen.log")} right={<Badge>{ctx.noteLog.length}</Badge>}>
        <label htmlFor="note-draft" className="sr-only">
          {t("gen.logNew")}
        </label>
        <textarea
          id="note-draft"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              add();
            }
          }}
          placeholder={t("gen.logPh")}
          rows={3}
          maxLength={NOTE_TEXT_MAX}
          className="w-full resize-y rounded-lg border border-[var(--hairline)] bg-card p-2.5 text-[12.5px] leading-relaxed outline-none transition-[border-color,box-shadow] placeholder:text-foreground/35 focus:border-primary focus:ring-2 focus:ring-ring"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          {sel ? (
            <label className="flex items-center gap-1.5 text-[11.5px] text-foreground/65">
              <input
                type="checkbox"
                checked={link}
                onChange={(e) => setLink(e.target.checked)}
              />
              {t("gen.link", { name: selName })}
            </label>
          ) : (
            <span className="text-[11px] text-foreground/45">
              {t("gen.ctrlEnter")}
            </span>
          )}
          <Btn variant="solid" onClick={add} disabled={!draft.trim()}>
            {t("zd.add")}
          </Btn>
        </div>
        {ctx.noteLog.length === 0 ? (
          <p className="mt-3 text-[12px] leading-snug text-foreground/60">
            {t("gen.logEmpty")}
          </p>
        ) : (
          <ol className="mt-3 space-y-2" aria-label={t("gen.logList")}>
            {ctx.noteLog.map((n) => {
              const f = n.featId
                ? ctx.ws.features.find((x) => x.id === n.featId)
                : undefined;
              return (
                <li
                  key={n.id}
                  className="rounded-lg border border-[var(--hairline)] p-2.5"
                >
                  <div className="flex items-start justify-between gap-2 text-[11px] text-foreground/55">
                    <span className="min-w-0 truncate">
                      <b className="font-semibold text-foreground/75">
                        {n.by || t("zd.operator")}
                      </b>{" "}
                      · <span className="num">{when(n.t, loc)}</span>
                    </span>
                    <button
                      type="button"
                      aria-label={t("gen.logDelete")}
                      onClick={() => ctx.removeNote(n.id)}
                      className="grid size-6 shrink-0 place-items-center rounded text-foreground/40 hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Trash2 className="size-3" aria-hidden />
                    </button>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-snug">
                    {n.text}
                  </p>
                  {f && (
                    <button
                      type="button"
                      onClick={() => {
                        ctx.select(f.id);
                        ctx.map.current?.fitFeature(f);
                      }}
                      className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-foreground/[0.06] px-1.5 py-0.5 text-[10.5px] font-medium text-foreground/70 hover:bg-foreground/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <MapPin className="size-3" aria-hidden />
                      {ctx.ws.meta[f.id]?.name ?? t("gen.element")}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </Card>
      <Card
        bare
        title={t("gen.notesTitle")}
        right={
          <span className="num text-[10px] text-foreground/40">
            {ctx.ws.notes.length.toLocaleString(loc)} / {(20000).toLocaleString(loc)}
          </span>
        }
      >
        <label htmlFor="notes" className="sr-only">
          {t("gen.notesTitle")}
        </label>
        <textarea
          id="notes"
          value={ctx.ws.notes}
          onChange={(e) => ctx.setNotes(e.target.value)}
          placeholder={t("gen.notesPh")}
          rows={8}
          className="w-full resize-y rounded-lg border border-[var(--hairline)] bg-card p-2.5 text-[12.5px] leading-relaxed outline-none transition-[border-color,box-shadow] placeholder:text-foreground/35 focus:border-primary focus:ring-2 focus:ring-ring"
        />
        <p className="mt-1.5 flex items-center gap-1.5 text-[10.5px] text-foreground/45">
          <NotebookPen className="size-3" aria-hidden /> {t("gen.notesSaved")}
        </p>
      </Card>
    </>
  );
}

const POINTS = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
const compass = (deg: number) =>
  POINTS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];

const tabId = (x: string) => `panel-tab-${x}`;
const panelId = (x: string) => `panel-tabpanel-${x}`;

export function GeneralPanel({ ctx }: { ctx: Ctx }) {
  const { panelSeg: seg, setPanelSeg: setSeg, t } = ctx;
  // roving tabindex: arrows/Home/End move focus and selection together
  const onTabKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const i = SEGS.indexOf(seg);
    const next =
      e.key === "ArrowRight"
        ? (i + 1) % SEGS.length
        : e.key === "ArrowLeft"
          ? (i - 1 + SEGS.length) % SEGS.length
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? SEGS.length - 1
              : -1;
    if (next < 0) return;
    e.preventDefault();
    setSeg(SEGS[next]);
    document.getElementById(tabId(SEGS[next]))?.focus();
  };
  return (
    <div>
      <div className="px-3 pt-3 empty:hidden">
        <Onboarding ctx={ctx} goTab={ctx.goTab} />
      </div>
      <div
        role="tablist"
        aria-label={t("gen.tabs")}
        onKeyDown={onTabKey}
        className="sticky top-0 z-10 flex border-b border-[var(--hairline)] bg-card/95 px-2 backdrop-blur"
      >
        {SEGS.map((x) => (
          <button
            key={x}
            id={tabId(x)}
            role="tab"
            type="button"
            aria-selected={seg === x}
            aria-controls={panelId(x)}
            tabIndex={seg === x ? 0 : -1}
            onClick={() => setSeg(x)}
            className={cn(
              "relative flex-1 px-1 py-2.5 max-md:py-3.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              seg === x
                ? "text-foreground"
                : "text-foreground/45 hover:text-foreground/75",
            )}
          >
            {t(SEG_KEY[x])}
            {x === "Alertas" && ctx.alertCount + ctx.unackedRules > 0 && (
              <span className="num ml-1 inline-grid min-w-4 place-items-center rounded-full bg-[#b83a3a] px-1 text-[9.5px] font-bold text-white">
                {ctx.alertCount + ctx.unackedRules}
              </span>
            )}
            {seg === x && (
              <span
                aria-hidden
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--fire)]"
              />
            )}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={panelId(seg)} aria-labelledby={tabId(seg)}>
        {seg === "Capas" && <LayersPanel ctx={ctx} />}
        {seg === "Análisis" && <AnalysisTab ctx={ctx} />}
        {seg === "Alertas" && <AlertsTab ctx={ctx} />}
        {seg === "Notas" && <NotesTab ctx={ctx} />}
      </div>
      <div className="border-t border-[var(--hairline)]">
        <OverviewCard ctx={ctx} />
        <WeatherCard ctx={ctx} />
      </div>
    </div>
  );
}
