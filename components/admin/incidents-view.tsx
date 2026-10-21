"use client";

import { useMemo, useState } from "react";
import { Flame, Zap, MoveUpRight } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { buildIncidents, type Incident } from "@/lib/admin/incident";
import { nearestPlace } from "@/lib/admin/places";
import { fmtArea } from "@/lib/admin/geo";
import { cn } from "@/lib/utils";
import type { Ctx } from "./ctx";
import { Badge, Btn, Card, EmptyState, Segmented, Stat } from "./ui";

const REGION_KM = 300;
const LIST_MAX = 8;
type Scope = "region" | "ar";

const kmFrom = (center: [number, number], i: Incident) => {
  const dy = (i.lat - center[1]) * 111.32;
  const dx = (i.lng - center[0]) * 111.32 * Math.cos((i.lat * Math.PI) / 180);
  return Math.hypot(dx, dy);
};

const AXIS = { fontSize: 11, fill: "var(--chart-axis)" };
const FIRST = [245, 165, 36];
const LAST = [200, 50, 30];
const ramp = (t: number) =>
  `rgb(${FIRST.map((c, i) => Math.round(c + (LAST[i] - c) * t)).join(",")})`;
const EVENT_ICON = { ignition: Flame, explosive: Zap, jump: MoveUpRight };

