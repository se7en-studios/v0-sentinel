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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HORIZONS } from "@/lib/admin/spread";
import { alertLinks, mapsLink } from "@/lib/admin/report";
import { centerOf } from "@/lib/admin/geo";
import type { Confidence } from "@/lib/admin/types";
import type { Ctx } from "./ctx";
import { LayersPanel } from "./panel-layers";
import { OverviewCard, WeatherCard } from "./panel-overview";
import { Onboarding } from "./onboarding";
import { RulesCard } from "./rules-card";
import { Badge, Btn, Card, EmptyState, Segmented } from "./ui";

const SEGS = ["Capas", "Análisis", "Alertas", "Notas"] as const;

const WINDOWS = [
  { value: 24, label: "24 h" },
  { value: 48, label: "48 h" },
  { value: 168, label: "7 d" },
  { value: 240, label: "10 d" },
];
const CONFS: { value: Confidence; label: string }[] = [
  { value: "l", label: "Todos" },
  { value: "n", label: "Nominal+" },
  { value: "h", label: "Alta" },
];

const timeAgo = (t: number, now: number) => {
  const m = Math.max(0, Math.round((now - t) / 60000));
  return m < 1
    ? "ahora"
    : m < 60
      ? `hace ${m} min`
      : m < 1440
        ? `hace ${Math.round(m / 60)} h`
        : `hace ${Math.round(m / 1440)} d`;
};

function ShareRow({ text, ws }: { text: string; ws: Ctx["ws"] }) {
  const l = alertLinks(
    text,
    ws.settings.notify.whatsapp,
    ws.settings.notify.email,
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
  const s = ctx.ws.settings;
  return (
    <>
      <Card bare title="Ventana y confianza">
        <div className="space-y-2.5">
          <Segmented
            label="Ventana de tiempo"
            value={ctx.hours}
            onChange={ctx.setHours}
            options={WINDOWS}
          />
          <Segmented
            label="Confianza mínima"
            value={s.minConfidence}
            onChange={(v) => ctx.setSettings({ minConfidence: v })}
            options={CONFS}
          />
        </div>
      </Card>

      <Card
        bare
        title="Predicción de propagación"
        right={<Badge tone="sim">demostrativo</Badge>}
      >
        <div className="flex items-center justify-between gap-2 text-[12px]">
          <span className="font-medium">
            {ctx.predH ? `Proyección a +${ctx.predH} h` : "Desactivada"}
          </span>
          <PredPlay ctx={ctx} />
        </div>
        <p className="mt-0.5 text-[10.5px] text-foreground/45">
          Usa viento y humedad reales.
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
          aria-label="Horizonte de predicción"
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
            aria-label="Condiciones de propagación"
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
                    {c.level}
                  </span>
                </div>
                <div className="num mt-0.5 text-foreground/55">
                  Viento {Math.round(c.wind)} km/h del {compass(c.windDir)} · HR{" "}
                  {Math.round(c.rh)} % · {Math.round(c.temp)} °C · lluvia 7 d{" "}
                  {Math.round(c.rain7d)} mm
                </div>
                <div className="num text-foreground/55">
                  ≈ {c.rate.toFixed(1)} km/h · avanzaría ~{c.reachKm.toFixed(1)}{" "}
                  km en {ctx.predH} h
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[10.5px] leading-snug text-foreground/45">
          Elipse a favor del viento desde las concentraciones principales.
          Modelo simplificado (viento, humedad, temperatura y lluvia): no
          considera combustible ni pendiente.
        </p>
      </Card>

      <Card bare title="Concentraciones principales">
        {ctx.clusters.length === 0 && (
          <p className="text-[12px] text-foreground/45">
            {ctx.payload
              ? "Sin concentraciones con esta confianza."
              : "Sin datos satelitales."}
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
                    {c.km} km de {c.near}
                  </span>
                  <span className="num text-[10.5px] text-foreground/50">
                    {c.count} focos · {c.frp.toLocaleString("es-AR")} MW
                  </span>
                </span>
                <MapPin className="size-3.5 text-foreground/30" aria-hidden />
              </button>
            </li>
          ))}
        </ol>
      </Card>

      <Card bare title="Exportar">
        <div className="grid grid-cols-2 gap-2">
          <Btn onClick={ctx.exportCsv} disabled={!ctx.payload}>
            <Download className="size-3.5" /> Focos CSV
          </Btn>
          <Btn onClick={ctx.exportReport} disabled={!ctx.payload}>
            <FileText className="size-3.5" /> Reporte PDF
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
  const { predH, setPredH } = ctx;
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
      {playing ? "Pausar" : "Animar avance"}
    </Btn>
  );
}

