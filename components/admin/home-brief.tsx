"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ageText, durationText } from "@/lib/admin/age";
import { buildBrief, countFreshFires, type BriefGo, type BriefItem } from "@/lib/admin/brief";
import { NUM_LOCALE } from "@/lib/admin/i18n-shell";
import type { Translate } from "@/lib/admin/i18n";
import type { Ctx } from "./ctx";
import { Btn } from "./ui";
import { scrollToSources } from "./scroll-to-sources";

const VISIT_KEY = "sentinel-admin-last-visit";
const SAVE_EVERY_MS = 60_000;

// fixed for the whole session: the stored time keeps moving forward, but "since your last visit" must not
let sessionSince: number | null | undefined;
function readSince(): number | null {
  if (sessionSince === undefined) {
    try {
      const v = Number(localStorage.getItem(VISIT_KEY));
      sessionSince = Number.isFinite(v) && v > 0 ? v : null;
    } catch {
      sessionSince = null;
    }
  }
  return sessionSince;
}

/**
 * When the person was last here: the clock moves the stored time forward only while the tab is visible, and
 * stamps the moment it stops being visible, so a tab left open overnight does not swallow what happened meanwhile.
 */
function useLastVisit(): number | null {
  const since = readSince();
  useEffect(() => {
    const write = () => {
      try {
        localStorage.setItem(VISIT_KEY, String(Date.now()));
      } catch {
        /* private mode: there is just no "since" next time */
      }
    };
    const whileVisible = () => {
      if (document.visibilityState === "visible") write();
    };
    // becoming hidden is the last moment it was seen; becoming visible again resumes the clock
    const onVisibility = () => write();
    whileVisible();
    const id = setInterval(whileVisible, SAVE_EVERY_MS);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", whileVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", whileVisible);
    };
  }, []);
  return since;
}

const DOT: Record<BriefItem["kind"], string> = {
  error: "bg-[var(--state-bad-ink)]",
  zones: "bg-[var(--state-bad-ink)]",
  rules: "bg-[var(--state-bad-ink)]",
  early: "bg-[var(--state-warn)]",
  down: "bg-[var(--state-warn)]",
  stale: "bg-[var(--state-warn)]",
  fires: "bg-primary",
};

function itemText(t: Translate, i: BriefItem, locale: string): string {
  switch (i.kind) {
    case "error":
      return t("brief.error");
    case "stale":
      return t("brief.stale", { t: durationText(i.n, locale) });
    case "zones":
      return i.n === 1 ? t("brief.zones.one") : t("brief.zones", { n: i.n });
    case "rules":
      return i.n === 1 ? t("brief.rules.one") : t("brief.rules", { n: i.n });
    case "early":
      return i.n === 1 ? t("brief.early.one") : t("brief.early", { n: i.n });
    case "down":
      return i.n === 1 ? t("brief.down.one") : t("brief.down", { n: i.n });
    case "fires":
      return i.n === 1 ? t("brief.fires.one") : t("brief.fires", { n: i.n });
  }
}

const goLabel = (t: Translate, i: BriefItem): string => t(`brief.${i.kind}.go`);

/** What changed since the last visit, most urgent first, each with one clear action. */
export function HomeBrief({ ctx }: { ctx: Ctx }) {
  const { t } = ctx;
  const since = useLastVisit();
  const zonesWithFire = Object.values(ctx.zoneHits).filter(
    (h) => h.recent > 0,
  ).length;
  const days = ctx.payload?.days;
  // parsing every detection is the costly part: it must not re-run with the clock (now) or on other tabs
  const newFires = useMemo(() => countFreshFires(ctx.fires, days ?? [], since), [ctx.fires, days, since]);
  const onOverview = ctx.tab === "general";
  const items = useMemo(
    () =>
      onOverview
        ? buildBrief({
            now: ctx.now,
            newFires,
            earlyPending: ctx.earlyPending.length,
            unackedRules: ctx.unackedRules,
            zonesWithFire,
            lastDetection: ctx.lastDetection,
            sources: ctx.sources,
            firesError: ctx.firesError,
          })
        : [],
    [onOverview, ctx.now, newFires, ctx.earlyPending.length, ctx.unackedRules, zonesWithFire, ctx.lastDetection, ctx.sources, ctx.firesError],
  );
  const [open, setOpen] = useState(false);

  const go = (to: BriefGo) => {
    setOpen(false);
    if (to === "retry") return ctx.reload();
    if (to === "sources") {
      ctx.goTab("metricas");
      return scrollToSources();
    }
    if (to === "alerts") {
      ctx.goTab("general");
      ctx.setPanelSeg("Alertas");
      return ctx.setPanelOpen(true);
    }
    ctx.goTab(to);
  };

  const locale = NUM_LOCALE[ctx.ws.settings.locale];
  const title =
    since === null
      ? t("brief.titleFirst")
      : `${t("brief.title")} · ${ageText(t, since, ctx.now)}`;
  const count =
    items.length === 1
      ? t("brief.count.one")
      : t("brief.count", { n: items.length });

  // mounted on every tab so the visit clock keeps running, but only shown on the overview
  if (!onOverview) return null;

  // One fixed-height row, always there: the news arrive after the data does, and a bar that appeared late
  // would push the map down under the person's cursor. The list opens over the map instead of moving it.
  const row = "flex min-h-9 w-full items-center gap-2 px-4 py-1.5 text-left text-[12.5px] max-md:min-h-11";
  return (
    <section
      aria-label={t("brief.aria")}
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      className="relative z-20 shrink-0 border-b border-[var(--hairline)] bg-card"
    >
      {items.length === 0 ? (
        <p className={cn(row, "text-foreground/70")}>
          <span className="font-semibold text-foreground">{title}</span>{" "}
          · {t("brief.none")}
        </p>
      ) : (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className={cn(row, "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring")}
        >
          <span className="font-semibold">{title}</span>
          <span className="text-foreground/70">· {count}</span>
          <ChevronDown className={cn("ml-auto size-3.5 opacity-60 transition-transform", open && "rotate-180")} aria-hidden />
        </button>
      )}
      {open && items.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-30 divide-y divide-[var(--hairline)] border-b border-[var(--hairline)] bg-card shadow-lg">
          {items.map((i) => (
            <li key={i.kind} className="flex items-center gap-3 px-4 py-1.5 text-[12.5px]">
              <span className={cn("size-2 shrink-0 rounded-full", DOT[i.kind])} aria-hidden />
              <span className="min-w-0 flex-1">{itemText(t, i, locale)}</span>
              <Btn className="shrink-0 max-md:min-h-11" onClick={() => go(i.go)}>
                {goLabel(t, i)}
              </Btn>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
