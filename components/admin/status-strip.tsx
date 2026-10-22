"use client";

import { cn } from "@/lib/utils";
import type { Ctx } from "./ctx";

type Tone = "ok" | "warn" | "bad" | "idle";

const DOT: Record<Tone, string> = {
  ok: "bg-primary",
  warn: "bg-[var(--state-warn)]",
  bad: "bg-[var(--state-bad)]",
  idle: "bg-[var(--state-idle)]",
};

/** A day-old feed looks identical to a quiet day unless the age is on screen. */
const STALE_MIN = 6 * 60;

function ago(ms: number) {
  const min = Math.max(0, Math.round((Date.now() - ms) / 60_000));
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  return h < 48 ? `hace ${h} h` : `hace ${Math.floor(h / 24)} d`;
}

function Item({
  tone,
  label,
  value,
}: {
  tone: Tone;
  label: string;
  value: string;
}) {
  return (
    <li className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
      <span className={cn("size-1.5 rounded-full", DOT[tone])} aria-hidden />
      <span className="text-foreground/55">{label}</span>
      <span className="num font-semibold">{value}</span>
    </li>
  );
}

/** Always-visible summary under the top bar: risk today, how fresh the satellite data is, and what needs attention. */
export function StatusStrip({ ctx }: { ctx: Ctx }) {
  const { forecast, lastDetection, stats, alertCount, ruleFirings, payload, noiseCount } =
    ctx;
  const today = forecast?.[0];
  const stale =
    lastDetection > 0 && Date.now() - lastDetection > STALE_MIN * 60_000;
  const attention = alertCount + ruleFirings.size;

  return (
    <ul
      aria-label="Estado general"
      className="no-scrollbar flex shrink-0 items-center gap-x-5 overflow-x-auto border-b border-[var(--hairline)] bg-card px-4 py-1.5 text-[11.5px]"
    >
      <Item
        tone={
          !today
            ? "idle"
            : today.score >= 75
              ? "bad"
              : today.score >= 55
                ? "warn"
                : "ok"
        }
        label="Riesgo hoy"
        value={today ? `${today.label} · ${today.score}` : "—"}
      />
      <Item
        tone={!payload ? "idle" : stale ? "warn" : "ok"}
        label="Última detección"
        value={lastDetection > 0 ? ago(lastDetection) : "sin datos"}
      />
      <Item
        tone={stats.last24 > 0 ? "warn" : "ok"}
        label="Focos 24 h"
        value={stats.last24.toLocaleString("es-AR")}
      />
      {noiseCount > 0 && (
        <Item
          tone="idle"
          label="Calor industrial oculto"
          value={noiseCount.toLocaleString("es-AR")}
        />
      )}
      <Item
        tone={attention > 0 ? "bad" : "ok"}
        label="Alertas"
        value={attention > 0 ? String(attention) : "ninguna"}
      />
    </ul>
  );
}
