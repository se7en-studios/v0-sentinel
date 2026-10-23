"use client";

import { useRef, useState } from "react";
import { Activity, Send } from "lucide-react";
import {
  parseHealth,
  parseNotify,
  sourceState,
  type Channel,
  type ChannelView,
  type HealthView,
} from "@/lib/admin/integrations";
import type { MsgKey } from "@/lib/admin/i18n";
import type { Ctx } from "./ctx";
import { Badge, Btn, Card, Field, inputCls } from "./ui";

const CHANNELS: Channel[] = ["webhook", "email", "whatsapp"];
const SEVERITIES = ["info", "warning", "critical"] as const;
type Severity = (typeof SEVERITIES)[number];
const TONE = { ok: "ok", slow: "sim", down: "fire" } as const;

/** Why a call failed, in words: sessions and rate limits are the two cases people can act on. */
const failKey = (status: number, base: "health" | "notify"): MsgKey =>
  status === 401 || status === 403
    ? `int.${base}.denied`
    : status === 429
      ? `int.${base}.limit`
      : `int.${base}.error`;

function ageText(t: Ctx["t"], min: number) {
  if (min < 60) return t("age.min", { n: Math.round(min) });
  const h = Math.floor(min / 60);
  return h < 48
    ? t("age.hour", { n: h })
    : t("age.day", { n: Math.floor(h / 24) });
}

