"use client";

import { useMemo } from "react";
import { Copy, Send } from "lucide-react";
import { toast } from "sonner";
import { buildBriefing, delayedSources } from "@/lib/admin/briefing";
import type { DayForecast } from "@/lib/admin/forecast";
import { MODE_ROLE } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import type { MsgKey } from "@/lib/admin/i18n";
import type { Ctx } from "./ctx";
import { Badge, Card } from "./ui";

const TONE = {
  alert: { dot: "bg-[#b83a3a]", badge: "fire" as const, label: "brf.tone.alert" as MsgKey },
  watch: { dot: "bg-[#e8710a]", badge: "muted" as const, label: "brf.tone.watch" as MsgKey },
  calm: { dot: "bg-primary", badge: "ok" as const, label: "brf.tone.calm" as MsgKey },
};

const btn =
  "inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--hairline)] px-3 text-[12px] font-medium text-foreground/75 transition-colors hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Auto-written daily summary of fires, zones and weather risk, shareable as plain text. */
export function BriefingCard({
  ctx,
  forecast,
}: {
  ctx: Ctx;
  forecast?: DayForecast[] | null;
}) {
  const { ws, stats, zoneHits, clusters, earlyOpen, sources, now, t } = ctx;
  const locale = ws.settings.locale;
  const b = useMemo(() => {
    const zones = ws.features
      .filter((f) => MODE_ROLE[String(f.properties.mode)] === "zone")
      .map((z) => ({
        name: ws.meta[z.id]?.name ?? t("res.zone"),
        recent: zoneHits[z.id]?.recent ?? 0,
      }));
    return buildBriefing(
      {
      org: ws.settings.org,
      now: new Date(),
      last24: stats.last24,
      total10d: stats.total,
      frpMw: stats.frp,
      zones,
      clusters,
      earlyOpen: earlyOpen.length,
      delayed: delayedSources(sources, now),
      today: forecast?.[0],
      worst: forecast?.length
        ? forecast.reduce((a, d) => (d.score > a.score ? d : a))
        : undefined,
      best: forecast?.length
        ? forecast.reduce((a, d) => (d.score < a.score ? d : a))
        : undefined,
      },
      locale,
    );
  }, [ws, stats, zoneHits, clusters, forecast, earlyOpen, sources, now, t, locale]);
  const tone = TONE[b.tone];

  const copy = () =>
    navigator.clipboard.writeText(b.text).then(
      () => toast.success(t("brf.copied")),
      () => toast.error(t("brf.copyFail")),
    );

  return (
    <Card
      title={t("brf.title")}
      right={<Badge tone={tone.badge}>{t(tone.label)}</Badge>}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn("mt-1.5 size-2 shrink-0 rounded-full", tone.dot)}
          aria-hidden
        />
        <h2 className="font-heading text-[17px] font-semibold leading-snug">
          {b.headline}
        </h2>
      </div>
      <ul className="mt-3 space-y-1.5 text-[13px] leading-snug text-foreground/75">
        {b.points.map((p, i) => (
          <li key={`${i}-${p}`} className="flex gap-2">
            <span className="mt-[7px] size-1 shrink-0 rounded-full bg-foreground/35" />
            {p}
          </li>
        ))}
      </ul>
      <div className="mt-3 rounded-lg bg-foreground/[0.04] p-3">
        <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-foreground/55">
          {t("brf.actionsTitle")}
        </div>
        <ul className="space-y-1 text-[13px]">
          {b.actions.map((a, i) => (
            <li key={`${i}-${a}`}>→ {a}</li>
          ))}
        </ul>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={copy} className={btn}>
          <Copy className="size-3.5" aria-hidden /> {t("brf.copy")}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(b.text)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={btn}
        >
          <Send className="size-3.5" aria-hidden /> {t("brf.whatsapp")}
        </a>
      </div>
    </Card>
  );
}
