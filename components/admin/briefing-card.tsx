"use client";

import { useMemo } from "react";
import { Copy, Send } from "lucide-react";
import { toast } from "sonner";
import { buildBriefing } from "@/lib/admin/briefing";
import type { DayForecast } from "@/lib/admin/forecast";
import { MODE_ROLE } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import type { Ctx } from "./ctx";
import { Badge, Card } from "./ui";

const TONE = {
  alert: { dot: "bg-[#b83a3a]", badge: "fire" as const, label: "Atención" },
  watch: { dot: "bg-[#e8710a]", badge: "muted" as const, label: "Vigilancia" },
  calm: { dot: "bg-primary", badge: "ok" as const, label: "Tranquilo" },
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
  const { ws, stats, zoneHits, clusters } = ctx;
  const b = useMemo(() => {
    const zones = ws.features
      .filter((f) => MODE_ROLE[String(f.properties.mode)] === "zone")
      .map((z) => ({
        name: ws.meta[z.id]?.name ?? "Zona",
        recent: zoneHits[z.id]?.recent ?? 0,
      }));
    return buildBriefing({
      org: ws.settings.org,
      now: new Date(),
      last24: stats.last24,
      total10d: stats.total,
      frpMw: stats.frp,
      zones,
      clusters,
      today: forecast?.[0],
      worst: forecast?.length
        ? forecast.reduce((a, d) => (d.score > a.score ? d : a))
        : undefined,
      best: forecast?.length
        ? forecast.reduce((a, d) => (d.score < a.score ? d : a))
        : undefined,
    });
  }, [ws, stats, zoneHits, clusters, forecast]);
  const t = TONE[b.tone];

  const copy = () =>
    navigator.clipboard.writeText(b.text).then(
      () => toast.success("Briefing copiado"),
      () => toast.error("No se pudo copiar el briefing"),
    );

  return (
    <Card
      title="Briefing del día"
      right={<Badge tone={t.badge}>{t.label}</Badge>}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn("mt-1.5 size-2 shrink-0 rounded-full", t.dot)}
          aria-hidden
        />
        <h2 className="font-heading text-[17px] font-semibold leading-snug">
          {b.headline}
        </h2>
      </div>
      <ul className="mt-3 space-y-1.5 text-[13px] leading-snug text-foreground/75">
        {b.points.map((p) => (
          <li key={p} className="flex gap-2">
            <span className="mt-[7px] size-1 shrink-0 rounded-full bg-foreground/35" />
            {p}
          </li>
        ))}
      </ul>
      <div className="mt-3 rounded-lg bg-foreground/[0.04] p-3">
        <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-foreground/55">
          Acciones sugeridas
        </div>
        <ul className="space-y-1 text-[13px]">
          {b.actions.map((a) => (
            <li key={a}>→ {a}</li>
          ))}
        </ul>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={copy} className={btn}>
          <Copy className="size-3.5" aria-hidden /> Copiar texto
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(b.text)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={btn}
        >
          <Send className="size-3.5" aria-hidden /> Enviar por WhatsApp
        </a>
      </div>
    </Card>
  );
}
