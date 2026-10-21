"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MODE_ROLE } from "@/lib/admin/types";
import type { useAdmin } from "./use-admin";

type A = ReturnType<typeof useAdmin>;

interface Step {
  title: string;
  text: (a: A) => string;
  run: (a: A) => void;
}

const STEP_MS = 8000;

const STEPS: Step[] = [
  {
    title: "Satélite en vivo",
    text: (a) =>
      `${a.fires.length.toLocaleString("es-AR")} detecciones térmicas reales de NASA en los últimos 10 días, actualizadas solas.`,
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
    title: "El foco más intenso",
    text: (a) => {
      const top = a.fires.reduce((m, p) => (p[2] > m ? p[2] : m), 0);
      return top
        ? `Foco de ${Math.round(top)} MW de potencia radiativa. En 3D la columna de humo sigue el viento real.`
        : "En 3D cada foco levanta una columna de humo que sigue el viento real.";
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
    title: "Tus zonas, con medidas exactas",
    text: () =>
      "Polígonos, mano alzada, círculos por radio y cortafuegos, con superficie y longitud reales.",
    run: (a) => {
      a.goTab("zonas");
      const zone = a.ws.features.find(
        (f) => MODE_ROLE[String(f.properties.mode)] === "zone",
      );
      if (zone) a.mapRef.current?.fitFeature(zone);
    },
  },
  {
    title: "Drones y sensores",
    text: () =>
      "Flota con cámara térmica, telemetría y ruta crítica sobre el perímetro. Simulado en esta demo.",
    run: (a) => {
      a.goTab("drones");
      a.ctx.setView("3d");
    },
  },
  {
    title: "Respuesta coordinada",
    text: () =>
      "Brigadas, autobombas y aviones hidrantes con ETA sobre cada alerta. Simulado en esta demo.",
    run: (a) => {
      a.goTab("recursos");
      a.ctx.setView("2d");
    },
  },
  {
    title: "Métricas y reportes",
    text: () =>
      "Superficie, potencia radiativa y riesgo por zona, listos para exportar en PDF o CSV.",
    run: (a) => a.goTab("metricas"),
  },
  {
    title: "Un solo panel",
    text: () =>
      "Sentinel Cloud: vigilancia satelital para tu campo o forestación.",
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
  const [playing, setPlaying] = useState(
    () =>
      typeof window === "undefined" ||
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const latest = useRef(a);
  latest.current = a;
  const { setTour } = a;
  const last = STEPS.length - 1;

  useEffect(() => {
    STEPS[i].run(latest.current);
  }, [i]);

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
      role="dialog"
      aria-label="Recorrido guiado"
      aria-live="polite"
      className="glass fixed inset-x-3 bottom-4 z-40 mx-auto w-auto max-w-md rounded-2xl border border-[var(--hairline)] p-4 shadow-[var(--shadow-2)] sm:bottom-6"
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
        {i + 1} de {STEPS.length}
      </p>
      <h2 className="mt-0.5 text-[15px] font-semibold leading-tight">
        {step.title}
      </h2>
      <p className="mt-1 text-[12.5px] leading-snug text-foreground/70">
        {step.text(a)}
      </p>
      <div className="mt-3 flex items-center gap-1">
        <button
          type="button"
          onClick={() => setI((n) => Math.max(0, n - 1))}
          disabled={i === 0}
          aria-label="Paso anterior"
          className="grid size-8 place-items-center rounded-lg text-foreground/60 hover:bg-foreground/[0.06] disabled:opacity-30"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pausar" : "Reproducir"}
          className="grid size-8 place-items-center rounded-lg text-foreground/60 hover:bg-foreground/[0.06]"
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
        <button
          type="button"
          onClick={() => setI((n) => Math.min(last, n + 1))}
          disabled={i === last}
          aria-label="Paso siguiente"
          className="grid size-8 place-items-center rounded-lg text-foreground/60 hover:bg-foreground/[0.06] disabled:opacity-30"
        >
          <ChevronRight className="size-4" />
        </button>
        <button
          type="button"
          onClick={close}
          className="ml-auto flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium text-foreground/60 hover:bg-foreground/[0.06]"
        >
          <X className="size-3.5" /> {i === last ? "Terminar" : "Salir"}
        </button>
      </div>
    </section>
  );
}
