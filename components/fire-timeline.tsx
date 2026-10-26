"use client";

import { useEffect, useRef } from "react";
import { Chapter, Eyebrow } from "@/components/ui/chapter";
import { CLAIMS } from "@/lib/claims";

const AXIS_MIN = 60;

type Step = { at: number; label: string };

// Ejemplo ilustrativo: los minutos de "Sin Sentinel" son un caso típico, no una medición.
// El aviso de "Con Sentinel" usa el objetivo de detección de CLAIMS.
const SCENARIOS = [
  {
    name: "Sin Sentinel",
    summary: "Alguien ve la columna de humo y llama.",
    fill: "bg-ember",
    dot: "bg-ember",
    steps: [
      { at: 0, label: "Chispa" },
      { at: 20, label: "Humo visible" },
      { at: 35, label: "Alerta" },
      { at: 50, label: "Respuesta" },
    ] as Step[],
  },
  {
    name: "Con Sentinel",
    summary: "El satélite ve el calor antes que el humo.",
    fill: "bg-leaf",
    dot: "bg-leaf",
    steps: [
      { at: 0, label: "Chispa" },
      { at: CLAIMS.detectionMinutes, label: "Alerta" },
      { at: 15, label: "Respuesta" },
      { at: 20, label: "Humo visible" },
    ] as Step[],
  },
];

function alertAt(steps: Step[]) {
  return steps.find((s) => s.label === "Alerta")?.at ?? 0;
}

export function FireTimeline() {
  const ref = useRef<HTMLDivElement>(null);

  // Una sola observación: arma las barras en 0 y las suelta al entrar en pantalla.
  // Con reduced-motion no se arma, así que queda la versión estática.
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.dataset.state = "armed";
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.dataset.state = "in";
        io.disconnect();
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="group">
      <Chapter id="linea-de-tiempo" tone="light">
        <Eyebrow>Cada minuto cuenta</Eyebrow>
        <h2 className="t-h2 max-w-3xl text-balance">La diferencia son los primeros minutos.</h2>
        <p className="t-lead mt-5 max-w-2xl opacity-80">
          Mismo incendio, dos relojes. Con aviso temprano, la respuesta llega antes de que el humo se vea.
        </p>

        <div className="mt-12 grid gap-12 md:mt-16 md:gap-14">
          {SCENARIOS.map((s) => {
            const alert = alertAt(s.steps);
            return (
              <div key={s.name}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="t-h3">{s.name}</h3>
                  <p className="t-small opacity-70">{s.summary}</p>
                </div>
                <div className="relative mt-5 h-3 rounded-full bg-foreground/10" aria-hidden>
                  <div
                    className={`absolute inset-y-0 left-0 origin-left rounded-full ${s.fill} transition-transform duration-[1400ms] ease-out group-data-[state=armed]:scale-x-0 group-data-[state=in]:scale-x-100 motion-reduce:transition-none`}
                    style={{ width: `${(alert / AXIS_MIN) * 100}%` }}
                  />
                  {s.steps.map((st) => (
                    <span
                      key={st.label}
                      className={`absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background ${s.dot}`}
                      style={{ left: `${(st.at / AXIS_MIN) * 100}%` }}
                    />
                  ))}
                </div>
                <ol className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-4">
                  {s.steps.map((st) => (
                    <li key={st.label}>
                      <span className="t-h3 block tabular-nums">{st.at} min</span>
                      <span className="t-small opacity-80">{st.label}</span>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>
        <p className="t-label mt-10 opacity-70">
          Ejemplo ilustrativo · el tiempo de alerta con Sentinel es un objetivo, no un resultado medido
        </p>
      </Chapter>
    </div>
  );
}
