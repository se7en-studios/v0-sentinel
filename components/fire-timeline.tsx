"use client";

import { useEffect, useRef } from "react";
import {
  BellRing,
  CloudFog,
  Flame,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Chapter, Eyebrow } from "@/components/ui/chapter";
import { CLAIMS } from "@/lib/claims";

const AXIS_MIN = 60;
const MS_PER_MIN = 45; // misma velocidad en ambos carriles: lo que llega antes, anima antes.
const TICKS = [0, 10, 20, 30, 40, 50, 60];

type Kind = "spark" | "smoke" | "alert" | "response";
type Step = { at: number; label: string; kind: Kind; lit: boolean };

const ICONS: Record<Kind, LucideIcon> = {
  spark: Flame,
  smoke: CloudFog,
  alert: BellRing,
  response: ShieldCheck,
};

// Ejemplo ilustrativo: los minutos de "Sin Sentinel" son un caso típico, no una medición.
// El aviso de "Con Sentinel" usa el objetivo de detección de CLAIMS.
const WITH: Step[] = [
  { at: 0, label: "Chispa", kind: "spark", lit: true },
  {
    at: CLAIMS.detectionMinutes,
    label: "Alerta (objetivo)",
    kind: "alert",
    lit: true,
  },
  { at: 15, label: "Respuesta", kind: "response", lit: true },
  { at: 20, label: "Humo visible", kind: "smoke", lit: true },
];
const WITHOUT: Step[] = [
  { at: 0, label: "Chispa", kind: "spark", lit: false },
  { at: 20, label: "Humo visible", kind: "smoke", lit: false },
  { at: 35, label: "Alerta", kind: "alert", lit: true },
  { at: 50, label: "Respuesta", kind: "response", lit: true },
];

const pct = (min: number) => `${(min / AXIS_MIN) * 100}%`;
const alertOf = (steps: Step[]) =>
  steps.find((s) => s.kind === "alert")?.at ?? 0;
const GAP_MIN = alertOf(WITHOUT) - alertOf(WITH);

function Node({ step, withSentinel }: { step: Step; withSentinel: boolean }) {
  const Icon = ICONS[step.kind];
  const tone = withSentinel
    ? "bg-leaf-bright text-charcoal shadow-[0_0_24px_rgb(95_227_161/0.6)]"
    : step.lit
      ? "bg-ember text-charcoal shadow-[0_0_24px_rgb(232_115_42/0.55)]"
      : "bg-[#3a372f] text-[#cfc9b8]";
  const ping = step.kind === "alert" && step.lit;
  return (
    <span
      className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ left: pct(step.at) }}
    >
      <span
        className={`relative flex size-7 items-center justify-center rounded-full ring-2 ring-[#12110e] transition-[transform,opacity] duration-500 group-data-[state=armed]:scale-50 group-data-[state=armed]:opacity-0 motion-reduce:transition-none md:size-10 ${tone}`}
        style={{ transitionDelay: `${step.at * MS_PER_MIN}ms` }}
      >
        {ping ? (
          <span
            aria-hidden
            className={`absolute inset-0 rounded-full opacity-50 motion-safe:animate-ping ${withSentinel ? "bg-leaf-bright" : "bg-ember"}`}
          />
        ) : null}
        <Icon aria-hidden className="relative size-3.5 md:size-5" />
      </span>
    </span>
  );
}

function Lane({
  steps,
  withSentinel,
}: {
  steps: Step[];
  withSentinel: boolean;
}) {
  const end = Math.max(...steps.map((s) => s.at));
  const fill = withSentinel
    ? "bg-gradient-to-r from-leaf to-leaf-bright shadow-[0_0_18px_rgb(95_227_161/0.7)]"
    : "bg-gradient-to-r from-[#5b574b] via-[#8a8473] to-ember";
  return (
    <div className="relative h-12 md:h-14">
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/10"
      />
      <div
        aria-hidden
        className={`absolute left-0 top-1/2 h-1.5 origin-left -translate-y-1/2 rounded-full transition-transform ease-out group-data-[state=armed]:scale-x-0 motion-reduce:transition-none ${fill}`}
        style={{ width: pct(end), transitionDuration: `${end * MS_PER_MIN}ms` }}
      />
      {steps.map((s) => (
        <Node key={s.kind} step={s} withSentinel={withSentinel} />
      ))}
    </div>
  );
}

