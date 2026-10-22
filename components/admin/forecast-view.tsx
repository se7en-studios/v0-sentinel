"use client";

import { useEffect, useMemo, useState } from "react";
import { CloudOff } from "lucide-react";
import { centerOf } from "@/lib/admin/geo";
import { fetchForecast, type DayForecast } from "@/lib/admin/forecast";
import { compass } from "@/lib/admin/weather";
import { MODE_ROLE } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import type { Ctx } from "./ctx";
import { BriefingCard } from "./briefing-card";
import {
  Badge,
  Btn,
  Card,
  EmptyState,
  ErrorState,
  KV,
  Skeleton,
  Stat,
  ViewSkeleton,
} from "./ui";

const MAX_ZONES = 8;
/** FWI from which the day is flagged as dangerous (Muy alto) */
const FWI_HIGH = 20;
const REGION_ROW = "__region";

interface Row {
  id: string;
  name: string;
  days: DayForecast[] | null;
}

const weekday = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
  });

/** 7-day fire-danger outlook for the viewed region and each monitored zone (Open-Meteo). */
export function ForecastView({ ctx }: { ctx: Ctx }) {
  const { ws, center } = ctx;
  const zones = useMemo(
    () =>
      ws.features
        .filter((f) => MODE_ROLE[String(f.properties.mode)] === "zone")
        .slice(0, MAX_ZONES),
    [ws.features],
  );
  const [rows, setRows] = useState<Row[] | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [sel, setSel] = useState<{ row: string; day: number }>({
    row: REGION_ROW,
    day: 0,
  });

  useEffect(() => {
    let cancelled = false;
    const targets = [
      { id: REGION_ROW, name: "Región en vista", at: center },
      ...zones.map((z) => ({
        id: z.id,
        name: ws.meta[z.id]?.name ?? "Zona",
        at: centerOf(z),
      })),
    ];
    Promise.all(
      targets.map(async (t) => ({
        id: t.id,
        name: t.name,
        days: await fetchForecast(t.at[1], t.at[0]),
      })),
    ).then((r) => !cancelled && setRows(r));
    return () => {
      cancelled = true;
    };
  }, [zones, ws.meta, center, attempt]);

  const active = rows?.find((r) => r.id === sel.row) ?? rows?.[0];
  const day = active?.days?.[sel.day];
  const regionDays = rows?.[0]?.days;
  const region = regionDays?.length ? regionDays : null;
  const worst = region?.reduce((a, d) => (d.score > a.score ? d : a));
  const best = region?.reduce((a, d) => (d.score < a.score ? d : a));

  // the briefing and the zone counts need the detection feed: never leave this blank
  if (!ctx.payload && ctx.firesError)
    return (
      <ErrorState
        message={ctx.firesError}
        onRetry={ctx.reload}
        loading={ctx.loading}
      />
    );
  if (!ctx.payload && ctx.loading) return <ViewSkeleton />;

  return (
    <div className="view-in mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
      {ctx.firesError && (
        <ErrorState
          compact
          message={`${ctx.firesError} Mostramos los últimos datos recibidos.`}
          onRetry={ctx.reload}
          loading={ctx.loading}
        />
      )}
      <div>
        <h1 className="font-heading text-2xl font-bold">
          Pronóstico de riesgo
        </h1>
        <p className="text-[13px] text-foreground/55">
          Índice de peligro de incendio a 7 días para la región y cada una de
          tus zonas, según temperatura máxima, humedad mínima, viento y lluvia
          acumulada.
        </p>
      </div>

      {rows && <BriefingCard ctx={ctx} forecast={region} />}

      {!rows ? (
        <Skeleton className="h-64 w-full" />
      ) : !region ? (
        <EmptyState icon={<CloudOff className="size-5" />} title="Sin pronóstico"
          action={
            <Btn
              onClick={() => {
                setRows(null);
                setAttempt((n) => n + 1);
              }}
            >
              Reintentar
            </Btn>
          }
        >
          No se pudo consultar Open-Meteo. Revisá tu conexión y volvé a
          intentar.
        </EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card>
              <Stat
                label="Hoy"
                value={region[0].label}
                sub={`índice ${region[0].score}/100${region[0].fwi === undefined ? "" : ` · FWI ${Math.round(region[0].fwi)} ${region[0].fwiLabel?.toLowerCase()}`}`}
                tone={region[0].score >= 55 ? "fire" : "ok"}
              />
            </Card>
            <Card>
              <Stat
                label="Peor día"
                value={worst ? weekday(worst.date) : "—"}
                sub={worst ? `${worst.label} · ${worst.score}` : undefined}
                tone={worst && worst.score >= 55 ? "fire" : undefined}
              />
            </Card>
            <Card>
              <Stat
                label="Mejor ventana"
                value={best ? weekday(best.date) : "—"}
                sub="para operar o quemas prescriptas"
                tone="ok"
              />
            </Card>
            <Card>
              <Stat
                label="Zonas en riesgo alto"
                value={
                  rows
                    .slice(1)
                    .filter((r) => r.days?.some((d) => d.score >= 55)).length
                }
                sub={`de ${rows.length - 1} vigiladas, próximos 7 días`}
              />
            </Card>
          </div>

          <Card title="Mapa de calor semanal">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-separate border-spacing-1 text-[12px]">
                <thead>
                  <tr>
                    <th className="w-40" />
                    {region.map((d) => (
                      <th
                        key={d.date}
                        scope="col"
                        className="pb-1 text-[10.5px] font-medium capitalize text-foreground/60"
                      >
                        {weekday(d.date)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <th
                        scope="row"
                        className="max-w-40 truncate pr-2 text-left text-[12px] font-medium"
                      >
                        {r.name}
                      </th>
                      {(r.days ?? region).map((d, i) => {
                        const on = sel.row === r.id && sel.day === i;
                        return (
                          <td key={d.date} className="p-0">
                            <button
                              type="button"
                              disabled={!r.days}
                              onClick={() => setSel({ row: r.id, day: i })}
                              aria-pressed={on}
                              aria-label={`${r.name}, ${weekday(d.date)}: ${r.days ? `${d.label}, índice ${d.score}` : "sin datos"}`}
                              className={cn(
                                "num h-11 w-full rounded-md text-[12px] font-semibold transition-[transform,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30",
                                on && "scale-[1.04] ring-2 ring-foreground/70",
                              )}
                              style={{
                                background: `${d.color}26`,
                                color: d.color,
                              }}
                            >
                              {r.days ? (
                                <>
                                  {d.score}
                                  <span className="block text-[9px] font-medium leading-none">
                                    {d.label}
                                  </span>
                                </>
                              ) : (
                                "—"
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length === 1 && (
              <p className="mt-2 text-[12px] text-foreground/60">
                Dibujá zonas de monitoreo en la pestaña Zonas para ver su riesgo
                día por día.
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-foreground/60">
              {[
                ["Bajo", "var(--state-ok)", "0-34"],
                ["Moderado", "var(--state-warn)", "35-54"],
                ["Alto", "var(--state-watch)", "55-74"],
                ["Extremo", "var(--state-bad)", "75-100"],
              ].map(([l, c, range]) => (
                <span key={l} className="flex items-center gap-1.5">
                  <span
                    className="size-2.5 rounded-sm"
                    style={{ background: c }}
                    aria-hidden
                  />
                  {l} <span className="num text-foreground/45">{range}</span>
                </span>
              ))}
              <span className="ml-auto">
                El índice 0-100 es un indicador propio. El FWI sigue el método
                canadiense con datos de Open-Meteo: aproximado, no oficial.
              </span>
            </div>
          </Card>

          {active && day && (
            <Card
              title={`${active.name} · ${weekday(day.date)}`}
              right={
                <Badge tone={day.score >= 55 ? "fire" : "ok"}>
                  {day.label}
                </Badge>
              }
            >
              <dl className="grid gap-x-8 sm:grid-cols-2">
                <div>
                  <KV k="Temperatura máxima">
                    <span className="num">{Math.round(day.tmax)} °C</span>
                  </KV>
                  <KV k="Humedad mínima">
                    <span className="num">{Math.round(day.rhmin)} %</span>
                  </KV>
                </div>
                <div>
                  <KV k="Viento máximo">
                    <span className="num">
                      {Math.round(day.wind)} km/h · {compass(day.windDir)}
                    </span>
                  </KV>
                  <KV k="Lluvia del día">
                    <span className="num">{day.rain.toFixed(1)} mm</span>
                  </KV>
                </div>
              </dl>
              {day.fwi !== undefined && (
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--hairline)] pt-2 text-[12.5px]">
                  <span className="text-foreground/65">
                    Índice canadiense (FWI)
                  </span>
                  <span className="num font-semibold">{day.fwi.toFixed(1)}</span>
                  <Badge tone={day.fwi >= FWI_HIGH ? "fire" : "ok"}>
                    {day.fwiLabel}
                  </Badge>
                  <span className="text-[11px] text-foreground/50">
                    Bajo &lt; 5 · Moderado &lt; 10 · Alto &lt; 20 · Muy alto &lt; 30 · Extremo
                  </span>
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
