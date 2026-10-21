"use client";

import { useState } from "react";
import { AlertTriangle, Download, FileText, Flame, MapPin, Plane, Radio, Wind } from "lucide-react";
import { cn } from "@/lib/utils";
import { compass } from "@/lib/admin/weather";
import { riskScore } from "@/lib/admin/sim";
import { fmtArea } from "@/lib/admin/geo";
import { MODE_ROLE, REGIONS } from "@/lib/admin/types";
import type { Ctx, Tab } from "./ctx";
import { alertLinks, mapsLink } from "@/lib/admin/report";
import { centerOf } from "@/lib/admin/geo";
import { Onboarding } from "./onboarding";
import { Badge, Btn, Card, Stat, Toggle, inputCls } from "./ui";
import { HORIZONS } from "@/lib/admin/spread";

type Show = Record<"fires" | "heat" | "zones" | "lines" | "routes" | "sensors" | "drones" | "names" | "spread", boolean>;

const SEG = ["Capas", "Focos", "Actividad", "Alertas"] as const;
const WINDOWS = [
  { h: 24, label: "24 h" },
  { h: 48, label: "48 h" },
  { h: 168, label: "7 d" },
  { h: 240, label: "10 d" },
];
const CONFS = [
  { v: "l", label: "Todos" },
  { v: "n", label: "Nominal+" },
  { v: "h", label: "Alta" },
] as const;