// Cota entre los dos avisos: la brecha es el mensaje.
function Gap() {
  const from = alertOf(WITH);
  const to = alertOf(WITHOUT);
  return (
    <div aria-hidden className="relative h-20 md:h-16">
      {[from, to].map((m) => (
        <span
          key={m}
          className="absolute inset-y-0 border-l border-dashed border-ember-soft/60"
          style={{ left: pct(m) }}
        />
      ))}
      <span
        className="absolute top-1/2 h-px origin-left bg-ember-soft transition-transform duration-700 group-data-[state=armed]:scale-x-0 motion-reduce:transition-none"
        style={{
          left: pct(from),
          width: `calc(${pct(to)} - ${pct(from)})`,
          transitionDelay: `${to * MS_PER_MIN}ms`,
        }}
      />
      <span
        className="glass absolute top-1/2 w-max max-w-[11.5rem] -translate-x-1/2 -translate-y-1/2 rounded-xl px-3 py-2 text-center text-[#f4efe2] transition-opacity duration-700 group-data-[state=armed]:opacity-0 motion-reduce:transition-none md:max-w-none"
        style={{
          left: `calc((${pct(from)} + ${pct(to)}) / 2)`,
          transitionDelay: `${to * MS_PER_MIN}ms`,
        }}
      >
        <span className="block text-sm font-semibold leading-tight text-ember-soft">
          Minutos que cambian el resultado
        </span>
        <span className="t-label block text-[#f4efe2]/80">
          ≈ {GAP_MIN} min · ejemplo
        </span>
      </span>
    </div>
  );
}

function Legend({
  name,
  summary,
  steps,
  withSentinel,
}: {
  name: string;
  summary: string;
  steps: Step[];
  withSentinel: boolean;
}) {
  return (
    <div>
      <h3 className="t-h3 flex items-center gap-2.5">
        <span
          aria-hidden
          className={`size-2.5 rounded-full ${withSentinel ? "bg-leaf-bright" : "bg-ember"}`}
        />
        {name}
      </h3>
      <p className="t-small mt-1 text-[#f4efe2]/75">{summary}</p>
      <ol className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        {steps.map((st) => {
          const Icon = ICONS[st.kind];
          return (
            <li key={st.kind} className="flex items-start gap-2.5">
              <Icon
                aria-hidden
                className={`mt-1 size-4 shrink-0 ${withSentinel ? "text-leaf-bright" : st.lit ? "text-ember" : "text-[#a8a290]"}`}
              />
              <span>
                <span className="block text-lg font-semibold leading-tight tabular-nums">
                  {st.at} min
                </span>
                <span className="t-small text-[#f4efe2]/80">{st.label}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function FireTimeline() {
  const ref = useRef<HTMLDivElement>(null);

  // Una sola observación: arma el diagrama en reposo y lo suelta al entrar en pantalla
  // (solo transform/opacity). Con reduced-motion no se arma: queda la versión estática.
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
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
        <h2 className="t-h2 max-w-3xl text-balance">
          La diferencia son los primeros minutos.
        </h2>
        <p className="t-lead mt-5 max-w-2xl opacity-80">
          Mismo incendio, dos relojes. Con aviso temprano, la respuesta llega
          antes de que el humo se vea.
        </p>

        <div className="relative mt-12 overflow-hidden rounded-[20px] border border-white/10 bg-gradient-to-br from-[#26241f] via-[#1a1814] to-[#12110e] p-5 text-[#f4efe2] shadow-[0_40px_90px_-40px_rgb(18_17_14/0.7)] md:mt-16 md:p-10">
          <div
            aria-hidden
            className="bg-noise pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-leaf/25 blur-3xl"
          />

          <div className="relative px-3.5 md:px-5">
            <p className="t-label mb-1 text-leaf-bright">Con Sentinel</p>
            <Lane steps={WITH} withSentinel />
            <Gap />
            <p className="t-label mb-1 text-ember-soft">Sin Sentinel</p>
            <Lane steps={WITHOUT} withSentinel={false} />
            <div
              aria-hidden
              className="relative mt-2 h-5 border-t border-white/10"
            >
              {TICKS.map((t) => (
                <span
                  key={t}
                  className={`t-label absolute top-1.5 -translate-x-1/2 whitespace-nowrap text-[#f4efe2]/70 ${t % 20 !== 0 ? "hidden sm:block" : ""}`}
                  style={{ left: pct(t) }}
                >
                  {t === AXIS_MIN ? `${t} min` : t}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mt-12 grid gap-8 border-t border-white/10 pt-8 md:grid-cols-2 md:gap-12">
            <Legend
              name="Con Sentinel"
              summary="El satélite ve el calor antes que el humo."
              steps={WITH}
              withSentinel
            />
            <Legend
              name="Sin Sentinel"
              summary="Alguien ve la columna de humo y llama."
              steps={WITHOUT}
              withSentinel={false}
            />
          </div>
        </div>
        <p className="t-label mt-6 opacity-70">
          Ejemplo ilustrativo · el tiempo de alerta con Sentinel es un objetivo,
          no un resultado medido
        </p>
      </Chapter>
    </div>
  );
}
