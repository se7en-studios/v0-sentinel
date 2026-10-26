"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCheck } from "lucide-react";
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

const STEP_MS = 1000;

export function AlertPhone() {
  const rootRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [run, setRun] = useState(0);
  const [started, setStarted] = useState(false);
  const [reduced, setReduced] = useState(false);
  // 0..2 mensajes entrantes visibles; SSR muestra todo para que el HTML sea completo.
  const [shown, setShown] = useState(2);
  const [typing, setTyping] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const alert = ALERTS[active];

  // Arranca al entrar en vista (o ya, si está a la vista); con reduced-motion queda todo visible.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        setReduced(calm);
        setStarted(!calm);
        io.disconnect();
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let timer = 0;
    const step = (n: number) => {
      setTyping(true);
      timer = window.setTimeout(() => {
        setShown(n);
        if (n < 2) step(n + 1);
        else setTyping(false);
      }, STEP_MS);
    };
    timer = window.setTimeout(() => {
      setShown(0);
      step(1);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [started, active, run]);

  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown, typing, confirmed]);

  const select = (i: number) => {
    setActive(i);
    setConfirmed(false);
    setRun((r) => r + 1);
  };

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
    select(next);
    tabRefs.current[next]?.focus();
  };

  const visible = reduced ? 2 : shown;

  return (
    <div ref={rootRef} className="mx-auto w-full max-w-[21rem]">
      <style>{`
        @keyframes ap-pop{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:none}}
        @keyframes ap-dot{0%,80%,100%{opacity:.35;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
        .ap-pop{animation:ap-pop .35s cubic-bezier(.22,.8,.24,1) both}
        .ap-dot{animation:ap-dot 1s infinite}
        @media (prefers-reduced-motion:reduce){.ap-pop,.ap-dot{animation:none}}
      `}</style>

      <p className="t-label mb-3 text-center text-[#0b6b44]">
        Así te llega la alerta
      </p>
      <div
        role="tablist"
        aria-label="Quién recibe la alerta"
        onKeyDown={onKey}
        className="mb-5 flex rounded-full bg-foreground/8 p-1"
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
            onClick={() => select(i)}
            className={`min-h-11 flex-1 rounded-full px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              i === active
                ? "bg-primary text-white shadow"
                : "text-foreground/75 hover:text-foreground"
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
        className="relative rounded-[2.5rem] border border-foreground/15 bg-[#0b141a] p-2.5 shadow-[0_40px_80px_-30px_rgb(26_24_18/0.65)]"
      >
        <div className="overflow-hidden rounded-[2rem] bg-[#0b141a]">
          <div className="flex items-center gap-3 bg-[#1f2c34] px-4 pb-3 pt-5">
            <span
              aria-hidden
              className="grid size-9 place-items-center rounded-full bg-leaf-bright font-display text-lg text-charcoal"
            >
              S
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#e9edef]">
                Sentinel Alertas
              </p>
              <p className="text-xs text-[#8696a0]">
                {typing && !reduced ? "escribiendo…" : "cuenta de ejemplo"}
              </p>
            </div>
            <span className="rounded-full bg-ember px-2.5 py-1 text-xs font-bold text-charcoal">
              Ejemplo
            </span>
          </div>

          <div
            ref={chatRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-label={`Ejemplo de alerta para ${alert.tab.toLowerCase()}`}
            className="flex h-[27rem] flex-col gap-2 overflow-y-auto bg-[#0b141a] px-3 py-4"
          >
            {visible >= 1 && (
              <div
                className={`${reduced ? "" : "ap-pop"} max-w-[92%] self-start rounded-xl rounded-tl-sm bg-[#202c33] px-3 pb-1.5 pt-2.5 text-[#e9edef]`}
              >
                <p className="text-sm font-semibold">{alert.title}</p>
                <dl className="mt-2 space-y-1.5 text-[13px] leading-snug">
                  {alert.rows.map(([k, v]) => (
                    <div key={k}>
                      <dt className="inline text-[#8696a0]">{k}: </dt>
                      <dd className="inline">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-1.5 text-right text-xs text-[#8696a0]">
                  14:32
                </p>
              </div>
            )}
            {visible >= 2 && (
              <div
                className={`${reduced ? "" : "ap-pop"} max-w-[92%] self-start overflow-hidden rounded-xl rounded-tl-sm bg-[#202c33] text-[#e9edef]`}
              >
                <p className="px-3 pt-2.5 text-sm">{alert.ask}</p>
                <p className="px-3 pb-1.5 text-right text-xs text-[#8696a0]">
                  14:32
                </p>
                <div className="grid border-t border-white/10 text-center text-sm font-semibold">
                  <button
                    type="button"
                    disabled={confirmed}
                    onClick={() => setConfirmed(true)}
                    className="min-h-11 text-[#53bdeb] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#53bdeb] disabled:text-[#8696a0]"
                  >
                    {confirmed ? "Confirmado" : "Confirmar"}
                  </button>
                  <a
                    href="#plataforma"
                    className="flex min-h-11 items-center justify-center border-t border-white/10 text-[#53bdeb] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#53bdeb]"
                  >
                    Ver en el panel
                  </a>
                </div>
              </div>
            )}
            {confirmed && (
              <div
                className={`${reduced ? "" : "ap-pop"} max-w-[85%] self-end rounded-xl rounded-tr-sm bg-[#005c4b] px-3 pb-1.5 pt-2 text-sm text-[#e9edef]`}
              >
                {alert.reply}
                <span className="mt-0.5 flex items-center justify-end gap-1 text-xs text-[#a5c8bf]">
                  14:33
                  <CheckCheck
                    className="size-4 text-[#53bdeb]"
                    aria-label="Leído"
                  />
                </span>
              </div>
            )}
            {typing && !reduced && (
              <div
                aria-hidden
                className="ap-pop flex w-14 gap-1 self-start rounded-xl rounded-tl-sm bg-[#202c33] px-3 py-3"
              >
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="ap-dot size-2 rounded-full bg-[#8696a0]"
                    style={{ animationDelay: `${d * 0.15}s` }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <p className="t-small opacity-75">
          Ejemplo de alerta con datos ilustrativos. El tiempo de detección es un
          objetivo de {CLAIMS.detectionMinutes} minutos, no un resultado medido.
        </p>
        {!reduced && (
          <button
            type="button"
            onClick={() => select(active)}
            className="min-h-11 shrink-0 rounded-full px-3 text-sm font-semibold text-[#0b6b44] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Repetir
          </button>
        )}
      </div>
    </div>
  );
}
