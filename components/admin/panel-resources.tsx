"use client";

import { useMemo, useState } from "react";
import { Flame, Plane, Truck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { centerOf, distKm } from "@/lib/admin/geo";
import {
  KIND_LABEL,
  etaFromBase,
  type UnitKind,
  type UnitState,
} from "@/lib/admin/resources";
import type { Ctx } from "./ctx";
import { Badge, Btn, Card, EmptyState, Stat, inputCls } from "./ui";

const ICON: Record<UnitKind, typeof Plane> = {
  brigada: Users,
  autobomba: Truck,
  cisterna: Truck,
  avion: Plane,
  helicoptero: Plane,
};
const STATUS_TONE: Record<UnitState["status"], string> = {
  disponible: "bg-foreground/[0.07] text-foreground/55",
  "en ruta": "bg-[#e8710a]/14 text-[#b9560a]",
  "en operación": "bg-primary/14 text-primary",
  regresando: "bg-[#1b6fb8]/12 text-[#1b6fb8]",
};
const GROUPS: { title: string; kinds: UnitKind[] }[] = [
  { title: "Aéreos", kinds: ["avion", "helicoptero"] },
  { title: "Autobombas y cisternas", kinds: ["autobomba", "cisterna"] },
  { title: "Brigadas", kinds: ["brigada"] },
];

interface Target {
  key: string;
  label: string;
  pos: [number, number];
}

export function ResourcesPanel({ ctx }: { ctx: Ctx }) {
  const { ws, units, clusters } = ctx;
  const [targetKey, setTargetKey] = useState("map");
  const sel = ws.features.find((f) => f.id === ctx.selectedId);

  const targets = useMemo<Target[]>(() => {
    const out: Target[] = [];
    for (const f of ws.features) {
      if ((ctx.zoneHits[f.id]?.recent ?? 0) > 0)
        out.push({
          key: `z-${f.id}`,
          label: `Alerta · ${ws.meta[f.id]?.name ?? "Zona"}`,
          pos: centerOf(f),
        });
    }
    if (sel)
      out.push({
        key: "sel",
        label: `Seleccionado · ${ws.meta[sel.id]?.name ?? "elemento"}`,
        pos: centerOf(sel),
      });
    clusters
      .slice(0, 4)
      .forEach((c, i) =>
        out.push({
          key: `c-${i}`,
          label: `Foco ${i + 1} · ${c.km} km de ${c.near}`,
          pos: [c.lng, c.lat],
        }),
      );
    out.push({ key: "map", label: "Centro del mapa", pos: ctx.center });
    return out;
  }, [ws.features, ws.meta, ctx.zoneHits, sel, clusters, ctx.center]);
  const target =
    targets.find((t) => t.key === targetKey) ?? targets[targets.length - 1];

  const active = units.filter((u) => u.status !== "disponible");
  const people = active.reduce((a, u) => a + u.spec.crew, 0);
  const water = active
    .filter((u) => u.status === "en operación")
    .reduce((a, u) => a + u.spec.water, 0);

  const ranked = [...units]
    .filter((u) => u.status === "disponible")
    .sort(
      (a, b) =>
        etaFromBase(a.spec, ctx.center, target.pos) -
        etaFromBase(b.spec, ctx.center, target.pos),
    );

  return (
    <div>
      <Card
        bare
        title="Recursos de respuesta"
        right={<Badge tone="sim">simulado</Badge>}
      >
        <div className="grid grid-cols-3 gap-3">
          <Stat
            label="Activos"
            value={`${active.length}/${units.length}`}
            tone={active.length ? "ok" : undefined}
          />
          <Stat label="Personal" value={people} />
          <Stat
            label="Agua"
            value={water >= 1000 ? `${(water / 1000).toFixed(1)}k` : water}
            sub="litros en operación"
          />
        </div>
      </Card>

      <Card bare title="Objetivo">
        <label htmlFor="objetivo" className="sr-only">
          Objetivo del despacho
        </label>
        <select
          id="objetivo"
          className={inputCls}
          value={target.key}
          onChange={(e) => setTargetKey(e.target.value)}
        >
          {targets.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <Btn
            variant="fire"
            disabled={ranked.length === 0}
            onClick={() =>
              ranked
                .slice(0, 3)
                .forEach((u) =>
                  ctx.dispatchUnit(u.spec.id, target.pos, target.label),
                )
            }
          >
            <Flame className="size-3.5" /> Enviar las 3 más cercanas
          </Btn>
          <Btn
            disabled={active.length === 0}
            onClick={() => active.forEach((u) => ctx.recallUnit(u.spec.id))}
          >
            Retirar todas
          </Btn>
        </div>
        <p className="mt-2 text-[10.5px] leading-snug text-foreground/45">
          Sentinel no despacha medios reales. Esta vista simula cómo se vería la
          coordinación de respuesta sobre una alerta.
        </p>
      </Card>

      {GROUPS.map((g) => {
        const rows = units.filter((u) => g.kinds.includes(u.spec.kind));
        return (
          <Card bare key={g.title} title={g.title}>
            <ul className="-mx-1.5 space-y-px">
              {rows.map((u) => {
                const Icon = ICON[u.spec.kind];
                const eta = etaFromBase(u.spec, ctx.center, target.pos);
                const away = Math.round(distKm(u.pos, target.pos));
                return (
                  <li
                    key={u.spec.id}
                    className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-foreground/[0.04]"
                  >
                    <button
                      type="button"
                      onClick={() => ctx.map.current?.flyTo(u.pos, 11.5)}
                      className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                      aria-label={`Ver ${u.spec.name} en el mapa`}
                    >
                      <span
                        className={cn(
                          "grid size-7 shrink-0 place-items-center rounded-lg",
                          u.status === "disponible"
                            ? "bg-foreground/[0.06] text-foreground/55"
                            : "bg-[var(--fire-soft)] text-[var(--fire)]",
                        )}
                      >
                        <Icon className="size-3.5" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[12.5px] font-medium">
                          {u.spec.name}
                        </span>
                        <span className="num block truncate text-[10.5px] text-foreground/50">
                          {KIND_LABEL[u.spec.kind]} · {u.spec.crew} pers.
                          {u.status === "disponible"
                            ? ` · ETA ${eta} min`
                            : u.target
                              ? ` · ${u.target.label.split("·").pop()?.trim()}`
                              : ""}
                          {u.status === "en ruta" && u.etaMin
                            ? ` · llega en ${u.etaMin} min`
                            : ""}
                          {u.status === "en operación" ? ` · a ${away} km` : ""}
                        </span>
                      </span>
                    </button>
                    <span
                      className={cn(
                        "shrink-0 rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide",
                        STATUS_TONE[u.status],
                      )}
                    >
                      {u.status}
                    </span>
                    {u.status === "disponible" ? (
                      <Btn
                        className="h-7 min-h-7 px-2 text-[11px]"
                        onClick={() =>
                          ctx.dispatchUnit(u.spec.id, target.pos, target.label)
                        }
                      >
                        Enviar
                      </Btn>
                    ) : (
                      <Btn
                        className="h-7 min-h-7 px-2 text-[11px]"
                        onClick={() => ctx.recallUnit(u.spec.id)}
                        disabled={u.status === "regresando"}
                      >
                        Retirar
                      </Btn>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}

      {active.length === 0 && (
        <div className="px-4 pb-4">
          <EmptyState
            icon={<Truck className="size-4" />}
            title="Sin medios desplegados"
          >
            Elegí un objetivo y enviá las unidades más cercanas para ver ETA,
            posición y registro.
          </EmptyState>
        </div>
      )}
    </div>
  );
}