/** Outline of every day's cumulative perimeter, oldest in amber to newest in red. */
function Silhouette({ inc }: { inc: Incident }) {
  const last = inc.hulls[inc.hulls.length - 1].ring;
  const kx = Math.cos((inc.lat * Math.PI) / 180);
  const xs = last.map((p) => p[0] * kx);
  const ys = last.map((p) => p[1]);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  const [y0, y1] = [Math.min(...ys), Math.max(...ys)];
  const span = Math.max(x1 - x0, y1 - y0) || 1;
  const pad = 6;
  const sc = (100 - 2 * pad) / span;
  const path = (ring: [number, number][]) =>
    ring
      .map(
        (p, i) =>
          `${i ? "L" : "M"}${(pad + (p[0] * kx - x0) * sc).toFixed(1)},${(100 - pad - (p[1] - y0) * sc).toFixed(1)}`,
      )
      .join("") + "Z";
  const n = inc.hulls.length;
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={`Silueta del avance del incendio en ${n} días`}
      className="size-full"
    >
      {[...inc.hulls].reverse().map((h, k) => {
        const t = n > 1 ? (n - 1 - k) / (n - 1) : 1;
        return (
          <path
            key={h.day}
            d={path(h.ring)}
            fill={ramp(t)}
            fillOpacity={0.28}
            stroke={ramp(t)}
            strokeWidth={0.8}
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
}

const dayLabel = (iso: string | undefined) =>
  iso
    ? new Date(`${iso}T12:00:00`).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
      })
    : "—";

/** Day-by-day perimeter growth for the biggest clusters of detections in the 10-day window. */
export function IncidentsView({ ctx }: { ctx: Ctx }) {
  const { payload, ws } = ctx;
  const days = payload?.days ?? [];
  const all = useMemo(
    () => (payload ? buildIncidents(payload.points, 60) : []),
    [payload],
  );
  const [scope, setScope] = useState<Scope>("region");
  const incidents = useMemo(
    () =>
      (scope === "ar"
        ? all
        : all.filter((i) => kmFrom(ctx.center, i) <= REGION_KM)
      ).slice(0, LIST_MAX),
    [all, scope, ctx.center],
  );
  const [selId, setSelId] = useState<string | null>(null);
  const inc = incidents.find((i) => i.id === selId) ?? incidents[0];
  const units = ws.settings.units;

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Incidentes</h1>
          <p className="text-[13px] text-foreground/55">
            Los mayores grupos de focos de los últimos 10 días, con el avance de
            su perímetro día a día y los eventos que lo marcaron.
          </p>
        </div>
        <Segmented
          label="Alcance"
          value={scope}
          onChange={setScope}
          options={[
            { value: "region", label: `Región (${REGION_KM} km)` },
            { value: "ar", label: "Argentina" },
          ]}
        />
      </div>

      {!inc ? (
        <EmptyState
          icon={<Flame className="size-5" />}
          title="Sin incidentes"
          action={
            scope === "region" && all.length > 0 ? (
              <Btn onClick={() => setScope("ar")}>
                Ver {all.length} en Argentina
              </Btn>
            ) : undefined
          }
        >
          {scope === "region"
            ? `No hay grupos de 5 o más focos a menos de ${REGION_KM} km de la región en vista.`
            : "No hay grupos de 5 o más focos cercanos en la ventana actual."}
        </EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <ul className="space-y-2" aria-label="Incidentes">
            {incidents.map((i) => {
              const place = nearestPlace(i.lat, i.lng);
              const on = i.id === inc.id;
              return (
                <li key={i.id}>
                  <button
                    type="button"
                    onClick={() => setSelId(i.id)}
                    aria-pressed={on}
                    className={cn(
                      "w-full rounded-xl border bg-card p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      on
                        ? "border-primary/60 shadow-[var(--shadow-1)]"
                        : "border-[var(--hairline)] hover:bg-foreground/[0.03]",
                    )}
                  >
                    <div className="text-[13px] font-semibold">
                      {place.near}
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-foreground/60">
                      a {place.km} km · {i.count} focos ·{" "}
                      {i.frp.toLocaleString("es-AR")} MW
                    </div>
                    <div className="num mt-1 font-heading text-[17px] font-bold">
                      {fmtArea(i.areaHa, units)}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="space-y-4">
            <div className="grid overflow-hidden rounded-xl bg-[#0f3d2c] text-white shadow-[var(--shadow-1)] sm:grid-cols-[1fr_200px]">
              <div className="p-4 sm:p-5">
                <Badge tone="sim">Estimación satelital</Badge>
                <h2 className="mt-2 font-heading text-[22px] font-bold leading-tight">
                  {nearestPlace(inc.lat, inc.lng).near}
                </h2>
                <div className="num mt-3 font-heading text-[40px] font-bold leading-none">
                  {fmtArea(inc.areaHa, units)}
                </div>
                <p className="mt-1 text-[12px] text-white/65">
                  perímetro acumulado al{" "}
                  {dayLabel(days[inc.perDay[inc.perDay.length - 1].day])}
                </p>
              </div>
              <div className="h-48 p-3 sm:h-auto">
                <Silhouette inc={inc} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                inc.perDay.length < 2
                  ? { label: "Último día", value: "—", sub: "primer día de actividad" }
                  : {
                      label: "Último día",
                      value: `${inc.growthHa >= 0 ? "+" : ""}${fmtArea(inc.growthHa, units)}`,
                      tone: inc.growthHa > 0 ? ("fire" as const) : undefined,
                    },
                { label: "Focos", value: inc.count.toLocaleString("es-AR") },
                {
                  label: "Potencia radiativa",
                  value: `${inc.frp.toLocaleString("es-AR")} MW`,
                },
                { label: "Días activo", value: inc.perDay.length },
              ].map((k) => (
                <Card key={k.label}>
                  <Stat {...k} />
                </Card>
              ))}
            </div>

            <Card title="Superficie por día">
              {inc.perDay.length < 2 ? (
                <p className="py-10 text-center text-[12.5px] text-foreground/60">
                  Incendio de un solo día. La curva de crecimiento aparece desde el
                  segundo día de actividad.
                </p>
              ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={inc.perDay.map((d) => ({
                      label: dayLabel(days[d.day]),
                      ha: d.areaHa,
                    }))}
                    margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis
                      dataKey="label"
                      tick={AXIS}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis tick={AXIS} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(v) => [
                        `${Number(v).toLocaleString("es-AR")} ha`,
                        "Superficie",
                      ]}
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 6,
                        border: "1px solid var(--border)",
                        background: "var(--chart-tip)",
                        color: "var(--foreground)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="ha"
                      stroke="#c8321e"
                      strokeWidth={1.8}
                      fill="#c8321e"
                      fillOpacity={0.15}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              )}
            </Card>

            <Card title="Eventos clave">
              <ol className="space-y-2.5">
                {[...inc.events].reverse().map((e) => {
                  const Icon = EVENT_ICON[e.kind];
                  return (
                    <li
                      key={`${e.kind}-${e.day}`}
                      className="flex items-start gap-3"
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full",
                          e.kind === "ignition" &&
                            "bg-[#e8710a]/15 text-[#b9560a]",
                          e.kind === "explosive" &&
                            "bg-[#b83a3a]/15 text-[#b83a3a]",
                          e.kind === "jump" && "bg-[#c9a300]/20 text-[#8a6f00]",
                        )}
                      >
                        <Icon className="size-3.5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[13px] font-semibold">
                            {e.title}
                          </span>
                          <span className="num text-[11px] text-foreground/55">
                            {dayLabel(days[e.day])}
                          </span>
                        </div>
                        <p className="text-[12px] text-foreground/65">
                          {e.sub}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-3 border-t border-[var(--hairline)] pt-2 text-[11px] leading-snug text-foreground/55">
                Método: detecciones VIIRS (NASA FIRMS, píxel de 375 m) agrupadas
                a menos de 3 km. El perímetro es el contorno convexo acumulado,
                por lo que sobreestima incendios de forma irregular. No
                reemplaza el parte oficial.
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
