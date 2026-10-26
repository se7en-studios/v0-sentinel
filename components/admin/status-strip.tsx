"use client";

import { cn } from "@/lib/utils";
import { riskLabel, type Translate } from "@/lib/admin/i18n";
import type { Ctx } from "./ctx";
import { scrollToSources } from "./scroll-to-sources";
import { STALE_MIN } from "@/lib/admin/brief";

type Tone = "ok" | "warn" | "bad" | "idle";

const DOT: Record<Tone, string> = {
  ok: "bg-primary",
  warn: "bg-[var(--state-warn)]",
  bad: "bg-[var(--state-bad)]",
  idle: "bg-[var(--state-idle)]",
};

/** A day-old feed looks identical to a quiet day unless the age is on screen. */

/** Above this the satellite pass itself is the bottleneck, not our pipeline (VIIRS NRT is usually ~3 h). */
const LATENCY_WARN_MIN = 240;

const fmtMinutes = (min: number) =>
  min < 120 ? `${min} min` : `${(min / 60).toFixed(1).replace(".", ",")} h`;

function ago(ms: number, t: Translate) {
  const min = Math.max(0, Math.round((Date.now() - ms) / 60_000));
  if (min < 60) return t("age.min", { n: min });
  const h = Math.floor(min / 60);
  return h < 48 ? t("age.hour", { n: h }) : t("age.day", { n: Math.floor(h / 24) });
}

function Item({
  tone,
  label,
  value,
  go,
  goLabel,
}: {
  tone: Tone;
  label: string;
  value: string;
  /** where the item leads; without it the item is plain text */
  go?: () => void;
  goLabel?: string;
}) {
  const body = (
    <>
      <span className={cn("size-1.5 rounded-full", DOT[tone])} aria-hidden />
      <span className="text-foreground/55">{label}</span>
      <span className="num font-semibold">{value}</span>
    </>
  );
  const cls = "flex shrink-0 items-center gap-1.5 whitespace-nowrap";
  return (
    <li className="shrink-0">
      {go ? (
        <button
          type="button"
          onClick={go}
          title={goLabel}
          className={cn(
            cls,
            "-mx-1 rounded px-1 py-0.5 transition-colors hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          {body}
        </button>
      ) : (
        <span className={cls}>{body}</span>
      )}
    </li>
  );
}

/** Always-visible summary under the top bar: risk today, how fresh the satellite data is, and what needs attention. */
export function StatusStrip({ ctx }: { ctx: Ctx }) {
  const {
    forecast,
    lastDetection,
    stats,
    alertCount,
    unackedRules,
    payload,
    noiseCount,
    earlyPending,
    earlyFetchedAt,
    goTab,
    setPanelSeg,
    setPanelOpen,
    sources,
    now,
    t,
  } = ctx;
  const today = forecast?.[0];
  const stale =
    lastDetection > 0 && now - lastDetection > STALE_MIN * 60_000;
  const attention = alertCount + unackedRules;
  const goAlerts = () => {
    goTab("general");
    setPanelSeg("Alertas");
    setPanelOpen(true);
  };
  // gap between the newest detection the satellite made and the moment the server pulled it
  const latencyMin =
    payload?.fetchedAt && payload.newestDetectionAt
      ? Math.max(0, Math.round((payload.fetchedAt - payload.newestDetectionAt) / 60_000))
      : null;

  // age of the newest GOES scan: the fastest feed we have, so its delay is worth showing
  const goesNewest = Math.max(
    0,
    ...sources.filter((x) => x.id.startsWith("goes")).map((x) => x.newestAt ?? 0),
  );
  const goesMin = goesNewest > 0 ? Math.max(0, Math.round((now - goesNewest) / 60_000)) : null;

  return (
    <ul
      aria-label={t("status.aria")}
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
        label={t("status.risk")}
        go={() => goTab("pronostico")}
        goLabel={t("tab.pronostico")}
        value={today ? `${riskLabel(t, today.label)} · ${today.score}` : "—"}
      />
      <Item
        tone={!payload ? "idle" : stale ? "warn" : "ok"}
        label={t("status.lastDetection")}
        value={lastDetection > 0 ? ago(lastDetection, t) : t("status.noData")}
      />
      {latencyMin !== null && (
        <Item
          tone={latencyMin > LATENCY_WARN_MIN ? "warn" : "ok"}
          label={t("status.delay")}
          go={() => {
            goTab("metricas");
            scrollToSources();
          }}
          goLabel={t("status.goDelay")}
          value={fmtMinutes(latencyMin)}
        />
      )}
      {earlyFetchedAt > 0 && (
        <Item
          tone={earlyPending.length > 0 ? "warn" : "ok"}
          label={t("status.early")}
          go={goAlerts}
          goLabel={t("status.goEarly")}
          value={
            earlyPending.length > 0
              ? `${t("status.earlyOpen", { n: earlyPending.length })}${goesMin !== null ? ` · ${t("status.goesAgo", { t: fmtMinutes(goesMin) })}` : ""}`
              : goesMin !== null
                ? `${t("status.quiet")} · ${t("status.goesAgo", { t: fmtMinutes(goesMin) })}`
                : t("status.quiet")
          }
        />
      )}
      <Item
        tone={stats.last24 > 0 ? "warn" : "ok"}
        label={t("status.fires24")}
        value={stats.last24.toLocaleString("es-AR")}
      />
      {noiseCount > 0 && (
        <Item
          tone="idle"
          label={t("status.industrial")}
          value={noiseCount.toLocaleString("es-AR")}
        />
      )}
      {payload?.fallback === "INPE" && (
        <Item tone="warn" label={t("status.backup")} value={t("status.backupValue")} />
      )}
      <Item
        tone={attention > 0 ? "bad" : "ok"}
        label={t("status.alerts")}
        go={goAlerts}
        goLabel={t("status.goAlerts")}
        value={attention > 0 ? String(attention) : t("status.none")}
      />
    </ul>
  );
}
