"use client";

import { useState } from "react";
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

const STEPS = [
  {
    icon: Flame,
    label: "Detectar",
    title: "Anomalías térmicas desde órbita",
    desc: `Leemos ${CLAIMS.satellites} y marcamos cada punto caliente nuevo sobre el territorio.`,
  },
  {
    icon: Radar,
    label: "Verificar",
    title: "La IA descarta lo que no es fuego",
    desc: `Chimeneas, reflejos y nubes calientes se filtran antes de molestar a nadie. Precisión objetivo: ${CLAIMS.accuracyPct}%.`,
  },
  {
    icon: Satellite,
    label: "Contextualizar",
    title: "Viento, pendiente y combustible",
    desc: "Cruzamos el foco con clima, relieve y vegetación para estimar hacia dónde avanza y qué tiene cerca.",
  },
  {
    icon: BellRing,
    label: "Alertar",
    title: "A quien tiene que actuar",
    desc: `Notificación geolocalizada por WhatsApp y consola web. Objetivo de detección: ${CLAIMS.detectionMinutes} minutos.`,
  },
] as const;

const RECIPIENTS = [
  { icon: MessageCircle, name: "Brigada local", via: "WhatsApp" },
  { icon: MonitorSmartphone, name: "Defensa Civil", via: "Consola web" },
  { icon: Users, name: "Propietario del Lote 14", via: "WhatsApp" },
];

function DemoMap({ step }: { step: number }) {
  return (
    <svg
      viewBox="0 0 400 240"
      role="img"
      aria-label="Mapa de ejemplo con un foco de incendio y el Lote 14"
      className="h-auto w-full"
    >
      <defs>
        <pattern
          id="pd-grid"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M40 0H0V40"
            fill="none"
            stroke="#f4efe2"
            strokeOpacity="0.1"
          />
        </pattern>
      </defs>
      <rect width="400" height="240" fill="#14130f" />
      <rect width="400" height="240" fill="url(#pd-grid)" />
      <g fill="none" stroke="#4ade80" strokeOpacity="0.35">
        <path d="M0 190C80 170 130 200 210 175S340 140 400 160" />
        <path d="M0 150C90 120 150 160 230 130S350 90 400 110" />
        <path d="M0 105C100 70 170 110 250 80S350 45 400 60" />
      </g>
      <polygon
        points="70,150 135,140 150,190 80,200"
        fill="#4ade80"
        fillOpacity="0.15"
        stroke="#4ade80"
        strokeWidth="1.5"
      />
      <text x="82" y="224" fill="#f4efe2" fillOpacity="0.85" fontSize="14">
        Lote 14
      </text>
      {step >= 2 && (
        <>
          <path
            d="M275 90C245 100 215 125 180 150C160 168 150 170 150 170"
            fill="none"
            stroke="#f4efe2"
            strokeOpacity="0.7"
            strokeDasharray="5 5"
          />
          <text x="195" y="120" fill="#f4efe2" fontSize="14">
            3,2 km
          </text>
          <path
            d="M275 90 L335 60 L355 100 L330 130 Z"
            fill="#ff5a36"
            fillOpacity="0.18"
            stroke="#ff5a36"
            strokeOpacity="0.6"
            strokeDasharray="4 4"
          />
          <path
            d="M300 215H350M350 215l-9-6m9 6l-9 6"
            stroke="#f4efe2"
            strokeWidth="1.5"
            fill="none"
          />
          <text x="296" y="200" fill="#f4efe2" fillOpacity="0.85" fontSize="14">
            Viento NE
          </text>
        </>
      )}
      {step >= 1 && (
        <circle
          cx="275"
          cy="90"
          r="16"
          fill="none"
          stroke="#ff5a36"
          strokeWidth="1.5"
        />
      )}
      <circle cx="275" cy="90" r="6" fill="#ff5a36" />
      <circle
        cx="275"
        cy="90"
        r="6"
        fill="#ff5a36"
        className="animate-ping motion-reduce:hidden"
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      />
    </svg>
  );
}

function Details({ step }: { step: number }) {
  if (step === 0) {
    return (
      <p className="t-small">
        <span className="t-label text-ember">Anomalía térmica</span>
        <br />
        VIIRS, pasada 14:32 · potencia radiativa alta · pendiente de verificar
      </p>
    );
  }
  if (step === 1) {
    return (
      <ul className="t-small space-y-1">
        <li>Fuera de zonas industriales conocidas</li>
        <li>Persiste en dos pasadas consecutivas</li>
        <li className="text-leaf-bright">Resultado: foco confirmado</li>
      </ul>
    );
  }
  if (step === 2) {
    return (
      <p className="t-small">
        Pendiente 18 % hacia el Lote 14 · viento NE 28 km/h · vegetación seca.
        Propagación estimada hacia el sudoeste.
      </p>
    );
  }
  return (
    <div>
      <p className="font-semibold text-ember">
        Foco confirmado a 3,2 km del Lote 14
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
    </div>
  );
}

export function PlatformDemo() {
  const [step, setStep] = useState(0);
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
      <ol className="space-y-2" aria-label="Flujo de Sentinel">
        {STEPS.map(({ icon: Icon, label, title, desc }, i) => {
          const active = i === step;
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => setStep(i)}
                aria-current={active ? "step" : undefined}
                className={`w-full rounded-xl border px-4 py-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-bright ${
                  active
                    ? "border-leaf-bright/50 bg-white/[0.06]"
                    : "border-white/10 hover:border-white/25"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="t-label text-leaf-bright">0{i + 1}</span>
                  <Icon className="size-4 opacity-80" aria-hidden />
                  <span className="t-h3">{label}</span>
                </span>
                {active && (
                  <span className="mt-3 block">
                    <span className="t-body block font-medium">{title}</span>
                    <span className="t-small mt-1 block opacity-80">
                      {desc}
                    </span>
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>

      <figure className="overflow-hidden rounded-2xl border border-white/10 bg-ash">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
          <span className="t-label opacity-80">Panel Sentinel</span>
          <span className="t-label rounded-full border border-ember/60 px-2 py-0.5 text-ember">
            Datos de ejemplo
          </span>
        </div>
        <DemoMap step={step} />
        <figcaption className="border-t border-white/10 p-4" aria-live="polite">
          <Details step={step} />
        </figcaption>
      </figure>
    </div>
  );
}
