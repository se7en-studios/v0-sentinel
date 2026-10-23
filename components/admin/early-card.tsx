"use client";

import { Radar } from "lucide-react";
import { nearestPlace } from "@/lib/admin/places";
import { earlyKey, isAcked } from "@/lib/admin/alert-ack";
import { cn } from "@/lib/utils";
import { EARLY_TIER_RATE, earlyTier, type EarlyView } from "@/lib/admin/early";
import { clock, nextPass } from "@/lib/admin/polar-passes";
import type { Ctx } from "./ctx";
import { Badge, Btn, Card, EmptyState } from "./ui";

const LIST_MAX = 10;
const SOURCE_NAME: Record<string, string> = { FIRMS: "NASA", INPE: "INPE" };

const ageLabel = (ctx: Ctx, ms: number) => {
  const min = Math.max(0, Math.round((ctx.now - ms) / 60_000));
  return min < 90
    ? ctx.t("age.min", { n: min })
    : ctx.t("age.hour", { n: Math.round(min / 60) });
};

function Row({ e, zone, ctx }: { e: EarlyView; zone?: string; ctx: Ctx }) {
  const near = nearestPlace(e.lat, e.lng);
  const ack = ctx.alertAck[earlyKey(e)];
  const handled = isAcked(ack, 0, ctx.now);
  const snoozed = handled && ack?.until !== undefined && ack.until - ack.t <= 60 * 60_000;
  const who = ack?.by || ctx.t("zd.operator");
  return (
    <li
      className={cn(
        "rounded-lg border border-[var(--hairline)] p-2 text-[11.5px]",
        handled && "bg-foreground/[0.03] opacity-80",
      )}
    >
      <div className="flex items-start gap-2">
      <Radar className="mt-0.5 size-3.5 shrink-0 text-[#0e9aa7]" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">
          {zone ? ctx.t("ec.near", { zone }) : ctx.t("ec.far", { km: near.km, near: near.near })}
        </div>
        <div className="text-foreground/65">
          {ctx.t("ec.last", { age: ageLabel(ctx, e.lastAt) })} ·{" "}
          {ctx.t(e.scans === 1 ? "ec.scan1" : "ec.scanN", { n: e.scans })}
          {e.frp > 0 && ` · ${Math.round(e.frp)} MW`} ·{" "}
          {e.sources.map((s) => SOURCE_NAME[s] ?? s).join(" + ")}
        </div>
        <div className="text-foreground/65">
          {ctx.t("ec.tier", {
            level: ctx.t(`ec.tier.${earlyTier(e.scans)}`),
            pct: Math.round(EARLY_TIER_RATE[earlyTier(e.scans)] * 100),
          })}
        </div>
      </div>
      <Btn
        className="min-h-7 shrink-0"
        aria-label={ctx.t("ec.viewAria", { place: near.near })}
        onClick={() => {
          ctx.goTab("general");
          ctx.map.current?.flyTo([e.lng, e.lat], 11);
        }}
      >
        {ctx.t("ec.view")}
      </Btn>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-[22px] text-[11px]">
        {handled ? (
          <>
            <span className="text-foreground/65">
              {ctx.t(snoozed ? "early.snoozed" : "early.acked", { who })}
            </span>
            <Btn
              className="min-h-7"
              aria-label={ctx.t("early.reopenAria", { place: near.near })}
              onClick={() => ctx.reopenEarly(e)}
            >
              {ctx.t("early.reopen")}
            </Btn>
          </>
        ) : (
          <>
            <Btn
              variant="solid"
              className="min-h-7"
              aria-label={ctx.t("early.ackAria", { place: near.near })}
              onClick={() => ctx.ackEarly(e)}
            >
              {ctx.t("early.ack")}
            </Btn>
            <Btn
              className="min-h-7"
              aria-label={ctx.t("early.snoozeAria", { place: near.near })}
              onClick={() => ctx.ackEarly(e, 60)}
            >
              {ctx.t("early.snooze")}
            </Btn>
          </>
        )}
      </div>
    </li>
  );
}

