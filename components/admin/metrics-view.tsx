"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { areaHa, fmtArea, fmtKm, lengthKm } from "@/lib/admin/geo";
import { BURNED_HISTORY } from "@/lib/admin/history";
import { MODE_ROLE } from "@/lib/admin/types";
import type { Ctx } from "./ctx";
import { Badge, Card, Stat } from "./ui";

const AXIS = { fontSize: 11, fill: "var(--chart-axis)" };
const TIP = {
  fontSize: 12,
  borderRadius: 6,
  border: "1px solid var(--border)",
  background: "var(--chart-tip)", color: "var(--foreground)",
};
const CONF_COLORS = ["#c9a300", "#e8710a", "#b83a3a"];

export function MetricsView({ ctx }: { ctx: Ctx }) {
  const { stats, ws, zoneHits, drones, sensors } = ctx;
  const u = ws.settings.units;
  const zones = ws.features.filter(
    (f) => MODE_ROLE[String(f.properties.mode)] === "zone",
  );
  const routes = ws.features.filter(
    (f) => MODE_ROLE[String(f.properties.mode)] === "route",
  );
  const active = drones.filter((d) => d.route).length;
  const hist = BURNED_HISTORY.map((h) => ({ ...h, label: String(h.year) }));
  const nightPct = stats.total
    ? Math.round((stats.night / stats.total) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Métricas</h1>
        <p className="text-[13px] text-foreground/55">
          Datos satelitales reales de los últimos 10 días en Argentina y estado
          de tu operación.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {
            label: "Focos 10 días",
            value: stats.total.toLocaleString("es-AR"),
            sub: `${stats.last24.toLocaleString("es-AR")} en 24 h`,
            tone: "fire" as const,
          },
          {
            label: "Superficie estimada",
            value: fmtArea(stats.hectares, u),
            sub: "cota superior (≈14 ha por foco)",
          },
          {
            label: "Potencia radiativa",
            value: `${stats.frp.toLocaleString("es-AR")} MW`,
            sub: `${nightPct}% de noche`,
          },
          {
            label: "Zonas vigiladas",
            value: zones.length,
            sub: fmtArea(
              zones.reduce((a, z) => a + areaHa(z), 0),
              u,
            ),
            tone: "ok" as const,
          },
        ].map((k) => (
          <Card key={k.label}>
            <Stat {...k} />
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          title="Focos por día"
          className="lg:col-span-2"
          right={<Badge tone="ok">NASA FIRMS</Badge>}
        >
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.perDay}
                margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
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
                  contentStyle={TIP}
                  formatter={(v, n) => [v, n === "count" ? "focos" : "MW"]}
                />
                <Bar dataKey="count" fill="#e8710a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Confianza de detección">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.byConf}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={78}
                  paddingAngle={2}
                >
                  {stats.byConf.map((c, i) => (
                    <Cell key={c.name} fill={CONF_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TIP} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Superficie quemada en Argentina (ha por año)"
          right={<Badge>Fuentes públicas</Badge>}
        >
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={hist}
                margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tick={AXIS}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={AXIS}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v / 1000}k`}
                />
                <Tooltip
                  contentStyle={TIP}
                  formatter={(v) => [
                    `${Number(v).toLocaleString("es-AR")} ha`,
                    "Quemadas",
                  ]}
                />
                <Bar dataKey="ha" fill="#b83a3a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-0.5 text-[11px] text-foreground/50">
            {BURNED_HISTORY.map((h) => (
              <li key={h.year}>
                {h.year}:{" "}
                <a
                  className="underline underline-offset-2 hover:text-primary"
                  href={h.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {h.source}
                </a>
              </li>
            ))}
            <li>
              Solo se muestran los años con cifra rastreable; validar contra el
              SNMF antes de usar en un informe.
            </li>
          </ul>
        </Card>

        <Card
          title="Tus zonas"
          right={<Badge tone="muted">{zones.length}</Badge>}
        >
          {zones.length === 0 ? (
            <p className="text-[12.5px] text-foreground/50">
              Sin zonas todavía. Dibujalas en la pestaña Zonas.
            </p>
          ) : (
            <table className="w-full text-left text-[12.5px]">
              <thead className="text-[10.5px] uppercase tracking-wider text-foreground/45">
                <tr>
                  <th className="pb-1.5 font-medium">Zona</th>
                  <th className="pb-1.5 text-right font-medium">Superficie</th>
                  <th className="pb-1.5 text-right font-medium">Riesgo</th>
                  <th className="pb-1.5 text-right font-medium">Focos 48 h</th>
                  <th className="pb-1.5 text-right font-medium">10 días</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => (
                  <tr key={z.id} className="border-t border-border">
                    <td className="py-1.5 pr-2">{ws.meta[z.id]?.name}</td>
                    <td className="py-1.5 text-right tabular-nums">
                      {fmtArea(areaHa(z), u)}
                    </td>
                    <td className="py-1.5 text-right text-[12px]" style={{ color: ctx.zoneRisk[z.id]?.color }}>
                      {ctx.zoneRisk[z.id] ? `${ctx.zoneRisk[z.id].label} (${ctx.zoneRisk[z.id].score})` : "…"}
                    </td>
                    <td
                      className={`py-1.5 text-right tabular-nums ${zoneHits[z.id]?.recent ? "font-semibold text-[#b83a3a]" : ""}`}
                    >
                      {zoneHits[z.id]?.recent ?? 0}
                    </td>
                    <td className="py-1.5 text-right tabular-nums">
                      {zoneHits[z.id]?.total ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <Card title="Operación" right={<Badge tone="sim">demo simulado</Badge>}>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <Stat label="Drones en ruta" value={`${active}/${drones.length}`} />
          <Stat
            label="Rutas definidas"
            value={routes.length}
            sub={fmtKm(routes.reduce((a, r) => a + lengthKm(r), 0))}
          />
          <Stat label="Sensores" value={sensors.length} />
          <Stat
            label="Sensores en alerta"
            value={sensors.filter((s) => s.reading.alert).length}
            tone={sensors.some((s) => s.reading.alert) ? "fire" : undefined}
          />
          <Stat
            label="Zonas en alerta"
            value={Object.values(zoneHits).filter((h) => h.recent > 0).length}
            tone="fire"
          />
        </div>
      </Card>
      <Card title="Impacto y exposición" right={<Badge>según tus supuestos</Badge>}>
        {ws.settings.valuePerHa > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Superficie vigilada" value={fmtArea(ctx.protectedHa, u)} />
            <Stat label="Valor bajo vigilancia" value={`USD ${Math.round(ctx.protectedHa * ws.settings.valuePerHa).toLocaleString("es-AR")}`} tone="ok" />
            <Stat label="Zonas con focos (48 h)" value={fmtArea(ctx.atRiskHa, u)} tone={ctx.atRiskHa ? "fire" : undefined} />
            <Stat label="Valor expuesto ahora" value={`USD ${Math.round(ctx.atRiskHa * ws.settings.valuePerHa).toLocaleString("es-AR")}`} tone={ctx.atRiskHa ? "fire" : undefined} />
          </div>
        ) : (
          <p className="text-[12.5px] text-foreground/55">Cargá un valor por hectárea (USD) en Configuración para estimar el valor bajo vigilancia y el expuesto a focos.</p>
        )}
      </Card>
    </div>
  );
}
