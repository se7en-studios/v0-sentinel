"use client";

import { useRef, useState } from "react";
import { CLAIMS } from "@/lib/claims";

type Alert = {
  id: string;
  tab: string;
  title: string;
  rows: [label: string, value: string][];
  ask: string;
};

// Datos ilustrativos: paraje, coordenadas, viento y rutas son inventados a propósito.
const ALERTS: Alert[] = [
  {
    id: "municipio",
    tab: "Municipio",
    title: "Foco verificado · alerta de ejemplo",
    rows: [
      ["Ubicación", "Paraje Ejemplo, -41.352 / -71.518"],
      ["Viento", "NO 28 km/h, ráfagas de 45"],
      ["Acceso", "Camino vecinal desde la ruta, 6 km de ripio"],
      ["Propagación", "Hacia el SE, riesgo alto en las próximas 2 h"],
    ],
    ask: "Ya está en la consola del municipio. ¿Activamos el protocolo?",
  },
  {
    id: "brigada",
    tab: "Brigada",
    title: "Salida sugerida · alerta de ejemplo",
    rows: [
      ["Coordenadas", "-41.352 / -71.518"],
      ["Viento", "NO 28 km/h, empuja hacia el SE"],
      ["Acceso", "Camino vecinal; el último tramo, 800 m a pie"],
      ["Agua", "Arroyo a 1,2 km del frente"],
    ],
    ask: "¿Podés salir al punto? Confirmá y el panel registra el despacho.",
  },
  {
    id: "campo",
    tab: "Campo",
    title: "Foco cerca de tu lote · alerta de ejemplo",
    rows: [
      ["Distancia", "A 9 km del Lote 14"],
      ["Viento", "Del NO, hacia tu lote"],
      ["Propagación", "Podría llegar en unas 3 h si no se contiene"],
      ["Salida", "Portón sur y camino interno"],
    ],
    ask: "Avisá a tu personal. Guardamos este evento en tu historial.",
  },
];

export function AlertPhone({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const light = tone === "light";
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const alert = ALERTS[active];

  const onKey = (e: React.KeyboardEvent) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (active + step + ALERTS.length) % ALERTS.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <div className="mx-auto w-full max-w-[22rem]">
      <div
        role="tablist"
        aria-label="Quién recibe la alerta"
        onKeyDown={onKey}
        className={`mb-5 flex rounded-full border p-1 ${light ? "border-[#14231c]/30" : "border-a-line"}`}
      >
        {ALERTS.map((a, i) => (
          <button
            key={a.id}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            id={`ap-tab-${a.id}`}
            role="tab"
            type="button"
            aria-selected={i === active}
            aria-controls="ap-panel"
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            className={`min-h-11 flex-1 rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${light ? "focus-visible:outline-[#14231c]" : "focus-visible:outline-[#a9efc9]"} ${
              i === active
                ? light
                  ? "bg-[#14231c] text-white"
                  : "bg-a-accent text-[#06150d]"
                : light
                  ? "text-[#4b5750] hover:text-[#131a16]"
                  : "text-a-mute hover:text-white"
            }`}
          >
            {a.tab}
          </button>
        ))}
      </div>

      <div
        id="ap-panel"
        role="tabpanel"
        aria-labelledby={`ap-tab-${alert.id}`}
        className="overflow-hidden rounded-3xl border border-a-line bg-[#0b141a]"
      >
        <div className="bg-[#1f2c34] px-4 py-3">
          <p className="text-sm font-semibold text-[#e9edef]">
            Sentinel Alertas
          </p>
          <p className="text-xs text-[#8696a0]">cuenta de ejemplo</p>
        </div>
        <div className="flex flex-col gap-2 px-3 py-4">
          <div className="max-w-[92%] self-start rounded-xl rounded-tl-sm bg-[#202c33] px-3 py-2.5 text-[#e9edef]">
            <p className="text-sm font-semibold">{alert.title}</p>
            <dl className="mt-2 space-y-1.5 text-[13px] leading-snug">
              {alert.rows.map(([k, v]) => (
                <div key={k}>
                  <dt className="inline text-[#8696a0]">{k}: </dt>
                  <dd className="inline">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="max-w-[92%] self-start rounded-xl rounded-tl-sm bg-[#202c33] px-3 py-2.5 text-sm text-[#e9edef]">
            {alert.ask}
          </div>
        </div>
      </div>
      <p
        className={`mt-4 text-center text-xs ${light ? "text-[#4b5750]" : "text-a-faint"}`}
      >
        Ejemplo de alerta con datos ilustrativos; el tiempo de detección es un
        objetivo de {CLAIMS.detectionMinutes} minutos.
      </p>
    </div>
  );
}