const timeAgo = (t: number, now: number) => {
  const m = Math.max(0, Math.round((now - t) / 60000));
  return m < 1 ? "ahora" : m < 60 ? `hace ${m} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : `hace ${Math.round(m / 1440)} d`;
};

function ShareRow({ text, ws }: { text: string; ws: Ctx["ws"] }) {
  const l = alertLinks(text, ws.settings.notify.whatsapp, ws.settings.notify.email);
  const cls = "rounded-md border border-border bg-background/70 px-2 py-1 text-[11px] font-medium text-foreground/70 hover:bg-foreground/5";
  return (
    <div className="mt-1 flex gap-1.5 pl-1">
      <a className={cls} href={l.whatsapp} target="_blank" rel="noreferrer">Enviar por WhatsApp</a>
      <a className={cls} href={l.email}>Enviar por email</a>
    </div>
  );
}

export function GeneralPanel({
  ctx,
  show,
  setShow,
  goTab,
}: {
  ctx: Ctx;
  show: Show;
  setShow: (s: Show) => void;
  goTab: (t: Tab) => void;
}) {
  const [seg, setSeg] = useState<(typeof SEG)[number]>("Capas");
  const {
    stats,
    weather,
    clusters,
    ws,
    zoneHits,
    sensors,
    firesError,
    payload,
  } = ctx;
  const risk = weather ? riskScore(weather) : null;
  const zoneAlerts = ws.features.filter(
    (f) => (zoneHits[f.id]?.recent ?? 0) > 0,
  );
  const sensorAlerts = sensors.filter((s) => s.reading.alert);
  const alertCount = zoneAlerts.length + sensorAlerts.length;
  const set = (k: keyof Show) => (v: boolean) => setShow({ ...show, [k]: v });

  return (
    <div className="space-y-3 p-3.5">
      <Onboarding ctx={ctx} goTab={goTab} />
      <div
        role="tablist"
        aria-label="Secciones"
        className="grid grid-cols-4 rounded-md bg-foreground/6 p-0.5 text-[12px] font-medium"
      >
        {SEG.map((x) => (
          <button
            key={x}
            role="tab"
            type="button"
            aria-selected={seg === x}
            onClick={() => setSeg(x)}
            className={cn(
              "rounded px-2 py-1.5 transition-colors",
              seg === x
                ? "bg-background text-foreground shadow-sm"
                : "text-foreground/55 hover:text-foreground",
            )}
          >
            {x}
            {x === "Alertas" && alertCount > 0 && (
              <span className="ml-1 rounded-full bg-[#b83a3a] px-1.5 text-[10px] text-white">
                {alertCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <Card
        title="Argentina · últimos 10 días"
        right={<Badge tone="ok">VIIRS 375 m</Badge>}
      >
        <div className="grid grid-cols-2 gap-3">
          <Stat
            label="Focos (24 h)"
            value={stats.last24.toLocaleString("es-AR")}
            tone="fire"
          />
          <Stat
            label="Focos (10 días)"
            value={stats.total.toLocaleString("es-AR")}
          />
          <Stat
            label="Potencia total"
            value={`${stats.frp.toLocaleString("es-AR")} MW`}
            sub="FRP acumulada"
          />
          <Stat
            label="Superficie estimada"
            value={fmtArea(stats.hectares, ws.settings.units)}
            sub="cota superior ≈14 ha/foco"
          />
        </div>
        {firesError && (
          <p className="mt-2 text-[11.5px] text-[#b83a3a]">{firesError}</p>
        )}
        {payload && (
          <p className="mt-2 text-[10.5px] text-foreground/40">
            Actualizado{" "}
            {new Date(payload.updated).toLocaleTimeString("es-AR", {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            · NASA FIRMS (VIIRS S-NPP NRT)
          </p>
        )}
      </Card>

      <Card title="Ventana y confianza">
        <div className="space-y-2.5">
          <div className="grid grid-cols-4 gap-1" role="group" aria-label="Ventana de tiempo">
            {WINDOWS.map((w) => (
              <Btn key={w.h} variant={ctx.hours === w.h ? "active" : "ghost"} onClick={() => { ctx.setHours(w.h); ctx.setDayFilter(null); }}>
                {w.label}
              </Btn>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1" role="group" aria-label="Nivel de confianza">
            {CONFS.map((c) => (
              <Btn key={c.v} variant={ws.settings.minConfidence === c.v ? "active" : "ghost"} onClick={() => ctx.setSettings({ minConfidence: c.v })}>
                {c.label}
              </Btn>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Predicción de propagación" right={<Badge tone="sim">demostrativo</Badge>}>
        <div className="flex items-center justify-between text-[12.5px]">
          <span>{ctx.predH ? `Proyección a +${ctx.predH} h` : "Desactivada"}</span>
          <span className="text-foreground/50">viento y humedad reales</span>
        </div>
        <input
          type="range"
          min={0}
          max={HORIZONS.length}
          step={1}
          value={ctx.predH ? HORIZONS.indexOf(ctx.predH as (typeof HORIZONS)[number]) + 1 : 0}
          onChange={(e) => ctx.setPredH(Number(e.target.value) === 0 ? 0 : HORIZONS[Number(e.target.value) - 1])}
          aria-label="Horizonte de predicción"
          className="mt-2 w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-foreground/40">
          <span>off</span>
          {HORIZONS.map((h) => (
            <span key={h}>+{h}h</span>
          ))}
        </div>
        <p className="mt-2 text-[10.5px] text-foreground/45">Elipse que avanza a favor del viento desde las concentraciones principales. Modelo simplificado: no considera combustible ni pendiente.</p>
      </Card>

      {seg === "Capas" && (
        <>
          <Card title="Región">
            <label className="sr-only" htmlFor="region">
              Región
            </label>
            <select
              id="region"
              className={inputCls}
              value={ws.settings.regionId}
              onChange={(e) => ctx.setSettings({ regionId: e.target.value })}
            >
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Card>
          <Card title="Capas">
            <Toggle
              checked={show.fires}
              onChange={set("fires")}
              label="Anomalías térmicas (NASA FIRMS)"
              swatch="#e8710a"
            />
            <Toggle
              checked={show.heat}
              onChange={set("heat")}
              label="Mapa de calor"
              swatch="#c8321e"
            />
            <Toggle checked={show.spread} onChange={set("spread")} label="Propagación prevista" swatch="#ff4d2e" />
            <Toggle
              checked={show.zones}
              onChange={set("zones")}
              label="Zonas monitoreadas"
              swatch="#0f7a4f"
            />
            <Toggle
              checked={show.lines}
              onChange={set("lines")}
              label="Líneas y cortafuegos"
              swatch="#1b6fb8"
            />
            <Toggle
              checked={show.routes}
              onChange={set("routes")}
              label="Rutas de drones"
              swatch="#e8710a"
            />
            <Toggle
              checked={show.drones}
              onChange={set("drones")}
              label="Drones (simulado)"
              swatch="#ffffff"
            />
            <Toggle
              checked={show.sensors}
              onChange={set("sensors")}
              label="Sensores"
              swatch="#0e9aa7"
            />
            <Toggle
              checked={show.names}
              onChange={set("names")}
              label="Nombres y medidas"
            />
          </Card>
          <Card
            title="Clima en el centro del mapa"
            right={<Badge>Open-Meteo</Badge>}
          >
            {weather && risk ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="grid size-14 shrink-0 place-items-center rounded-full border-4 font-heading text-lg font-bold"
                    style={{ borderColor: risk.color, color: risk.color }}
                  >
                    {risk.score}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold">
                      Riesgo {risk.label.toLowerCase()}
                    </div>
                    <div className="text-[11px] text-foreground/50">
                      Indicador de referencia (temperatura, humedad, viento y
                      lluvia 7 d). No reemplaza el FWI oficial.
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <Stat label="Temp" value={`${Math.round(weather.temp)}°`} />
                  <Stat label="Humedad" value={`${Math.round(weather.rh)}%`} />
                  <Stat
                    label="Viento"
                    value={Math.round(weather.wind)}
                    sub={`km/h ${compass(weather.windDir)}`}
                  />
                  <Stat
                    label="Lluvia 7d"
                    value={`${Math.round(weather.rain7d)}`}
                    sub="mm"
                  />
                </div>
              </div>
            ) : (
              <p className="text-[12px] text-foreground/45">Cargando clima…</p>
            )}
          </Card>
        </>
      )}

      {seg === "Focos" && (
        <Card title="Concentraciones principales">
          {clusters.length === 0 && (
            <p className="text-[12px] text-foreground/45">
              {payload
                ? "Sin concentraciones relevantes con la confianza mínima elegida."
                : "Sin datos satelitales."}
            </p>
          )}
          <ol className="space-y-1">
            {clusters.map((c, i) => (
              <li key={`${c.lat}-${c.lng}`}>
                <button
                  type="button"
                  onClick={() => ctx.map.current?.flyTo([c.lng, c.lat], 10.5)}
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left hover:bg-foreground/5"
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#e8710a]/15 text-[11px] font-bold text-[#b9560a]">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-medium">
                      {c.km} km de {c.near}
                    </span>
                    <span className="text-[11px] text-foreground/50">
                      {c.count} focos · {c.frp.toLocaleString("es-AR")} MW
                    </span>
                  </span>
                  <MapPin className="size-3.5 text-foreground/35" aria-hidden />
                </button>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-[10.5px] text-foreground/40">
            Agrupación en celdas de ~15 km. La localidad es solo una referencia
            de cercanía.
          </p>
        </Card>
      )}

      {seg === "Actividad" && (
        <Card title="Actividad reciente" right={<Badge tone="ok">en vivo</Badge>}>
          {ctx.feed.length === 0 && <p className="text-[12px] text-foreground/45">Sin eventos en las últimas 24 h.</p>}
          <ol className="space-y-0.5">
            {ctx.feed.map((it) => {
              const Icon = it.kind === "fire" || it.kind === "zone" ? Flame : it.kind === "sensor" ? Radio : Plane;
              const tone = it.kind === "zone" ? "#b83a3a" : it.kind === "fire" ? "#e8710a" : "#0e9aa7";
              return (
                <li key={it.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (it.at) ctx.map.current?.flyTo(it.at, 11);
                      const f = it.featId ? ws.features.find((x) => x.id === it.featId) : undefined;
                      if (f) {
                        ctx.select(f.id);
                        ctx.map.current?.fitFeature(f);
                      }
                    }}
                    className="flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left hover:bg-foreground/5"
                  >
                    <Icon className="mt-0.5 size-3.5 shrink-0" style={{ color: tone }} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] font-medium leading-snug">{it.title} {it.sim && <Badge tone="sim">simulado</Badge>}</span>
                      <span className="block truncate text-[11px] text-foreground/50">{it.sub}</span>
                    </span>
                    <span className="shrink-0 text-[10.5px] text-foreground/40">{timeAgo(it.t, ctx.now)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </Card>
      )}

      {seg === "Alertas" && (
        <div className="space-y-3">
          {alertCount === 0 && (
            <Card>
              <p className="flex items-center gap-2 text-[13px] text-primary">
                <Wind className="size-4" aria-hidden /> Sin alertas activas en
                tus zonas ni sensores.
              </p>
              <p className="mt-1 text-[11.5px] text-foreground/50">
                Dibujá zonas en la pestaña Zonas para que Sentinel avise si
                entra un foco en el área o a {ws.settings.bufferKm} km.
              </p>
            </Card>
          )}
          {zoneAlerts.map((z) => (
<div key={z.id}>
            <button
              key={z.id}
              type="button"
              onClick={() => {
                ctx.select(z.id);
                ctx.map.current?.fitFeature(z);
              }}
              className="flex w-full items-start gap-3 rounded-lg border border-[#b83a3a]/30 bg-[#b83a3a]/8 p-3 text-left"
            >
              <Flame
                className="mt-0.5 size-4 shrink-0 text-[#b83a3a]"
                aria-hidden
              />
              <span>
                <span className="block text-[13px] font-semibold text-[#b83a3a]">
                  {ws.meta[z.id]?.name ?? "Zona"}
                </span>
                <span className="text-[12px] text-foreground/65">
                  {zoneHits[z.id].recent} focos en las últimas 48 h dentro del
                  área o a {ws.settings.bufferKm} km
                </span>
              </span>
            </button>
          <ShareRow ws={ws} text={`Sentinel: ${ws.meta[z.id]?.name ?? "Zona"} tiene ${zoneHits[z.id].recent} focos en las últimas 48 h. Ubicación: ${mapsLink(...centerOf(z))}`} />
</div>
))}
          {sensorAlerts.map((s) => (
<div key={s.feat.id}>
            <button
              key={s.feat.id}
              type="button"
              onClick={() => {
                ctx.select(s.feat.id);
                ctx.map.current?.fitFeature(s.feat);
              }}
              className="flex w-full items-start gap-3 rounded-lg border border-[#e8710a]/35 bg-[#e8710a]/10 p-3 text-left"
            >
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-[#b9560a]"
                aria-hidden
              />
              <span>
                <span className="block text-[13px] font-semibold text-[#b9560a]">
                  {s.meta.name}
                </span>
                <span className="text-[12px] text-foreground/65">
                  Lectura {s.reading.value} {s.reading.unit} fuera de umbral{" "}
                  <Badge tone="sim">simulado</Badge>
                </span>
              </span>
            </button>
          <ShareRow ws={ws} text={`Sentinel: ${s.meta.name} registra ${s.reading.value} ${s.reading.unit} (fuera de umbral, dato simulado). Ubicación: ${mapsLink(...(s.feat.geometry.coordinates as [number, number]))}`} />
</div>
))}
          <p className="text-[10.5px] text-foreground/40">
            {
              ws.features.filter(
                (f) => MODE_ROLE[String(f.properties.mode)] === "zone",
              ).length
            }{" "}
            zonas vigiladas · umbral de proximidad {ws.settings.bufferKm} km
            (configurable).
          </p>
        </div>
      )}
      <Card title="Reportes">
        <div className="grid grid-cols-2 gap-2">
          <Btn onClick={ctx.exportCsv} disabled={!ctx.payload}><Download className="size-3.5" /> Focos (CSV)</Btn>
          <Btn onClick={ctx.exportReport} disabled={!ctx.payload}><FileText className="size-3.5" /> Reporte PDF</Btn>
        </div>
      </Card>
    </div>
  );
}
