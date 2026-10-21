"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Flame } from "lucide-react";
import { distKm } from "@/lib/admin/geo";
import { FLEET, droneTelemetry, hash } from "@/lib/admin/sim";
import { opsSeries } from "@/lib/admin/resources";
import type { Ctx } from "./ctx";
import { Badge } from "./ui";

const AXIS = { fontSize: 9.5, fill: "var(--chart-axis)" };
const TIP = {
  fontSize: 11,
  borderRadius: 8,
  border: "1px solid var(--hairline)",
  background: "var(--chart-tip)",
  color: "var(--foreground)",
  boxShadow: "var(--shadow-2)",
};

interface Pt {
  t: number;
  v: number;
}

function Mini({
  title,
  unit,
  color,
  data,
  domain,
  step,
  hm,
}: {
  title: string;
  unit: string;
  color: string;
  data: Pt[];
  domain?: [number, number];
  step?: boolean;
  hm?: boolean;
}) {
  const id = `m-${title.replace(/\W/g, "")}`;
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col px-3 pb-1.5 pt-2">
      <div className="mb-0.5 flex items-baseline justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.09em] text-foreground/50">
          {title}
        </h3>
        <span className="num text-[10.5px] font-medium text-foreground/70">
          {data.length
            ? Math.round(data[data.length - 1].v).toLocaleString("es-AR")
            : "—"}{" "}
          <span className="text-foreground/40">{unit}</span>
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 6, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="t"
              type="number"
              domain={["dataMin", "dataMax"]}
              scale="time"
              tick={AXIS}
              tickLine={false}
              axisLine={false}
              tickCount={4}
              minTickGap={36}
              tickFormatter={(t) =>
                new Date(t).toLocaleTimeString("es-AR", hm ? { hour: "2-digit", minute: "2-digit" } : { minute: "2-digit", second: "2-digit" })
              }
            />
            <YAxis
              tick={AXIS}
              tickLine={false}
              axisLine={false}
              width={34}
              tickCount={3}
              domain={domain ?? ["auto", "auto"]}
            />
            <Tooltip
              contentStyle={TIP}
              labelFormatter={(t) =>
                new Date(Number(t)).toLocaleTimeString("es-AR")
              }
              formatter={(v) => [`${Math.round(Number(v))} ${unit}`, title]}
            />
            <Area
              type={step ? "stepAfter" : "monotone"}
              dataKey="v"
              stroke={color}
              strokeWidth={1.6}
              fill={`url(#${id})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Drone mode dock: telemetry charts for the active drone plus nearby detections. */
export function DroneDock({ ctx }: { ctx: Ctx }) {
  const d =
    ctx.drones.find((x) => x.spec.id === ctx.activeDrone) ??
    ctx.drones.find((x) => x.track) ??
    ctx.drones[0];
  const second = Math.floor(ctx.now / 1000) * 1000;
  const pos = d.track?.pos;

  const detections = useMemo(() => {
    if (!pos) return [];
    return ctx.fires
      .map((p) => ({ p, km: distKm(pos, [p[1], p[0]]) }))
      .filter((x) => x.km < 6)
      .sort((a, b) => a.km - b.km)
      .slice(0, 5)
      .map(({ p, km }) => ({
        id: `${p[0]}${p[1]}${p[5]}`,
        temp: Math.min(1100, Math.round(300 + p[2] * 14)),
        km,
        conf: p[3],
      }));
  }, [pos, ctx.fires]);
  const heat = detections.length ? Math.min(1, 1.4 - detections[0].km / 5) : 0;

  const series = useMemo(() => {
    const alt: Pt[] = [];
    const temp: Pt[] = [];
    const bat: Pt[] = [];
    for (let i = 59; i >= 0; i--) {
      const t = second - i * 1000;
      const tl = droneTelemetry(d.spec, t);
      alt.push({ t, v: tl.altitude });
      bat.push({ t, v: tl.battery });
      const base = 24 + 5 * Math.sin(t / 7000 + hash(d.spec.id) * 6);
      temp.push({
        t,
        v: Math.round(
          base +
            (i < 22 ? heat * (detections[0]?.temp ?? 0) * (1 - i / 22) : 0),
        ),
      });
    }
    return { alt, temp, bat };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [second, d.spec, heat, detections.length]);

  return (
    <section
      aria-label="Telemetría del dron"
      className="shrink-0 border-t border-[var(--hairline)] bg-card"
    >
      <div className="flex items-center gap-2 border-b border-[var(--hairline)] px-3 py-1.5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground/50">
          Telemetría · {d.spec.name}
        </h2>
        <Badge tone="sim">simulado</Badge>
        <div className="ml-auto flex gap-1">
          {FLEET.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={f.id === d.spec.id}
              onClick={() => ctx.setActiveDrone(f.id)}
              className={`rounded-md px-2 py-0.5 text-[10.5px] font-medium transition-colors ${f.id === d.spec.id ? "bg-foreground text-background" : "text-foreground/55 hover:bg-foreground/[0.06]"}`}
            >
              {f.name.replace("SNT-", "")}
            </button>
          ))}
        </div>
      </div>
      <div className="grid h-[150px] grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_270px]">
        <Mini title="Altura (AGL)" unit="m" color="#0f7a4f" data={series.alt} />
        <div className="hidden h-full min-h-0 border-l border-[var(--hairline)] sm:block">
          <Mini
            title="Temp. máx. en vista"
            unit="°C"
            color="#c8321e"
            data={series.temp}
          />
        </div>
        <div className="hidden h-full min-h-0 border-l border-[var(--hairline)] sm:block">
          <Mini
            title="Batería"
            unit="%"
            color="#1b6fb8"
            data={series.bat}
            domain={[0, 100]}
          />
        </div>
        <div className="hidden h-full min-h-0 overflow-y-auto border-l border-[var(--hairline)] px-3 pb-2 pt-2 sm:block">
          <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.09em] text-foreground/50">
            Detecciones cerca
          </h3>
          {detections.length === 0 && (
            <p className="text-[11px] text-foreground/40">
              {d.track
                ? "Sin focos a menos de 6 km de la ruta."
                : "El dron no está en vuelo."}
            </p>
          )}
          <ul className="space-y-0.5">
            {detections.map((x) => (
              <li key={x.id} className="flex items-center gap-2 text-[11px]">
                <Flame className="size-3 shrink-0 text-[#c8321e]" aria-hidden />
                <span className="num font-medium">
                  Punto caliente {x.temp} °C
                </span>
                <span className="num ml-auto text-foreground/45">
                  {x.km.toFixed(1)} km
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** Resources dock: simulated operation charts and the dispatch log. */
export function ResourcesDock({ ctx }: { ctx: Ctx }) {
  const minute = Math.floor(ctx.now / 60_000) * 60_000;
  const s = useMemo(() => opsSeries(ctx.units, minute), [ctx.units, minute]);
  const people: Pt[] = s.map((x) => ({ t: x.t, v: x.people }));
  const water: Pt[] = s.map((x) => ({ t: x.t, v: x.water }));
  const line: Pt[] = s.map((x) => ({ t: x.t, v: x.lineKm }));
  return (
    <section
      aria-label="Operaciones de respuesta"
      className="shrink-0 border-t border-[var(--hairline)] bg-card"
    >
      <div className="flex items-center gap-2 border-b border-[var(--hairline)] px-3 py-1.5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground/50">
          Operaciones · última hora
        </h2>
        <Badge tone="sim">simulado</Badge>
      </div>
      <div className="grid h-[150px] grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_270px]">
        <Mini
          title="Personal desplegado" hm
          unit="pers."
          color="#0f7a4f"
          data={people}
          step
        />
        <div className="hidden h-full min-h-0 border-l border-[var(--hairline)] sm:block">
          <Mini
            title="Agua descargada" hm
            unit="L"
            color="#1b6fb8"
            data={water}
            step
          />
        </div>
        <div className="hidden h-full min-h-0 border-l border-[var(--hairline)] sm:block">
          <Mini
            title="Línea de control" hm
            unit="km"
            color="#e8710a"
            data={line}
          />
        </div>
        <div className="hidden min-h-0 flex-col border-l border-[var(--hairline)] px-3 pb-2 pt-2 sm:flex">
          <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.09em] text-foreground/50">
            Registro de operaciones
          </h3>
          {ctx.opsLog.length === 0 && (
            <p className="text-[11px] text-foreground/40">
              Sin operaciones. Despachá unidades desde el panel.
            </p>
          )}
          <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
            {ctx.opsLog.map((e) => (
              <li key={e.id} className="text-[10.5px] leading-snug">
                <span className="num mr-1.5 text-foreground/40">
                  {new Date(e.t).toLocaleTimeString("es-AR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {e.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
