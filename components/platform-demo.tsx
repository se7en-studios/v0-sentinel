"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import {
  Flame,
  Radar,
  Satellite,
  BellRing,
  MessageCircle,
  MonitorSmartphone,
  Users,
} from "lucide-react";
import { CLAIMS } from "@/lib/claims";

const STEP_MS = 6000;

// `focus` encuadra la captura (origen + escala); `ring` es dónde queda el punto
// de interés DESPUÉS del zoom: origen + escala × (punto − origen), en % del marco.
const STEPS = [
  {
    icon: Flame,
    label: "Detectar",
    title: "Anomalías térmicas desde órbita",
    desc: `Leemos ${CLAIMS.satellites} y marcamos cada punto caliente nuevo sobre el territorio.`,
    focus: { x: 75, y: 15, scale: 1.5 },
    ring: { x: 85.5, y: 19.5, fire: true },
    is3d: false,
  },
  {
    icon: Radar,
    label: "Verificar",
    title: "La IA descarta lo que no es fuego",
    desc: `Chimeneas, reflejos y nubes calientes se filtran antes de molestar a nadie. Precisión objetivo: ${CLAIMS.accuracyPct}%.`,
    focus: { x: 100, y: 50, scale: 2.2 },
    ring: { x: 65, y: 38, fire: false },
    is3d: false,
  },
  {
    icon: Satellite,
    label: "Contextualizar",
    title: "Viento, pendiente y combustible",
    desc: "Cruzamos el foco con clima, relieve y vegetación para estimar hacia dónde avanza y qué tiene cerca.",
    focus: { x: 40, y: 55, scale: 1.15 },
    ring: { x: 53, y: 43.5, fire: false },
    is3d: true,
  },
  {
    icon: BellRing,
    label: "Alertar",
    title: "A quien tiene que actuar",
    desc: `Notificación geolocalizada por WhatsApp y consola web. Objetivo de detección: ${CLAIMS.detectionMinutes} minutos.`,
    focus: { x: 60, y: 100, scale: 1.9 },
    ring: { x: 79, y: 82, fire: true },
    is3d: false,
  },
] as const;

const RECIPIENTS = [
  { icon: MessageCircle, name: "Brigada local", via: "WhatsApp" },
  { icon: MonitorSmartphone, name: "Defensa Civil", via: "Consola web" },
  { icon: Users, name: "Propietario del Lote 14", via: "WhatsApp" },
];

