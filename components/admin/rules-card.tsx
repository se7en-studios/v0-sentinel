"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { MAX_RULES, describeRule } from "@/lib/admin/rules";
import { MODE_ROLE, type AlertRule } from "@/lib/admin/types";
import type { Ctx } from "./ctx";
import { Badge, Btn, Card, Field, Toggle, inputCls } from "./ui";

type Kind = AlertRule["kind"];
const KINDS: { value: Kind; label: string }[] = [
  { value: "zone_fire", label: "Foco en una zona" },
  { value: "risk", label: "Riesgo meteorológico" },
  { value: "activity", label: "Actividad en Argentina" },
];

/** User-defined alert rules: evaluated live in use-admin, which raises the toast. */
export function RulesCard({ ctx }: { ctx: Ctx }) {
  const { ws, ruleFirings, setSettings } = ctx;
  const rules = ws.settings.rules;
  const zones = ws.features.filter(
    (f) => MODE_ROLE[String(f.properties.mode)] === "zone",
  );
  const zoneName = (id: string) => ws.meta[id]?.name ?? "Zona";

  const [kind, setKind] = useState<Kind>("zone_fire");
  const [zoneId, setZoneId] = useState("");
  const [min, setMin] = useState(1);
  const [score, setScore] = useState(55);
  const [days, setDays] = useState(3);
  const [focos, setFocos] = useState(100);

  const add = () => {
    const base = { id: crypto.randomUUID().slice(0, 8), enabled: true };
    const rule: AlertRule =
      kind === "zone_fire"
        ? { ...base, kind, zoneId, min }
        : kind === "risk"
          ? { ...base, kind, score, days }
          : { ...base, kind, focos };
    setSettings({ rules: [...rules, rule] });
  };
  const patch = (id: string, p: Partial<AlertRule>) =>
    setSettings({
      rules: rules.map((r) =>
        r.id === id ? ({ ...r, ...p } as AlertRule) : r,
      ),
    });
  const num =
    (set: (n: number) => void) => (e: { target: { value: string } }) =>
      set(Number(e.target.value));

  return (
    <Card
      bare
      title="Reglas de alerta"
      right={
        ruleFirings.size > 0 ? (
          <Badge tone="fire">{ruleFirings.size} activas</Badge>
        ) : undefined
      }
    >
      {rules.length === 0 && (
        <p className="mb-3 text-[12px] leading-snug text-foreground/60">
          Definí cuándo querés que el panel te avise: un foco en una zona,
          riesgo alto en los próximos días o un pico de actividad.
        </p>
      )}
      <ul className="space-y-2">
        {rules.map((r) => {
          const detail = ruleFirings.get(r.id);
          return (
            <li
              key={r.id}
              className={
                detail
                  ? "rounded-lg border border-[#b83a3a]/25 bg-[#b83a3a]/[0.06] p-2.5"
                  : "rounded-lg border border-[var(--hairline)] p-2.5"
              }
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-medium leading-snug">
                    {describeRule(r, zoneName)}
                  </div>
                  {detail && (
                    <div className="mt-0.5 text-[11.5px] text-[#b83a3a]">
                      {detail}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Eliminar regla"
                  onClick={() =>
                    setSettings({ rules: rules.filter((x) => x.id !== r.id) })
                  }
                  className="grid size-8 shrink-0 place-items-center rounded-md text-foreground/45 hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </div>
              <Toggle
                checked={r.enabled}
                onChange={(v) => patch(r.id, { enabled: v })}
                label={r.enabled ? "Activa" : "Pausada"}
              />
            </li>
          );
        })}
      </ul>

      {rules.length < MAX_RULES && (
        <div className="mt-3 space-y-2 rounded-lg bg-foreground/[0.04] p-2.5">
          <Field label="Nueva regla">
            <select
              className={inputCls}
              value={kind}
              onChange={(e) => setKind(e.target.value as Kind)}
            >
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </Field>
          {kind === "zone_fire" && (
            <div className="grid grid-cols-[1fr_84px] gap-2">
              <Field label="Zona">
                <select
                  className={inputCls}
                  value={zoneId}
                  onChange={(e) => setZoneId(e.target.value)}
                >
                  <option value="">Cualquiera</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {zoneName(z.id)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Mín. focos">
                <input
                  className={inputCls}
                  type="number"
                  min={1}
                  max={99}
                  value={min}
                  onChange={num(setMin)}
                />
              </Field>
            </div>
          )}
          {kind === "risk" && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Índice ≥ (10–100)">
                <input
                  className={inputCls}
                  type="number"
                  min={10}
                  max={100}
                  value={score}
                  onChange={num(setScore)}
                />
              </Field>
              <Field label="En los próximos (días)">
                <input
                  className={inputCls}
                  type="number"
                  min={1}
                  max={7}
                  value={days}
                  onChange={num(setDays)}
                />
              </Field>
            </div>
          )}
          {kind === "activity" && (
            <Field label="Focos en 24 h ≥">
              <input
                className={inputCls}
                type="number"
                min={1}
                value={focos}
                onChange={num(setFocos)}
              />
            </Field>
          )}
          <Btn variant="solid" className="w-full" onClick={add}>
            <Plus className="size-3.5" aria-hidden /> Agregar regla
          </Btn>
        </div>
      )}
    </Card>
  );
}
