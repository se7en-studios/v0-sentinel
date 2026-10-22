"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NUM_LOCALE } from "@/lib/admin/i18n-shell";
import type { MsgKey, Translate } from "@/lib/admin/i18n";
import { MODE_ROLE } from "@/lib/admin/types";
import type { useAdmin } from "./use-admin";

type A = ReturnType<typeof useAdmin>;

interface Step {
  title: MsgKey;
  text: (a: A, t: Translate) => string;
  run: (a: A) => void;
}

const STEP_MS = 8000;
const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const BTN =
  "grid size-10 place-items-center rounded-lg text-foreground/60 hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-8";

const STEPS: Step[] = [
  {
    title: "tour.s1.title",
    text: (a, t) =>
      t("tour.s1.text", {
        n: a.fires.length.toLocaleString(NUM_LOCALE[a.s.locale]),
      }),
    run: (a) => {
      a.ctx.setOrbit(false);
      a.goTab("general");
      a.ctx.setView("2d");
      a.mapRef.current?.flyTo(
        a.region.center,
        Math.max(5, a.region.zoom - 0.8),
      );
    },
  },
  {
    title: "tour.s2.title",
    text: (a, t) => {
      const top = a.fires.reduce((m, p) => (p[2] > m ? p[2] : m), 0);
      return top
        ? t("tour.s2.text", { mw: Math.round(top) })
        : t("tour.s2.alt");
    },
    run: (a) => {
      const top = a.fires.reduce<(typeof a.fires)[number] | null>(
        (m, p) => (!m || p[2] > m[2] ? p : m),
        null,
      );
      a.ctx.setView("3d");
      a.mapRef.current?.flyTo(top ? [top[1], top[0]] : a.region.center, 11);
    },
  },
  {
    title: "tour.s3.title",
    text: (_a, t) => t("tour.s3.text"),
    run: (a) => {
      a.goTab("zonas");
      const zone = a.ws.features.find(
        (f) => MODE_ROLE[String(f.properties.mode)] === "zone",
      );
      if (zone) a.mapRef.current?.fitFeature(zone);
    },
  },
  {
    title: "tour.s4.title",
    text: (_a, t) => t("tour.s4.text"),
    run: (a) => {
      a.goTab("drones");
      a.ctx.setView("3d");
    },
  },
  {
    title: "tour.s5.title",
    text: (_a, t) => t("tour.s5.text"),
    run: (a) => {
      a.goTab("recursos");
      a.ctx.setView("2d");
    },
  },
  {
    title: "tour.s6.title",
    text: (_a, t) => t("tour.s6.text"),
    run: (a) => a.goTab("metricas"),
  },
  {
    title: "tour.s7.title",
    text: (_a, t) => t("tour.s7.text"),
    run: (a) => {
      a.goTab("general");
      a.ctx.setView("3d");
      a.ctx.setOrbit(true);
    },
  },
];

/** Self-running product tour: moves the real panel between views with a caption. */
export function GuidedTour({ a }: { a: A }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(() => !reducedMotion());
  const root = useRef<HTMLElement>(null);
  const latest = useRef(a);
  latest.current = a;
  const { setTour } = a;
  const last = STEPS.length - 1;
  const t = a.ctx.t;

  useEffect(() => {
    STEPS[i].run(latest.current);
    if (reducedMotion()) latest.current.ctx.setOrbit(false);
  }, [i]);

  // dialog focus: move in on open, give it back to the opener on close
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    // after the palette's own focus-restore has run
    const t = setTimeout(() => root.current?.focus(), 0);
    return () => {
      clearTimeout(t);
      if (prev?.isConnected) prev.focus();
    };
  }, []);

  useEffect(() => {
    if (!playing || i >= last) return;
    const t = setTimeout(() => setI((n) => n + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [i, playing, last]);

  const close = () => {
    latest.current.ctx.setOrbit(false);
    setTour(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("input,textarea,select,[contenteditable],[role=slider]"))
        return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setI((n) => Math.min(last, n + 1));
      if (e.key === "ArrowLeft") setI((n) => Math.max(0, n - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step = STEPS[i];
  return (
    <section
      ref={root}
      tabIndex={-1}
      role="dialog"
      aria-label={t("tour.aria")}
      className="outline-none glass fixed inset-x-3 bottom-4 z-40 mx-auto w-auto max-w-md rounded-2xl border border-[var(--hairline)] p-4 shadow-[var(--shadow-2)] sm:bottom-6"
    >
      <div className="mb-3 flex gap-1" aria-hidden>
        {STEPS.map((s, n) => (
          <span
            key={s.title}
            className="relative h-0.5 flex-1 overflow-hidden rounded-full bg-foreground/12"
          >
            <span
              className={cn(
                "absolute inset-y-0 left-0 bg-[var(--fire)]",
                n < i && "w-full",
                n === i && (playing ? "tour-fill" : "w-full opacity-60"),
              )}
              style={
                n === i && playing
                  ? { animationDuration: `${STEP_MS}ms` }
                  : undefined
              }
            />
          </span>
        ))}
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground/45">
        {t("tour.count", { i: i + 1, n: STEPS.length })}
      </p>
      <div aria-live={playing ? "off" : "polite"}>
        <h2 className="mt-0.5 text-[15px] font-semibold leading-tight">
          {t(step.title)}
        </h2>
        <p className="mt-1 text-[12.5px] leading-snug text-foreground/70">
          {step.text(a, t)}
        </p>
      </div>
      <div className="mt-3 flex items-center gap-1">
        <button
          type="button"
          onClick={() => setI((n) => Math.max(0, n - 1))}
          disabled={i === 0}
          aria-label={t("tour.prev")}
          className={cn(BTN, "disabled:opacity-30")}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? t("tour.pause") : t("tour.play")}
          className={BTN}
        >
          {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
        </button>
        <button
          type="button"
          onClick={() => setI((n) => Math.min(last, n + 1))}
          disabled={i === last}
          aria-label={t("tour.next")}
          className={cn(BTN, "disabled:opacity-30")}
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={close}
          className="ml-auto flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium text-foreground/60 hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-8"
        >
          <X className="size-3.5" aria-hidden /> {i === last ? t("tour.finish") : t("tour.exit")}
        </button>
      </div>
    </section>
  );
}
