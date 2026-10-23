"use client";

import { useMemo, useState } from "react";
import { Flame, Plane, Truck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { centerOf, distKm } from "@/lib/admin/geo";
import {
  etaFromBase,
  type UnitKind,
  type UnitState,
} from "@/lib/admin/resources";
import type { MsgKey } from "@/lib/admin/i18n";
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
const GROUPS: { title: MsgKey; kinds: UnitKind[] }[] = [
  { title: "res.g.air", kinds: ["avion", "helicoptero"] },
  { title: "res.g.engines", kinds: ["autobomba", "cisterna"] },
  { title: "res.g.crews", kinds: ["brigada"] },
];

interface Target {
  key: string;
  label: string;
  pos: [number, number];
}

export function ResourcesPanel({ ctx }: { ctx: Ctx }) {
  const { ws, units, clusters, t } = ctx;
  const [targetKey, setTargetKey] = useState("map");
  const sel = ws.features.find((f) => f.id === ctx.selectedId);

  const targets = useMemo<Target[]>(() => {
    const out: Target[] = [];
    for (const f of ws.features) {
      if ((ctx.zoneHits[f.id]?.recent ?? 0) > 0)
        out.push({
          key: `z-${f.id}`,
          label: t("res.tAlert", { name: ws.meta[f.id]?.name ?? t("res.zone") }),
          pos: centerOf(f),
        });
    }
    if (sel)
      out.push({
        key: "sel",
        label: t("res.tSel", { name: ws.meta[sel.id]?.name ?? t("res.element") }),
        pos: centerOf(sel),
      });
    clusters
      .slice(0, 4)
      .forEach((c, i) =>
        out.push({
          key: `c-${i}`,
          label: t("res.tFire", { i: i + 1, km: c.km, near: c.near }),
          pos: [c.lng, c.lat],
        }),
      );
    out.push({ key: "map", label: t("res.tMap"), pos: ctx.center });
    return out;
  }, [ws.features, ws.meta, ctx.zoneHits, sel, clusters, ctx.center, t]);
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
        title={t("res.title")}
        right={<Badge tone="sim">{t("res.sim")}</Badge>}
      >
        <div className="grid grid-cols-3 gap-3">
          <Stat
            label={t("res.active")}
            value={`${active.length}/${units.length}`}
            tone={active.length ? "ok" : undefined}
          />
          <Stat label={t("res.staff")} value={people} />
          <Stat
            label={t("res.water")}
            value={water >= 1000 ? `${(water / 1000).toFixed(1)}k` : water}
            sub={t("res.waterSub")}
          />
        </div>
      </Card>

      <Card bare title={t("res.target")}>
        <label htmlFor="objetivo" className="sr-only">
          {t("res.targetAria")}
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
        <div className="mt-2.5 grid grid-cols-[3fr_2fr] gap-2">
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
            <Flame className="size-3.5" /> {t("res.send3")}
          </Btn>
          <Btn
            disabled={active.length === 0}
            onClick={() => active.forEach((u) => ctx.recallUnit(u.spec.id))}
          >
            {t("res.recallAll")}
          </Btn>
        </div>
        <p className="mt-2 text-[10.5px] leading-snug text-foreground/45">
          {t("res.disclaimer")}
        </p>
      </Card>

      {GROUPS.map((g) => {
        const rows = units.filter((u) => g.kinds.includes(u.spec.kind));
        return (
          <Card bare key={g.title} title={t(g.title)}>
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
                      aria-label={t("res.viewMap", { name: u.spec.name })}
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
                          {t(`res.kind.${u.spec.kind}` as MsgKey)} ·{" "}
                          {t("res.crew", { n: u.spec.crew })}
                          {u.status === "disponible"
                            ? ` · ${t("res.eta", { n: eta })}`
                            : u.target
                              ? ` · ${u.target.label.split("·").pop()?.trim()}`
                              : ""}
                          {u.status === "en ruta" && u.etaMin
                            ? ` · ${t("res.arrives", { n: u.etaMin })}`
                            : ""}
                          {u.status === "en operación" ? ` · ${t("res.away", { n: away })}` : ""}
                        </span>
                      </span>
                    </button>
                    {/* minimal: an available unit needs no badge, the Enviar button says it */}
                    {u.status !== "disponible" && (
                      <span
                        className={cn(
                          "shrink-0 rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide",
                          STATUS_TONE[u.status],
                        )}
                      >
                        {t(`res.status.${u.status}` as MsgKey)}
                      </span>
                    )}
                    {u.status === "disponible" ? (
                      <Btn
                        className="h-7 min-h-7 px-2 text-[11px]"
                        onClick={() =>
                          ctx.dispatchUnit(u.spec.id, target.pos, target.label)
                        }
                      >
                        {t("res.send")}
                      </Btn>
                    ) : (
                      <Btn
                        className="h-7 min-h-7 px-2 text-[11px]"
                        onClick={() => ctx.recallUnit(u.spec.id)}
                        disabled={u.status === "regresando"}
                      >
                        {t("res.recall")}
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
            title={t("res.emptyTitle")}
          >
            {t("res.emptyBody")}
          </EmptyState>
        </div>
      )}
    </div>
  );
}
