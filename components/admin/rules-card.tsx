"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FWI_VERY_HIGH, MAX_RULES, describeRule } from "@/lib/admin/rules";
import { isAcked, ruleKey } from "@/lib/admin/alert-ack";
import { MODE_ROLE, type AlertRule } from "@/lib/admin/types";
import type { MsgKey, Translate } from "@/lib/admin/i18n";
import type { Ctx } from "./ctx";
import { Badge, Btn, Card, Field, Toggle, inputCls } from "./ui";

type Kind = AlertRule["kind"];
const KINDS: Kind[] = ["zone_fire", "risk", "activity", "early_open", "fwi", "growth"];

/** Editable numbers of a rule; the ones a kind does not use keep their defaults. */
interface Values {
  zoneId: string;
  min: number;
  score: number;
  days: number;
  focos: number;
  fwi: number;
  ha: number;
}
const DEFAULTS: Values = {
  zoneId: "",
  min: 1,
  score: 55,
  days: 3,
  focos: 100,
  fwi: FWI_VERY_HIGH,
  ha: 100,
};

const valuesOf = (r: AlertRule): Values => ({
  ...DEFAULTS,
  ...(r.kind === "zone_fire"
    ? { zoneId: r.zoneId, min: r.min }
    : r.kind === "risk"
      ? { score: r.score, days: r.days }
      : r.kind === "early_open"
        ? { zoneId: r.zoneId }
        : r.kind === "fwi"
          ? { fwi: r.fwi, days: r.days }
          : r.kind === "growth"
            ? { ha: r.ha }
            : { focos: r.focos }),
});

const inRange = (n: number, lo: number, hi: number) =>
  Number.isFinite(n) && n >= lo && n <= hi;

