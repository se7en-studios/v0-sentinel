"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
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

/** Editable numbers of a rule; the ones a kind does not use keep their defaults. */
interface Values {
  zoneId: string;
  min: number;
  score: number;
  days: number;
  focos: number;
}
const DEFAULTS: Values = { zoneId: "", min: 1, score: 55, days: 3, focos: 100 };

const valuesOf = (r: AlertRule): Values => ({
  ...DEFAULTS,
  ...(r.kind === "zone_fire"
    ? { zoneId: r.zoneId, min: r.min }
    : r.kind === "risk"
      ? { score: r.score, days: r.days }
      : { focos: r.focos }),
});

const inRange = (n: number, lo: number, hi: number) =>
  Number.isFinite(n) && n >= lo && n <= hi;

/** One validation for creating and editing. Returns the message to show, or null when valid. */
function problem(kind: Kind, v: Values): string | null {
  if (kind === "zone_fire")
    return inRange(v.min, 1, 99) ? null : "Mínimo de focos entre 1 y 99.";
  if (kind === "risk")
    return inRange(v.score, 10, 100) && inRange(v.days, 1, 7)
      ? null
      : "Índice entre 10 y 100, y días entre 1 y 7.";
  return inRange(v.focos, 1, 99_999)
    ? null
    : "Focos en 24 h: un número mayor a 0.";
}

const withValues = (
  base: { id: string; enabled: boolean },
  kind: Kind,
  v: Values,
): AlertRule =>
  kind === "zone_fire"
    ? { ...base, kind, zoneId: v.zoneId, min: v.min }
    : kind === "risk"
      ? { ...base, kind, score: v.score, days: v.days }
      : { ...base, kind, focos: v.focos };

const rejected = (msg: string) =>
  toast.error("Revisá los valores de la regla", { description: msg });

function ValueFields({
  kind,
  v,
  onChange,
  zones,
  zoneName,
}: {
  kind: Kind;
  v: Values;
  onChange: (p: Partial<Values>) => void;
  zones: Ctx["ws"]["features"];
  zoneName: (id: string) => string;
}) {
  const num =
    (k: "min" | "score" | "days" | "focos") =>
    (e: { target: { value: string } }) =>
      onChange({ [k]: Number(e.target.value) });
  if (kind === "zone_fire")
    return (
      <div className="grid grid-cols-[1fr_84px] gap-2">
        <Field label="Zona">
          <select
            className={inputCls}
            value={v.zoneId}
            onChange={(e) => onChange({ zoneId: e.target.value })}
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
            value={v.min}
            onChange={num("min")}
          />
        </Field>
      </div>
    );
  if (kind === "risk")
    return (
      <div className="grid grid-cols-2 gap-2">
        <Field label="Índice ≥ (10–100)">
          <input
            className={inputCls}
            type="number"
            min={10}
            max={100}
            value={v.score}
            onChange={num("score")}
          />
        </Field>
        <Field label="En los próximos (días)">
          <input
            className={inputCls}
            type="number"
            min={1}
            max={7}
            value={v.days}
            onChange={num("days")}
          />
        </Field>
      </div>
    );
  return (
    <Field label="Focos en 24 h ≥">
      <input
        className={inputCls}
        type="number"
        min={1}
        value={v.focos}
        onChange={num("focos")}
      />
    </Field>
  );
}

/** User-defined alert rules: evaluated live in use-admin, which raises the toast. */
export function RulesCard({ ctx }: { ctx: Ctx }) {
  const { ws, ruleFirings, setSettings } = ctx;
  const rules = ws.settings.rules;
  const zones = ws.features.filter(
    (f) => MODE_ROLE[String(f.properties.mode)] === "zone",
  );
  const zoneName = (id: string) => ws.meta[id]?.name ?? "Zona";

  const [kind, setKind] = useState<Kind>("zone_fire");
  const [draft, setDraft] = useState<Values>(DEFAULTS);
  // the rule open for editing and its pending values; null when none is
  const [editing, setEditing] = useState<{ id: string; v: Values } | null>(
    null,
  );

  const add = () => {
    const msg = problem(kind, draft);
    if (msg) return rejected(msg);
    const id = (
      globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
    ).slice(0, 8);
    setSettings({
      rules: [...rules, withValues({ id, enabled: true }, kind, draft)],
    });
  };
  const patch = (id: string, p: Partial<AlertRule>) =>
    setSettings({
      rules: rules.map((r) =>
        r.id === id ? ({ ...r, ...p } as AlertRule) : r,
      ),
    });
  const saveEdit = (r: AlertRule) => {
    if (!editing) return;
    const msg = problem(r.kind, editing.v);
    if (msg) return rejected(msg);
    setSettings({
      rules: rules.map((x) =>
        x.id === r.id ? withValues(x, r.kind, editing.v) : x,
      ),
    });
    setEditing(null);
  };

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
          const isEditing = editing?.id === r.id;
          return (
            <li
              key={r.id}
              className={
                detail
                  ? "rounded-lg border border-[var(--state-bad-ink)]/25 bg-[var(--state-bad-ink)]/[0.06] p-2.5"
                  : "rounded-lg border border-[var(--hairline)] p-2.5"
              }
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-medium leading-snug">
                    {describeRule(r, zoneName)}
                  </div>
                  {detail && (
                    <div className="mt-0.5 text-[11.5px] text-[var(--state-bad-ink)]">
                      {detail}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Editar regla"
                  aria-pressed={isEditing}
                  onClick={() =>
                    setEditing(isEditing ? null : { id: r.id, v: valuesOf(r) })
                  }
                  className="grid size-8 shrink-0 place-items-center rounded-md text-foreground/45 hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-primary/10 aria-pressed:text-primary"
                >
                  <Pencil className="size-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Eliminar regla"
                  onClick={() => {
                    if (isEditing) setEditing(null);
                    setSettings({ rules: rules.filter((x) => x.id !== r.id) });
                  }}
                  className="grid size-8 shrink-0 place-items-center rounded-md text-foreground/45 hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </div>
              {isEditing && editing && (
                <div className="mt-2 space-y-2 rounded-lg bg-foreground/[0.04] p-2.5">
                  <ValueFields
                    kind={r.kind}
                    v={editing.v}
                    onChange={(p) =>
                      setEditing({ id: r.id, v: { ...editing.v, ...p } })
                    }
                    zones={zones}
                    zoneName={zoneName}
                  />
                  <div className="flex gap-2">
                    <Btn
                      variant="solid"
                      className="flex-1"
                      onClick={() => saveEdit(r)}
                    >
                      Guardar cambios
                    </Btn>
                    <Btn onClick={() => setEditing(null)}>Cancelar</Btn>
                  </div>
                </div>
              )}
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
          <ValueFields
            kind={kind}
            v={draft}
            onChange={(p) => setDraft({ ...draft, ...p })}
            zones={zones}
            zoneName={zoneName}
          />
          <Btn variant="solid" className="w-full" onClick={add}>
            <Plus className="size-3.5" aria-hidden /> Agregar regla
          </Btn>
        </div>
      )}
    </Card>
  );
}
