"use client";

import { useRef, useState } from "react";
import { CLAIMS } from "@/lib/claims";

type Row = [label: string, value: string];
type Alert = {
  id: string;
  tab: string;
  title: string;
  rows: Row[];
  ask: string;
  reply: string;
};

// Datos ilustrativos: paraje, coordenadas, viento y rutas son inventados a propósito.
const ALERTS: Alert[] = [
  {
    id: "municipio",
    tab: "Municipio",
    title: "Foco verificado · Alerta de ejemplo",
    rows: [
      ["Ubicación", "Paraje Ejemplo, -41.352 / -71.518"],
      ["Viento", "NO 28 km/h, ráfagas de 45"],
      ["Acceso", "Camino vecinal desde la ruta principal, 6 km de ripio"],
      ["Propagación", "Hacia el SE, riesgo alto en las próximas 2 h"],
      ["Detección", `Objetivo: ${CLAIMS.detectionMinutes} min`],
    ],
    ask: "Ya está en la consola del municipio. ¿Activamos el protocolo?",
    reply: "Confirmado. Activamos el protocolo.",
  },
  {
    id: "brigada",
    tab: "Brigada",
    title: "Salida sugerida · Alerta de ejemplo",
    rows: [
      ["Coordenadas", "-41.352 / -71.518"],
      ["Viento", "NO 28 km/h, empuja hacia el SE"],
      ["Acceso", "Camino vecinal; el último tramo, 800 m a pie"],
      ["Agua", "Arroyo a 1,2 km del frente"],
      ["Detección", `Objetivo: ${CLAIMS.detectionMinutes} min`],
    ],
    ask: "¿Podés salir al punto? Confirmá y el panel registra el despacho.",
    reply: "Recibido. Salimos al punto.",
  },
  {
    id: "campo",
    tab: "Campo",
    title: "Foco cerca de tu lote · Alerta de ejemplo",
    rows: [
      ["Distancia", "A 9 km del Lote 14"],
      ["Viento", "Del NO, hacia tu lote"],
      ["Propagación", "Podría llegar en unas 3 h si no se contiene"],
      ["Salida", "Portón sur y camino interno"],
      ["Detección", `Objetivo: ${CLAIMS.detectionMinutes} min`],
    ],
    ask: "Avisá a tu personal. Guardamos este evento en tu historial.",
    reply: "Recibido. Avisamos al personal.",
  },
];

export function AlertPhone() {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const alert = ALERTS[active];

  const onKey = (e: React.KeyboardEvent) => {
    const last = ALERTS.length - 1;
    const next =
      e.key === "ArrowRight"
        ? active === last
          ? 0
          : active + 1
        : e.key === "ArrowLeft"
          ? active === 0
            ? last
            : active - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : -1;
    if (next < 0) return;
    e.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="mx-auto w-full max-w-[20rem]">
      <div
        role="tablist"
        aria-label="Quién recibe la alerta"
        onKeyDown={onKey}
        className="mb-4 flex border-b rule"
      >
        {ALERTS.map((a, i) => (
          <button
            key={a.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            id={`ap-tab-${a.id}`}
            role="tab"
            type="button"
            aria-selected={i === active}
            aria-controls="ap-panel"
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            className={`-mb-px min-h-11 flex-1 border-b-2 px-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
              i === active
                ? "border-brand text-brand"
                : "border-transparent text-ink/70 hover:text-ink"
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
        className="rounded-lg border border-ink/40 bg-ink p-2"
      >
        <div className="overflow-hidden rounded-[4px] bg-[#efeae2]">
          <div className="flex items-center gap-3 bg-[#f0f2f5] px-4 py-3">
            <span
              aria-hidden
              className="grid size-8 place-items-center rounded-full bg-brand font-serif text-base text-white"
            >
              S
            </span>
            <p className="text-sm font-semibold text-[#111b21]">
              Sentinel Alertas
            </p>
          </div>

          <div
            role="log"
            aria-label={`Ejemplo de alerta para ${alert.tab.toLowerCase()}`}
            className="flex min-h-[25rem] flex-col gap-2 px-3 py-4 text-[#111b21]"
          >
            <div className="max-w-[92%] self-start rounded-lg rounded-tl-none bg-white px-3 pb-1.5 pt-2.5 shadow-[0_1px_0_rgb(0_0_0/0.12)]">
              <p className="text-sm font-semibold">{alert.title}</p>
              <dl className="mt-2 space-y-1.5 text-[13px] leading-snug">
                {alert.rows.map(([k, v]) => (
                  <div key={k}>
                    <dt className="inline text-[#54656f]">{k}: </dt>
                    <dd className="inline">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-1.5 text-right text-xs text-[#54656f]">14:32</p>
            </div>
            <div className="max-w-[92%] self-start rounded-lg rounded-tl-none bg-white px-3 pb-1.5 pt-2.5 shadow-[0_1px_0_rgb(0_0_0/0.12)]">
              <p className="text-sm">{alert.ask}</p>
              <p className="mt-1 text-right text-xs text-[#54656f]">14:32</p>
            </div>
            <div className="max-w-[85%] self-end rounded-lg rounded-tr-none bg-[#d9fdd3] px-3 pb-1.5 pt-2 text-sm shadow-[0_1px_0_rgb(0_0_0/0.12)]">
              {alert.reply}
              <p className="mt-0.5 text-right text-xs text-[#54656f]">14:33</p>
            </div>
          </div>
        </div>
      </div>

      <p className="t-caption mt-3">
        Ejemplo de alerta con datos ilustrativos; el tiempo de detección es un
        objetivo.
      </p>
    </div>
  );
}