/** One validation for creating and editing. Returns the message to show, or null when valid. */
function problem(kind: Kind, v: Values, t: Translate): string | null {
  if (kind === "zone_fire")
    return inRange(v.min, 1, 99) ? null : t("rul.p.zone");
  if (kind === "risk")
    return inRange(v.score, 10, 100) && inRange(v.days, 1, 7)
      ? null
      : t("rul.p.risk");
  if (kind === "early_open") return null;
  if (kind === "fwi")
    return inRange(v.fwi, 5, 100) && inRange(v.days, 1, 7)
      ? null
      : t("rul.p.fwi");
  if (kind === "growth")
    return inRange(v.ha, 1, 99_999) ? null : t("rul.p.growth");
  return inRange(v.focos, 1, 99_999) ? null : t("rul.p.activity");
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
      : kind === "early_open"
        ? { ...base, kind, zoneId: v.zoneId }
        : kind === "fwi"
          ? { ...base, kind, fwi: v.fwi, days: v.days }
          : kind === "growth"
            ? { ...base, kind, ha: v.ha }
            : { ...base, kind, focos: v.focos };

const rejected = (t: Translate, msg: string) =>
  toast.error(t("rul.rejected"), { description: msg });

function ValueFields({
  kind,
  v,
  onChange,
  zones,
  zoneName,
  t,
}: {
  t: Translate;
  kind: Kind;
  v: Values;
  onChange: (p: Partial<Values>) => void;
  zones: Ctx["ws"]["features"];
  zoneName: (id: string) => string;
}) {
  const num =
    (k: "min" | "score" | "days" | "focos" | "fwi" | "ha") =>
    (e: { target: { value: string } }) =>
      onChange({ [k]: Number(e.target.value) });
  const zoneSelect = (
    <Field label={t("rul.f.zone")}>
      <select
        className={inputCls}
        value={v.zoneId}
        onChange={(e) => onChange({ zoneId: e.target.value })}
      >
        <option value="">{t("rul.anyOpt")}</option>
        {zones.map((z) => (
          <option key={z.id} value={z.id}>
            {zoneName(z.id)}
          </option>
        ))}
      </select>
    </Field>
  );
  if (kind === "early_open") return zoneSelect;
  if (kind === "fwi")
    return (
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("rul.f.fwi")}>
          <input
            className={inputCls}
            type="number"
            min={5}
            max={100}
            value={v.fwi}
            onChange={num("fwi")}
          />
        </Field>
        <Field label={t("rul.f.days")}>
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
  if (kind === "growth")
    return (
      <Field label={t("rul.f.ha")}>
        <input
          className={inputCls}
          type="number"
          min={1}
          max={99999}
          value={v.ha}
          onChange={num("ha")}
        />
      </Field>
    );
  if (kind === "zone_fire")
    return (
      <div className="grid grid-cols-[1fr_84px] gap-2">
        {zoneSelect}
        <Field label={t("rul.f.min")}>
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
        <Field label={t("rul.f.score")}>
          <input
            className={inputCls}
            type="number"
            min={10}
            max={100}
            value={v.score}
            onChange={num("score")}
          />
        </Field>
        <Field label={t("rul.f.days")}>
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
    <Field label={t("rul.f.focos")}>
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
  const { ws, ruleFirings, setSettings, t } = ctx;
  const locale = ws.settings.locale;
  const rules = ws.settings.rules;
  const zones = ws.features.filter(
    (f) => MODE_ROLE[String(f.properties.mode)] === "zone",
  );
  const zoneName = (id: string) => ws.meta[id]?.name ?? t("res.zone");

  const [kind, setKind] = useState<Kind>("zone_fire");
  const [draft, setDraft] = useState<Values>(DEFAULTS);
  // the rule open for editing and its pending values; null when none is
  const [editing, setEditing] = useState<{ id: string; v: Values } | null>(
    null,
  );

  const add = () => {
    const msg = problem(kind, draft, t);
    if (msg) return rejected(t, msg);
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
    const msg = problem(r.kind, editing.v, t);
    if (msg) return rejected(t, msg);
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
      title={t("rul.title")}
      right={
        ruleFirings.size > 0 ? (
          <Badge tone="fire">{t("rul.firing", { n: ruleFirings.size })}</Badge>
        ) : undefined
      }
    >
      {rules.length === 0 && (
        <p className="mb-3 text-[12px] leading-snug text-foreground/60">
          {t("rul.intro")}
        </p>
      )}
      <ul className="space-y-2">
        {rules.map((r) => {
          const detail = ruleFirings.get(r.id);
          const ack = ctx.alertAck[ruleKey(r.id)];
          const handled = Boolean(detail) && isAcked(ack, 0, ctx.now);
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
                    {describeRule(r, zoneName, locale)}
                  </div>
                  {detail && (
                    <div className="mt-0.5 text-[11.5px] text-[var(--state-bad-ink)]">
                      {detail}
                    </div>
                  )}
                  {detail && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                      {handled ? (
                        <>
                          <span className="text-foreground/65">
                            {t("gen.snoozedBy")} <b>{ack?.by || t("zd.operator")}</b>
                          </span>
                          <Btn
                            onClick={() => ctx.reopenRule(r.id)}
                            className="min-h-7"
                          >
                            {t("early.reopen")}
                          </Btn>
                        </>
                      ) : (
                        <>
                          <Btn
                            variant="solid"
                            onClick={() => ctx.ackRule(r.id)}
                            className="min-h-7"
                          >
                            {t("early.ack")}
                          </Btn>
                          <Btn
                            onClick={() => ctx.ackRule(r.id, 60)}
                            className="min-h-7"
                          >
                            {t("early.snooze")}
                          </Btn>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  aria-label={t("rul.edit")}
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
                  aria-label={t("rul.delete")}
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
                    t={t}
                  />
                  <div className="flex gap-2">
                    <Btn
                      variant="solid"
                      className="flex-1"
                      onClick={() => saveEdit(r)}
                    >
                      {t("rul.save")}
                    </Btn>
                    <Btn onClick={() => setEditing(null)}>{t("rul.cancel")}</Btn>
                  </div>
                </div>
              )}
              <Toggle
                checked={r.enabled}
                onChange={(v) => patch(r.id, { enabled: v })}
                label={r.enabled ? t("rul.on") : t("rul.off")}
              />
            </li>
          );
        })}
      </ul>

      {rules.length < MAX_RULES && (
        <div className="mt-3 space-y-2 rounded-lg bg-foreground/[0.04] p-2.5">
          <Field label={t("rul.new")}>
            <select
              className={inputCls}
              value={kind}
              onChange={(e) => setKind(e.target.value as Kind)}
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {t(`rul.kind.${k}` as MsgKey)}
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
            t={t}
          />
          <Btn variant="solid" className="w-full" onClick={add}>
            <Plus className="size-3.5" aria-hidden /> {t("rul.add")}
          </Btn>
        </div>
      )}
    </Card>
  );
}
