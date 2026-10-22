"use client";

import {
  CloudRain,
  Droplets,
  Flame,
  Gauge,
  Thermometer,
  Wind,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { compass } from "@/lib/admin/weather";
import { riskScore } from "@/lib/admin/sim";
import { spreadRingsKm } from "@/lib/admin/spread";
import { areaHa, fmtArea } from "@/lib/admin/geo";
import { MODE_ROLE, REGIONS } from "@/lib/admin/types";
import type { Ctx } from "./ctx";
import { Btn, Card, KV, Skeleton } from "./ui";

/** Reference-style incident overview, adapted to monitoring: key facts at a glance. */
export function OverviewCard({ ctx }: { ctx: Ctx }) {
  const { ws, stats, payload } = ctx;
  const s = ws.settings;
  const region = REGIONS.find((r) => r.id === s.regionId) ?? REGIONS[1];
  const zones = ws.features.filter(
    (f) => MODE_ROLE[String(f.properties.mode)] === "zone",
  );
  const protectedHa = zones.reduce((a, z) => a + areaHa(z), 0);
  const status = ctx.firesError
    ? "Sin datos"
    : ctx.playing
      ? "Reproduciendo"
      : ctx.cursor !== null
        ? "Histórico"
        : "En vivo";
  return (
    <Card bare title="Resumen de monitoreo">
      <dl>
        <KV k="Organización">{s.org || "—"}</KV>
        <KV k="Región">{region.name.split("(")[0].trim()}</KV>
        <KV k="Zonas vigiladas">
          {zones.length} · {fmtArea(protectedHa, s.units)}
        </KV>
        <KV k="Focos (24 h)">
          <span className={cn("num", stats.last24 > 0 && "text-[#c8321e]")}>
            {stats.last24.toLocaleString("es-AR")}
          </span>
        </KV>
        <KV k="Focos (10 días)">
          <span className="num">{stats.total.toLocaleString("es-AR")}</span>
        </KV>
        <KV k="Superficie estimada">
          <span className="num">{fmtArea(stats.hectares, s.units)}</span>
        </KV>
        <KV k="Fuente">NASA FIRMS · VIIRS 375 m</KV>
        <KV k="Actualizado" mono>
          {payload
            ? new Date(payload.updated).toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—"}
        </KV>
        <KV k="Estado">
          <span className="inline-flex items-center gap-1.5">
            <span
              className={cn(
                "size-1.5 rounded-full",
                ctx.firesError ? "bg-[#b83a3a]" : "animate-pulse bg-primary",
              )}
            />
            {status}
          </span>
        </KV>
      </dl>
    </Card>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof Wind;
  label: string;
  value: string;
  sub?: string;
  tone?: string;
}) {
  return (
    <div className="min-w-0 rounded-lg bg-foreground/[0.04] px-2 py-1.5">
      <div className="flex items-center gap-1 text-[9.5px] font-medium uppercase tracking-wider text-foreground/45">
        <Icon className="size-3 shrink-0" aria-hidden />
        <span className="truncate">{label}</span>
      </div>
      <div
        className="num mt-0.5 truncate font-heading text-[15px] font-bold leading-tight"
        style={tone ? { color: tone } : undefined}
      >
        {value}
      </div>
      {sub && (
        <div className="truncate text-[9.5px] text-foreground/45">{sub}</div>
      )}
    </div>
  );
}

/** Weather and expected fire behaviour at the centre of the map. */
export function WeatherCard({ ctx }: { ctx: Ctx }) {
  const w = ctx.weather;
  const risk = w ? riskScore(w) : null;
  const rate = w ? spreadRingsKm(w, 1).head : null;
  return (
    <Card
      bare
      title="Clima y comportamiento del fuego"
      right={
        <span className="text-[9.5px] text-foreground/40">centro del mapa</span>
      }
    >
      {w && risk ? (
        <>
          <div className="grid grid-cols-3 gap-1.5">
            <Tile
              icon={Wind}
              label="Viento"
              value={`${Math.round(w.wind)} km/h`}
              sub={compass(w.windDir)}
            />
            <Tile
              icon={Thermometer}
              label="Temp."
              value={`${Math.round(w.temp)}°C`}
            />
            <Tile
              icon={Droplets}
              label="Humedad"
              value={`${Math.round(w.rh)}%`}
              tone={w.rh < 30 ? "#b9560a" : undefined}
            />
            <Tile
              icon={CloudRain}
              label="Lluvia 7 d"
              value={`${Math.round(w.rain7d)} mm`}
            />
            <Tile
              icon={Gauge}
              label="Riesgo"
              value={`${risk.score}`}
              sub={risk.label}
              tone={risk.color}
            />
            <Tile
              icon={Flame}
              label="Propagación"
              value={`${(rate ?? 0).toFixed(1)} km/h`}
              sub="estimada"
            />
          </div>
          <p className="mt-2 text-[10px] leading-snug text-foreground/40">
            Indicadores de referencia a partir de clima real (Open-Meteo). No
            reemplazan el FWI oficial.
          </p>
        </>
      ) : ctx.weatherStatus === "error" ? (
        <div className="rounded-lg bg-foreground/[0.04] p-3 text-[12px] leading-snug">
          <p className="text-foreground/70">
            No pudimos consultar el clima. Los demás datos del panel siguen al
            día.
          </p>
          <Btn onClick={ctx.retryWeather} className="mt-2 min-h-8">
            Reintentar
          </Btn>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-[52px]" />
          ))}
        </div>
      )}
    </Card>
  );
}
