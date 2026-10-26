"use client";

import { useMemo, useState } from "react";
import {
  INTERVAL_OPTIONS,
  MAX_PER_DAY_LIMIT,
  contactsOf,
  isEmail,
  isPhone,
} from "@/lib/admin/alert-delivery";
import {
  buildAlertMessage,
  sampleDetail,
  whatsappLine,
  type AlertKind,
} from "@/lib/admin/alert-message";
import { ageText } from "@/lib/admin/age";
import { useDeliveryState } from "@/lib/admin/delivery-store";
import { parseNotify, type ChannelView } from "@/lib/admin/integrations";
import { REGIONS } from "@/lib/admin/types";
import type { Ctx } from "./ctx";
import { Btn, Card, Field, Toggle, inputCls } from "./ui";

const KINDS: AlertKind[] = [
  "zone_fire",
  "early_open",
  "risk",
  "fwi",
  "growth",
  "activity",
];

type Check =
  | { state: "idle" | "busy" | "failed" }
  | { state: "done"; rows: ChannelView[] };

/** Turn on delivery of the alert rules by email / WhatsApp: who gets them, the exact text, the limits, and whether the server is ready. */
export function DeliveryCard({ ctx }: { ctx: Ctx }) {
  const { t, ws, setSettings, authedFetch } = ctx;
  const s = ws.settings;
  const n = s.notify;
  const delivery = useDeliveryState();
  const [kind, setKind] = useState<AlertKind>("zone_fire");
  const [check, setCheck] = useState<Check>({ state: "idle" });
  const { emails, phones } = contactsOf(n);
  const hasContact = emails.length + phones.length > 0;
  const set = (patch: Partial<typeof n>) =>
    setSettings({ notify: { ...n, ...patch } });

  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/admin`
      : undefined;
  const preview = useMemo(
    () =>
      buildAlertMessage({
        kind,
        detail: sampleDetail(kind, s.locale),
        org: s.org,
        region: REGIONS.find((r) => r.id === s.regionId)?.name ?? "",
        locale: s.locale,
        // a fixed moment would look stale; the preview shows the real format with the current time
        at: ctx.now,
        link,
      }),
    [kind, s.locale, s.org, s.regionId, ctx.now, link],
  );

  const verify = async () => {
    setCheck({ state: "busy" });
    const channels = [
      ...(emails.length ? ["email"] : []),
      ...(phones.length ? ["whatsapp"] : []),
    ];
    try {
      const res = await authedFetch("/api/admin/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Sentinel",
          message: "Sentinel",
          channels,
          emails,
          phones,
          dryRun: true,
        }),
      });
      const parsed = res.ok ? parseNotify(await res.json()) : null;
      setCheck(
        parsed ? { state: "done", rows: parsed.results } : { state: "failed" },
      );
    } catch {
      setCheck({ state: "failed" });
    }
  };

  const channelName = (c: string) =>
    t(c === "whatsapp" ? "dlv.ch.whatsapp" : "dlv.ch.email");
  const resultName = (status: string) =>
    status === "sent" || status === "dry-run" || status === "not-configured" || status === "skipped" || status === "failed"
      ? t(`int.res.${status}`)
      : status;
  const statusText = (r: ChannelView) =>
    r.status === "dry-run"
      ? t("dlv.status.ready")
      : r.status === "not-configured"
        ? t("dlv.status.notConfigured")
        : r.status === "skipped"
          ? t("dlv.status.skipped")
          : t("dlv.status.failed");
  const missing =
    check.state === "done"
      ? check.rows
          .filter((r) => r.status === "not-configured")
          .map((r) => r.channel)
      : [];

  const contactLine = (
    label: "dlv.contact.email" | "dlv.contact.phone",
    v: string,
    ok: boolean,
  ) =>
    v ? (
      <li
        key={label}
        className={ok ? undefined : "text-[var(--state-bad-ink)]"}
      >
        {ok ? t(label, { v }) : t("dlv.contact.bad", { v })}
      </li>
    ) : null;

  return (
    <Card title={t("dlv.title")}>
      <p className="text-[12.5px] leading-snug text-foreground/70">
        {t("dlv.intro")}
      </p>

      <h4 className="mt-4 text-[12px] font-semibold uppercase tracking-wide text-foreground/70">
        {t("dlv.contact")}
      </h4>
      {n.email || n.whatsapp ? (
        <ul className="mt-1 space-y-0.5 text-[12.5px]">
          {contactLine("dlv.contact.email", n.email, isEmail(n.email))}
          {contactLine("dlv.contact.phone", n.whatsapp, isPhone(n.whatsapp))}
        </ul>
      ) : (
        <p className="mt-1 text-[12.5px] text-foreground/70">
          {t("dlv.contact.none")}
        </p>
      )}

      <h4 className="mt-4 text-[12px] font-semibold uppercase tracking-wide text-foreground/70">
        {t("dlv.preview")}
      </h4>
      <p className="mt-1 text-[11.5px] text-foreground/70">
        {t("dlv.preview.hint")}
      </p>
      <div className="mt-2 max-w-xs">
        <Field label={t("dlv.preview.kind")}>
          <select
            className={inputCls}
            value={kind}
            onChange={(e) => setKind(e.target.value as AlertKind)}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {t(`msg.t.${k}`)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="mt-2 grid gap-3 md:grid-cols-2">
        <section
          aria-label={t("dlv.preview.email")}
          className="rounded-xl border border-[var(--hairline)] bg-background p-3"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/70">
            {t("dlv.preview.email")}
          </p>
          <p className="mt-1 text-[12.5px]">
            <span className="text-foreground/70">
              {t("dlv.preview.subject")}:{" "}
            </span>
            <span className="font-semibold">[Sentinel] {preview.title}</span>
          </p>
          <p className="mt-2 whitespace-pre-line text-[12.5px] leading-snug">
            {preview.message}
            {preview.link ? `\n\n${preview.link}` : ""}
          </p>
        </section>
        <section
          aria-label={t("dlv.preview.whatsapp")}
          className="rounded-xl border border-[var(--hairline)] bg-background p-3"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/70">
            {t("dlv.preview.whatsapp")}
          </p>
          <p className="mt-2 break-words text-[12.5px] leading-snug">
            {whatsappLine(preview)}
          </p>
        </section>
      </div>

      <h4 className="mt-4 text-[12px] font-semibold uppercase tracking-wide text-foreground/70">
        {t("dlv.limits")}
      </h4>
      <div className="mt-1 grid gap-3 md:grid-cols-2">
        <Field label={t("dlv.interval")}>
          <select
            className={inputCls}
            value={n.minIntervalMin}
            onChange={(e) => set({ minIntervalMin: Number(e.target.value) })}
          >
            {INTERVAL_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {t(`dlv.interval.${m}`)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("dlv.perDay", { n: n.maxPerDay })}>
          <input
            type="number"
            className={inputCls}
            min={1}
            max={MAX_PER_DAY_LIMIT}
            value={n.maxPerDay}
            onChange={(e) =>
              set({
                maxPerDay: Math.min(
                  MAX_PER_DAY_LIMIT,
                  Math.max(1, Math.round(Number(e.target.value) || 1)),
                ),
              })
            }
          />
        </Field>
      </div>

      <h4 className="mt-4 text-[12px] font-semibold uppercase tracking-wide text-foreground/70">
        {t("dlv.status")}
      </h4>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <Btn
          disabled={!hasContact || check.state === "busy"}
          onClick={verify}
          className="max-md:min-h-11"
        >
          {check.state === "busy"
            ? t("dlv.status.checking")
            : t("dlv.status.check")}
        </Btn>
        {check.state === "failed" && (
          <span className="text-[12.5px] text-[var(--state-bad-ink)]">
            {t("dlv.status.failed")}
          </span>
        )}
      </div>
      {check.state === "done" && (
        <ul className="mt-2 space-y-0.5 text-[12.5px]" aria-live="polite">
          {check.rows
            .filter((r) => r.channel !== "webhook")
            .map((r) => (
              <li key={r.channel}>
                <span className="font-medium">{channelName(r.channel)}:</span>{" "}
                {statusText(r)}
              </li>
            ))}
        </ul>
      )}
      {missing.length > 0 && (
        <div className="mt-2 rounded-xl bg-foreground/[0.04] p-3 text-[12.5px] leading-snug">
          <p className="font-semibold">{t("dlv.load.title")}</p>
          <ul className="mt-1 space-y-1">
            {missing.map((c) => (
              <li key={c}>
                {t(c === "whatsapp" ? "dlv.load.whatsapp" : "dlv.load.email")}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 border-t border-[var(--hairline)] pt-2">
        <Toggle
          checked={n.deliver && hasContact}
          onChange={(v) => set({ deliver: v && hasContact })}
          label={t("dlv.activate")}
          hint={hasContact ? t("dlv.activate.hint") : t("dlv.needContact")}
        />
        <p className="mt-1 text-[11.5px] text-foreground/70">
          {delivery.last
            ? t("dlv.last", {
                age: ageText(t, delivery.last.at, ctx.now),
                channels: delivery.last.channels
                  .map((c) => `${channelName(c.channel)}: ${resultName(c.status)}`)
                  .join(", "),
              })
            : t("dlv.last.none")}
        </p>
      </div>
    </Card>
  );
}