/** When a polar satellite will next fly over: until then, an open alert cannot be confirmed by anyone. */
function PassHint({ ctx }: { ctx: Ctx }) {
  const p = nextPass(ctx.now, ctx.ws.settings.useModis);
  const dur = `${Math.floor(p.minutes / 60)} h ${String(p.minutes % 60).padStart(2, "0")} min`;
  return (
    <p className="mb-2 rounded-md bg-foreground/[0.04] px-2 py-1.5 text-[11px] leading-snug text-foreground/70">
      {p.inWindow
        ? ctx.t("ec.pass.now", { to: clock(p.window.to) })
        : ctx.t("ec.pass.next", {
            t: dur,
            from: clock(p.window.from),
            to: clock(p.window.to),
          })}
    </p>
  );
}

/** GOES-19 sees Argentina every 10 minutes; these are the spots no polar satellite has confirmed yet. */
export function EarlyCard({ ctx }: { ctx: Ctx }) {
  const { ws, early, earlyOpen, earlyByZone, earlyError, earlyFetchedAt, t } = ctx;
  if (!ws.settings.earlyAlerts) return null;
  const zoneOf = new Map<string, string>();
  for (const [id, list] of Object.entries(earlyByZone))
    for (const e of list)
      zoneOf.set(`${e.lat},${e.lng}`, ws.meta[id]?.name ?? t("ec.aZone"));
  const confirmed = early.filter((e) => e.status === "confirmed").length;
  const noise = early.filter((e) => e.status === "noise").length;
  const handledCount = earlyOpen.length - ctx.earlyPending.length;
  const shown = [...earlyOpen]
    .sort(
      (a, b) =>
        Number(isAcked(ws.alertAck[earlyKey(a)], 0, ctx.now)) -
          Number(isAcked(ws.alertAck[earlyKey(b)], 0, ctx.now)) ||
        Number(zoneOf.has(`${b.lat},${b.lng}`)) -
          Number(zoneOf.has(`${a.lat},${a.lng}`)) || b.lastAt - a.lastAt,
    )
    .slice(0, LIST_MAX);
  return (
    <Card
      bare
      title={t("early.title")}
      right={<Badge tone={ctx.earlyPending.length ? "sim" : "muted"}>GOES-19</Badge>}
    >
      <p className="mb-2 text-[11px] leading-snug text-foreground/60">
        {t("early.intro")}
      </p>
      {shown.length > 0 && <PassHint ctx={ctx} />}
      {earlyFetchedAt === 0 && !earlyError && (
        <p className="text-[11.5px] text-foreground/55">{t("early.loading")}</p>
      )}
      {earlyError && earlyFetchedAt === 0 && (
        <p className="text-[11.5px] text-[var(--state-bad-ink)]">{earlyError}</p>
      )}
      {earlyFetchedAt > 0 && shown.length === 0 && (
        <EmptyState icon={<Radar className="size-4" />} title={t("early.none")}>
          {t("early.noneSub")}
        </EmptyState>
      )}
      {shown.length > 0 && (
        <ul className="space-y-1.5" aria-label={t("ec.list")}>
          {shown.map((e) => (
            <Row key={`${e.lat},${e.lng}`} e={e} zone={zoneOf.get(`${e.lat},${e.lng}`)} ctx={ctx} />
          ))}
        </ul>
      )}
      {earlyOpen.length > shown.length && (
        <p className="mt-1.5 text-[11px] text-foreground/55">
          {t("early.more", { n: earlyOpen.length - shown.length })}
        </p>
      )}
      {handledCount > 0 && (
        <p className="mt-1.5 text-[11px] text-foreground/55">
          {t("early.handled", { n: handledCount })}
        </p>
      )}
      {early.length > 0 && (
        <p className="mt-2 text-[11px] text-foreground/55">
          {t("early.summary", { c: confirmed, d: noise })}
        </p>
      )}
    </Card>
  );
}