function AlertsTab({ ctx }: { ctx: Ctx }) {
  const { ws, zoneHits, sensors } = ctx;
  const zoneAlerts = ws.features.filter(
    (f) => (zoneHits[f.id]?.recent ?? 0) > 0,
  );
  const sensorAlerts = sensors.filter((x) => x.reading.alert);
  return (
    <>
      <Card
        bare
        title="Alertas activas"
        right={
          ctx.alertCount > 0 ? (
            <Badge tone="fire">{ctx.alertCount}</Badge>
          ) : undefined
        }
      >
        {ctx.alertCount + ctx.ruleFirings.size === 0 && (
          <EmptyState
            icon={<BellRing className="size-4" />}
            title="Todo en orden"
          >
            Sin focos dentro de tus zonas ni sensores fuera de umbral. Radio de
            alerta: {ws.settings.bufferKm} km.
          </EmptyState>
        )}
        <div className="space-y-2">
          {zoneAlerts.map((z) => (
            <div
              key={z.id}
              className="rounded-lg border border-[#b83a3a]/25 bg-[#b83a3a]/[0.06] p-2.5"
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
                    {ws.meta[z.id]?.name ?? "Zona"}
                  </span>
                  <span className="text-[11px] text-foreground/65">
                    {zoneHits[z.id].recent} focos en 48 h dentro del área o a{" "}
                    {ws.settings.bufferKm} km
                  </span>
                </span>
              </button>
              <ShareRow
                ws={ws}
                text={`Sentinel: ${ws.meta[z.id]?.name ?? "Zona"} tiene ${zoneHits[z.id].recent} focos en las últimas 48 h. Ubicación: ${mapsLink(...centerOf(z))}`}
              />
            </div>
          ))}
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
                  className="mt-0.5 size-4 shrink-0 text-[#b9560a]"
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-semibold text-[#b9560a]">
                    {x.meta.name}
                  </span>
                  <span className="text-[11px] text-foreground/65">
                    {x.reading.value} {x.reading.unit} fuera de umbral{" "}
                    <Badge tone="sim">simulado</Badge>
                  </span>
                </span>
              </button>
            </div>
          ))}
        </div>
      </Card>

      <RulesCard ctx={ctx} />

      <Card
        bare
        title="Actividad reciente"
        right={<Badge tone="ok">en vivo</Badge>}
      >
        {ctx.feed.length === 0 && (
          <p className="text-[12px] text-foreground/45">
            Sin eventos en las últimas 24 h.
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
                      {it.title} {it.sim && <Badge tone="sim">sim</Badge>}
                    </span>
                    <span className="block truncate text-[10.5px] text-foreground/50">
                      {it.sub}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] text-foreground/40">
                    {timeAgo(it.t, ctx.now)}
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

function NotesTab({ ctx }: { ctx: Ctx }) {
  return (
    <Card
      bare
      title="Notas del operador"
      right={
        <span className="num text-[10px] text-foreground/40">
          {ctx.ws.notes.length.toLocaleString("es-AR")} / 20.000
        </span>
      }
    >
      <label htmlFor="notes" className="sr-only">
        Notas
      </label>
      <textarea
        id="notes"
        value={ctx.ws.notes}
        onChange={(e) => ctx.setNotes(e.target.value)}
        placeholder="Bitácora de guardia, pendientes, contactos, observaciones del terreno…"
        rows={14}
        className="w-full resize-y rounded-lg border border-[var(--hairline)] bg-card p-2.5 text-[12.5px] leading-relaxed outline-none transition-[border-color,box-shadow] placeholder:text-foreground/35 focus:border-primary focus:ring-2 focus:ring-ring"
      />
      <p className="mt-1.5 flex items-center gap-1.5 text-[10.5px] text-foreground/45">
        <NotebookPen className="size-3" aria-hidden /> Se guarda con tu espacio
        de trabajo.
      </p>
    </Card>
  );
}

const POINTS = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
const compass = (deg: number) =>
  POINTS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];

export function GeneralPanel({ ctx }: { ctx: Ctx }) {
  const { panelSeg: seg, setPanelSeg: setSeg } = ctx;
  return (
    <div>
      <div className="px-3 pt-3 empty:hidden">
        <Onboarding ctx={ctx} goTab={ctx.goTab} />
      </div>
      <div
        role="tablist"
        aria-label="Secciones del panel"
        className="sticky top-0 z-10 flex border-b border-[var(--hairline)] bg-card/95 px-2 backdrop-blur"
      >
        {SEGS.map((x) => (
          <button
            key={x}
            role="tab"
            type="button"
            aria-selected={seg === x}
            onClick={() => setSeg(x)}
            className={cn(
              "relative flex-1 px-1 py-2.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              seg === x
                ? "text-foreground"
                : "text-foreground/45 hover:text-foreground/75",
            )}
          >
            {x}
            {x === "Alertas" && ctx.alertCount + ctx.ruleFirings.size > 0 && (
              <span className="num ml-1 inline-grid min-w-4 place-items-center rounded-full bg-[#b83a3a] px-1 text-[9.5px] font-bold text-white">
                {ctx.alertCount + ctx.ruleFirings.size}
              </span>
            )}
            {seg === x && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--fire)]" />
            )}
          </button>
        ))}
      </div>
      <div role="tabpanel">
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