function Details({ step }: { step: number }) {
  if (step === 0) {
    return (
      <>
        <p className="t-label text-ember">Anomalía térmica · VIIRS</p>
        <p className="t-small mt-2">
          Pasada 14:32 · potencia radiativa alta · pendiente de verificar
        </p>
      </>
    );
  }
  if (step === 1) {
    return (
      <ul className="t-small space-y-1">
        <li>Fuera de zonas industriales conocidas</li>
        <li>Persiste en dos pasadas consecutivas</li>
        <li className="font-semibold text-leaf-bright">
          Resultado: foco confirmado
        </li>
      </ul>
    );
  }
  if (step === 2) {
    return (
      <p className="t-small">
        Pendiente 18 % hacia el Lote 14 · viento 28 km/h del oeste · vegetación
        seca. Riesgo de propagación alto.
      </p>
    );
  }
  return (
    <>
      <p className="font-semibold leading-snug text-ember">
        Foco confirmado a 3,2 km del Lote 14
      </p>
      <p className="t-small mt-1">
        Viento 28 km/h del oeste · riesgo de propagación alto
      </p>
      <ul className="mt-3 space-y-2">
        {RECIPIENTS.map(({ icon: Icon, name, via }) => (
          <li key={name} className="t-small flex items-center gap-2">
            <Icon className="size-4 shrink-0 text-leaf-bright" aria-hidden />
            <span>{name}</span>
            <span className="opacity-70">· {via}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

export function PlatformDemo() {
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const id = setInterval(
      () => setStep((s) => (s + 1) % STEPS.length),
      STEP_MS,
    );
    return () => clearInterval(id);
  }, [auto]);

  const select = (i: number) => {
    setAuto(false);
    setStep(i);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const dir =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? -1
          : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (step + dir + STEPS.length) % STEPS.length;
    select(next);
    document.getElementById(`pd-tab-${next}`)?.focus();
  };

  const { focus, ring, is3d } = STEPS[step];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:items-center lg:gap-10">
      <style>{`@keyframes pd-fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}`}</style>

      <figure className="relative lg:-ml-6 xl:-ml-16">
        <div
          role="tabpanel"
          id="pd-panel"
          aria-labelledby={`pd-tab-${step}`}
          className="browser-frame glow-leaf"
        >
          <div className="relative aspect-[16/10] bg-ash">
            <div
              className="absolute inset-0 transition-transform duration-[1400ms] ease-[cubic-bezier(.22,.8,.24,1)] motion-reduce:transition-none md:[transform:scale(var(--s))]"
              style={
                {
                  transformOrigin: `${focus.x}% ${focus.y}%`,
                  "--s": focus.scale,
                } as React.CSSProperties
              }
            >
              <Image
                src="/product/panel-2d.webp"
                alt="Panel de Sentinel en vista 2D: mapa satelital de la Patagonia con focos, capas de detección, línea de tiempo y eventos clave"
                fill
                sizes="(min-width: 1024px) 1400px, 100vw"
                className={`object-cover transition-opacity duration-700 ${is3d ? "opacity-0" : "opacity-100"}`}
              />
              <Image
                src="/product/panel-3d.webp"
                alt=""
                aria-hidden
                fill
                sizes="(min-width: 1024px) 1400px, 100vw"
                className={`object-cover transition-opacity duration-700 ${is3d ? "opacity-100" : "opacity-0"}`}
              />
            </div>
            <span
              aria-hidden
              className="pointer-events-none absolute z-10 hidden size-14 -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-[1400ms] ease-[cubic-bezier(.22,.8,.24,1)] motion-reduce:transition-none md:block md:size-20"
              style={{ left: `${ring.x}%`, top: `${ring.y}%` }}
            >
              <span
                className={`absolute inset-0 rounded-full border-2 ${ring.fire ? "border-ember" : "border-leaf-bright"}`}
              />
              <span
                className={`absolute inset-0 animate-ping rounded-full border ${ring.fire ? "border-ember" : "border-leaf-bright"} motion-reduce:hidden`}
              />
              <span
                className={`absolute left-1/2 top-[-18%] h-[136%] w-px ${ring.fire ? "bg-ember" : "bg-leaf-bright"} opacity-70`}
              />
              <span
                className={`absolute top-1/2 left-[-18%] h-px w-[136%] ${ring.fire ? "bg-ember" : "bg-leaf-bright"} opacity-70`}
              />
            </span>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-linear-to-t from-charcoal/40 via-transparent to-charcoal/10"
            />
          </div>
        </div>

        <div
          aria-live="polite"
          className="glass bg-charcoal/85! mt-3 rounded-xl p-4 text-[#f4efe2] md:absolute md:right-4 md:bottom-4 md:mt-0 md:w-80 md:rounded-[20px] md:p-5 lg:-right-10 lg:-bottom-8"
        >
          <p className="t-label mb-3 inline-block rounded-full border border-white/25 px-2 py-0.5 opacity-90">
            Ejemplo
          </p>
          <Details step={step} />
        </div>

        <figcaption className="t-small mt-4 max-w-md opacity-70 md:mt-6 lg:mt-8">
          Captura del panel de Sentinel (datos satelitales reales). Las tarjetas
          sobre la imagen son ejemplos ilustrativos.
        </figcaption>
      </figure>

      <div>
        <div
          role="tablist"
          aria-label="Flujo de Sentinel"
          aria-orientation="vertical"
          onKeyDown={onKeyDown}
          className="-mx-5 flex snap-x gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
        >
          {STEPS.map(({ icon: Icon, label, title, desc }, i) => {
            const active = i === step;
            return (
              <button
                key={label}
                type="button"
                role="tab"
                id={`pd-tab-${i}`}
                aria-selected={active}
                aria-controls="pd-panel"
                tabIndex={active ? 0 : -1}
                onClick={() => select(i)}
                className={`relative shrink-0 snap-start overflow-hidden rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-bright lg:w-full lg:py-4 ${
                  active
                    ? "border-leaf-bright/50 bg-white/[0.07]"
                    : "border-white/10 hover:border-white/25"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="t-label text-leaf-bright">0{i + 1}</span>
                  <Icon className="size-4 opacity-80" aria-hidden />
                  <span className="t-h3">{label}</span>
                </span>
                {active && (
                  <span className="mt-3 hidden lg:block">
                    <span className="t-body block font-medium">{title}</span>
                    <span className="t-small mt-1 block opacity-80">
                      {desc}
                    </span>
                  </span>
                )}
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-white/10"
                >
                  {active && (
                    <span
                      className="block h-full origin-left bg-leaf-bright motion-reduce:!animate-none"
                      style={{
                        animation: auto
                          ? `pd-fill ${STEP_MS}ms linear forwards`
                          : undefined,
                      }}
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-4 lg:hidden">
          <p className="t-body font-medium">{STEPS[step].title}</p>
          <p className="t-small mt-1 opacity-80">{STEPS[step].desc}</p>
        </div>
      </div>
    </div>
  );
}
