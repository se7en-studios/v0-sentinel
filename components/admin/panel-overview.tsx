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
import { spreadRate } from "@/lib/admin/spread";
import { areaHa, fmtArea } from "@/lib/admin/geo";
import { riskLabel, type MsgKey } from "@/lib/admin/i18n";
import { NUM_LOCALE } from "@/lib/admin/i18n-shell";
import { MODE_ROLE, REGIONS } from "@/lib/admin/types";
import type { Ctx } from "./ctx";
import { Btn, Card, KV, Skeleton } from "./ui";

/** Reference-style incident overview, adapted to monitoring: key facts at a glance. */
export function OverviewCard({ ctx }: { ctx: Ctx }) {
  const { ws, stats, payload, t } = ctx;
  const s = ws.settings;
  const loc = NUM_LOCALE[s.locale];
  const region = REGIONS.find((r) => r.id === s.regionId) ?? REGIONS[1];
  const zones = ws.features.filter(
    (f) => MODE_ROLE[String(f.properties.mode)] === "zone",
  );
  const protectedHa = zones.reduce((a, z) => a + areaHa(z), 0);
  const status = ctx.firesError
    ? t("ovw.st.nodata")
    : ctx.playing
      ? t("ovw.st.playing")
      : ctx.cursor !== null
        ? t("ovw.st.hist")
        : t("ovw.st.live");
  return (
    <Card bare title={t("ovw.title")}>
      <dl>
        <KV k={t("ovw.org")}>{s.org || "—"}</KV>
        <KV k={t("ovw.region")}>{region.name.split("(")[0].trim()}</KV>
        <KV k={t("ovw.zones")}>
          {zones.length} · {fmtArea(protectedHa, s.units, loc)}
        </KV>
        <KV k={t("ovw.fires24")}>
          <span className={cn("num", stats.last24 > 0 && "text-[#c8321e]")}>
            {stats.last24.toLocaleString(loc)}
          </span>
        </KV>
        <KV k={t("ovw.fires10")}>
          <span className="num">{stats.total.toLocaleString(loc)}</span>
        </KV>
        <KV k={t("ovw.area")}>
          <span className="num">{fmtArea(stats.hectares, s.units, loc)}</span>
        </KV>
        <KV k={t("ovw.source")}>NASA FIRMS · VIIRS 375 m</KV>
        <KV k={t("ovw.updated")} mono>
          {payload
            ? new Date(payload.updated).toLocaleTimeString(loc, {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—"}
        </KV>
        <KV k={t("ovw.state")}>
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
  const { t } = ctx;
  const w = ctx.weather;
  const risk = w ? riskScore(w) : null;
  const rate = w ? spreadRate(w) : null;
  return (
    <Card
      bare
      title={t("wx.title")}
      right={
        <span className="text-[9.5px] text-foreground/40">{t("wx.center")}</span>
      }
    >
      {w && risk ? (
        <>
          <div className="grid grid-cols-3 gap-1.5">
            <Tile
              icon={Wind}
              label={t("wx.wind")}
              value={`${Math.round(w.wind)} km/h`}
              sub={t(`dir.${compass(w.windDir)}` as MsgKey)}
            />
            <Tile
              icon={Thermometer}
              label={t("wx.temp")}
              value={`${Math.round(w.temp)}°C`}
            />
            <Tile
              icon={Droplets}
              label={t("wx.rh")}
              value={`${Math.round(w.rh)}%`}
              tone={w.rh < 30 ? "var(--state-watch-ink)" : undefined}
            />
            <Tile
              icon={CloudRain}
              label={t("wx.rain")}
              value={`${Math.round(w.rain7d)} mm`}
            />
            <Tile
              icon={Gauge}
              label={t("wx.risk")}
              value={`${risk.score}`}
              sub={riskLabel(t, risk.label)}
              tone={risk.color}
            />
            <Tile
              icon={Flame}
              label={t("wx.spread")}
              value={`${(rate ?? 0).toFixed(1)} km/h`}
              sub={t("wx.est")}
            />
          </div>
          <p className="mt-2 text-[10px] leading-snug text-foreground/40">
            {t("wx.note")}
          </p>
        </>
      ) : ctx.weatherStatus === "error" ? (
        <div className="rounded-lg bg-foreground/[0.04] p-3 text-[12px] leading-snug">
          <p className="text-foreground/70">
            {t("wx.error")}
          </p>
          <Btn onClick={ctx.retryWeather} className="mt-2 min-h-8">
            {t("ui.retry")}
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