function HealthBlock({ ctx }: { ctx: Ctx }) {
  const { t, authedFetch } = ctx;
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<HealthView | null>(null);
  const [err, setErr] = useState<MsgKey | null>(null);
  const running = useRef(false);

  const run = async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setErr(null);
    try {
      const res = await authedFetch("/api/admin/health");
      const parsed = res.ok ? parseHealth(await res.json()) : null;
      if (parsed) setView(parsed);
      else setErr(failKey(res.status, "health"));
    } catch {
      setErr("int.health.error");
    } finally {
      running.current = false;
      setBusy(false);
    }
  };

  const bad = view?.sources.filter((s) => !s.ok).length ?? 0;
  return (
    <Card
      title={t("int.health.title")}
      right={<Activity className="size-4 text-foreground/45" aria-hidden />}
    >
      <p className="mb-3 text-[12.5px] leading-snug text-foreground/70">
        {t("int.health.hint")}
      </p>
      <Btn variant="solid" onClick={run} disabled={busy}>
        {busy ? t("int.health.running") : t("int.health.run")}
      </Btn>
      <div aria-live="polite">
        {err && (
          <p role="alert" className="mt-3 text-[12.5px] text-[var(--state-bad-ink)]">
            {t(err)}
          </p>
        )}
        {view && (
          <div className="mt-3">
            <p className="mb-2 text-[12.5px] font-semibold">
              {bad === 0 && view.sources.length > 0
                ? t("int.health.all")
                : t("int.health.some", { n: bad, total: view.sources.length })}
              {view.updated && (
                <span className="ml-2 font-normal text-foreground/55">
                  {t("int.health.checked", {
                    time: new Date(view.updated).toLocaleTimeString(),
                  })}
                </span>
              )}
            </p>
            <ul className="divide-y divide-[var(--hairline)] rounded-lg border border-[var(--hairline)]">
              {view.sources.map((s) => {
                const st = sourceState(s);
                return (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-[12.5px]"
                  >
                    <span className="min-w-0 flex-1 font-medium">
                      {s.label}
                    </span>
                    <Badge tone={TONE[st]}>{t(`int.src.${st}`)}</Badge>
                    <span className="tabular-nums text-foreground/60">
                      {t("int.src.latency", { ms: s.latencyMs })}
                    </span>
                    <span className="text-foreground/60">
                      {s.error && !s.ok
                        ? s.error
                        : s.ageMin === undefined
                          ? t("int.src.nodata")
                          : t("int.src.data", { age: ageText(t, s.ageMin) })}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

function ResultRow({ r, t }: { r: ChannelView; t: Ctx["t"] }) {
  const tone =
    r.status === "sent"
      ? "ok"
      : r.status === "failed"
        ? "fire"
        : r.status === "dry-run"
          ? "sim"
          : "muted";
  const note =
    r.status === "skipped"
      ? t("int.res.skippedWhy")
      : r.status === "failed"
        ? t("int.res.failedWhy")
        : r.attempted > 0
          ? t("int.res.count", { ok: r.delivered, n: r.attempted })
          : "";
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-[12.5px]">
      <span className="min-w-0 flex-1 font-medium">
        {t(`int.notify.ch.${r.channel}`)}
      </span>
      <Badge tone={tone}>{t(`int.res.${r.status}`)}</Badge>
      {note && <span className="text-foreground/60">{note}</span>}
    </li>
  );
}

function NotifyBlock({ ctx }: { ctx: Ctx }) {
  const { t, authedFetch } = ctx;
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<Severity>("warning");
  const [channels, setChannels] = useState<Channel[]>(CHANNELS);
  const [dry, setDry] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<MsgKey | null>(null);
  const [out, setOut] = useState<{
    dryRun: boolean;
    results: ChannelView[];
  } | null>(null);
  const running = useRef(false);

  const send = async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setConfirming(false);
    setErr(null);
    try {
      const res = await authedFetch("/api/admin/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          severity,
          channels,
          dryRun: dry,
        }),
      });
      const parsed = res.ok ? parseNotify(await res.json()) : null;
      if (parsed) setOut(parsed);
      else setErr(failKey(res.status, "notify"));
    } catch {
      setErr("int.notify.error");
    } finally {
      running.current = false;
      setBusy(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!title.trim() || !message.trim()) return setErr("int.notify.invalid");
    if (!channels.length) return setErr("int.notify.needChannel");
    setErr(null);
    if (dry) void send();
    else setConfirming(true);
  };

  const toggleChannel = (c: Channel, on: boolean) => {
    setChannels((cur) => (on ? [...cur, c] : cur.filter((x) => x !== c)));
    setConfirming(false);
  };

  return (
    <Card
      title={t("int.notify.title")}
      right={<Send className="size-4 text-foreground/45" aria-hidden />}
    >
      <p className="mb-3 text-[12.5px] leading-snug text-foreground/70">
        {t("int.notify.hint")}
      </p>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label={t("int.notify.name")}>
            <input
              className={inputCls}
              value={title}
              maxLength={120}
              onChange={(e) => {
                setTitle(e.target.value);
                setConfirming(false); // what was confirmed is what is sent
              }}
            />
          </Field>
          <Field label={t("int.notify.severity")}>
            <select
              className={inputCls}
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Severity)}
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {t(`int.notify.sev.${s}`)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label={t("int.notify.message")}>
          <textarea
            className={`${inputCls} min-h-20`}
            value={message}
            maxLength={1000}
            onChange={(e) => {
              setMessage(e.target.value);
              setConfirming(false);
            }}
          />
        </Field>
        <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <legend className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/60">
            {t("int.notify.channels")}
          </legend>
          {CHANNELS.map((c) => (
            <label key={c} className="flex items-center gap-1.5 text-[12.5px]">
              <input
                type="checkbox"
                className="accent-primary"
                checked={channels.includes(c)}
                onChange={(e) => toggleChannel(c, e.target.checked)}
              />
              {t(`int.notify.ch.${c}`)}
            </label>
          ))}
        </fieldset>
        <label className="flex items-center gap-1.5 text-[12.5px] font-medium">
          <input
            type="checkbox"
            className="accent-primary"
            checked={dry}
            onChange={(e) => {
              setDry(e.target.checked);
              setConfirming(false);
            }}
          />
          {t("int.notify.dry")}
        </label>
        {confirming ? (
          <div
            role="alertdialog"
            aria-label={t("int.notify.sendReal")}
            className="rounded-lg border border-[var(--state-bad-ink)]/40 p-3"
          >
            <p className="mb-2 text-[12.5px]">{t("int.notify.confirmText")}</p>
            <div className="flex gap-2">
              <Btn
                variant="danger"
                type="button"
                onClick={send}
                disabled={busy}
              >
                {t("int.notify.confirm")}
              </Btn>
              <Btn type="button" onClick={() => setConfirming(false)}>
                {t("int.notify.cancel")}
              </Btn>
            </div>
          </div>
        ) : (
          <Btn variant={dry ? "solid" : "danger"} type="submit" disabled={busy}>
            {busy
              ? t("int.notify.sending")
              : dry
                ? t("int.notify.send")
                : t("int.notify.sendReal")}
          </Btn>
        )}
      </form>
      <div aria-live="polite">
        {err && (
          <p role="alert" className="mt-3 text-[12.5px] text-[var(--state-bad-ink)]">
            {t(err)}
          </p>
        )}
        {out && (
          <div className="mt-3">
            <p className="mb-2 text-[12.5px] font-semibold">
              {out.dryRun
                ? t("int.notify.resultDry")
                : t("int.notify.resultReal")}
            </p>
            <ul className="divide-y divide-[var(--hairline)] rounded-lg border border-[var(--hairline)]">
              {out.results.map((r) => (
                <ResultRow key={r.channel} r={r} t={t} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

/** Settings card: probe the data sources and test the server's notice channels (dry run by default). */
export function IntegrationsCard({ ctx }: { ctx: Ctx }) {
  return (
    <div className="space-y-4">
      <p className="text-[12.5px] leading-snug text-foreground/70">
        {ctx.t("int.intro")}
      </p>
      <HealthBlock ctx={ctx} />
      <NotifyBlock ctx={ctx} />
    </div>
  );
}
