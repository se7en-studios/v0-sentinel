"use client";

// Simulador ilustrativo de los primeros 60 minutos. El slider escribe CSS variables por refs
// (escala del fuego, humo); React solo re-renderiza cuando cambia el minuto ENTERO.
import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { CLAIMS } from "@/lib/claims";

const MAX_MIN = 60;
const START_MIN = 45;
const MS_PER_MIN = 450; // 60 min en ~27 s
const SMOKE_MIN = 20;
const POST_RESPONSE_GROWTH = 0.1; // con la brigada en el lugar, el avance cae a 10 % (ejemplo)
const A0 = 0.05; // ha iniciales (ejemplo)

type Wind = "bajo" | "medio" | "alto";
const WINDS: Record<Wind, { k: number; stretch: number }> = {
  bajo: { k: 0.11, stretch: 1.1 },
  medio: { k: 0.13, stretch: 1.3 },
  alto: { k: 0.15, stretch: 1.55 },
};

type Kind = "spark" | "smoke" | "alert" | "call" | "response";
type Step = { at: number; label: string; kind: Kind };

// Minutos de "Sin Sentinel" = caso típico de ejemplo. El aviso de "Con Sentinel" es el objetivo de CLAIMS.
const WITH: Step[] = [
  { at: 0, label: "Chispa", kind: "spark" },
  { at: CLAIMS.detectionMinutes, label: "Alerta (objetivo)", kind: "alert" },
  { at: 15, label: "Brigada en el lugar", kind: "response" },
  { at: SMOKE_MIN, label: "Humo visible", kind: "smoke" },
];
const WITHOUT: Step[] = [
  { at: 0, label: "Chispa", kind: "spark" },
  { at: SMOKE_MIN, label: "Humo visible", kind: "smoke" },
  { at: 35, label: "Alguien llama", kind: "call" },
  { at: 50, label: "Brigada en el lugar", kind: "response" },
];
const RESPONSE_WITH = 15;
const RESPONSE_WITHOUT = 50;

const freeArea = (m: number, k: number) => A0 * (Math.exp(k * m) - 1);

/** Hectáreas comprometidas (modelo exponencial simple) a los `m` minutos si la brigada llega en `resp`. */
function areaAt(m: number, resp: number, k: number) {
  if (m <= resp) return freeArea(m, k);
  const at = freeArea(resp, k);
  return at + POST_RESPONSE_GROWTH * (freeArea(m, k) - at);
}

const scaleOf = (ha: number) => Math.min(110, 8 + 8 * Math.sqrt(ha)) / 100;
const fmt = (ha: number) =>
  ha.toLocaleString("es-AR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

// Variables que leen las escenas SVG; también se usan para el primer render (sin salto en SSR).
function cssVars(m: number, wind: Wind): Record<string, string> {
  const { k, stretch } = WINDS[wind];
  const smoke = Math.min(1, Math.max(0, (m - (SMOKE_MIN - 2)) / 4));
  return {
    "--stretch": String(stretch),
    "--s-with": String(scaleOf(areaAt(m, RESPONSE_WITH, k))),
    "--s-without": String(scaleOf(areaAt(m, RESPONSE_WITHOUT, k))),
    "--smoke-with": String(smoke * 0.55),
    "--smoke-without": String(smoke),
    "--ring-with": m >= RESPONSE_WITH ? "1" : "0",
    "--ring-without": "0",
  };
}

const LINE = "#14120e";

function Scene({
  id,
  withSentinel,
}: {
  id: "with" | "without";
  withSentinel: boolean;
}) {
  return (
    <svg
      viewBox="0 0 320 180"
      role="img"
      aria-label={
        withSentinel
          ? "Escena ilustrativa: el foco crece poco y se rodea de brigada"
          : "Escena ilustrativa: el foco crece sin control hasta la respuesta"
      }
      className="block h-auto w-full border border-ink/20 bg-paper"
    >
      <path
        d="M0 120 L50 85 L100 112 L160 78 L225 110 L275 88 L320 112"
        fill="none"
        stroke={LINE}
        strokeOpacity="0.5"
        strokeWidth="1"
      />
      <path
        d="M0 150 L70 128 L140 146 L210 126 L320 148"
        fill="none"
        stroke={LINE}
        strokeOpacity="0.85"
        strokeWidth="1"
      />
      <g transform="translate(160 140)">
        <ellipse
          rx="100"
          ry="100"
          fill="#b4441a"
          fillOpacity="0.2"
          stroke="#b4441a"
          strokeWidth="1.25"
          style={{
            transform: `scale(calc(var(--s-${id}) * var(--stretch)), var(--s-${id}))`,
          }}
        />
        {/* Humo: aparece ~20 min; con Sentinel ya hay brigada, columna más baja */}
        <g
          style={{ opacity: `var(--smoke-${id})` }}
          className="motion-safe:transition-opacity"
          fill="none"
          stroke={LINE}
          strokeOpacity="0.6"
          strokeWidth="1"
        >
          <ellipse cx="6" cy={withSentinel ? -34 : -50} rx="24" ry="14" />
          <ellipse cx="16" cy={withSentinel ? -52 : -78} rx="32" ry="18" />
          <ellipse cx="30" cy={withSentinel ? -66 : -108} rx="40" ry="20" />
        </g>
        {withSentinel && (
          <circle
            r="104"
            fill="none"
            stroke="#0b4f35"
            strokeWidth="1.5"
            strokeDasharray="5 5"
            style={{
              opacity: `var(--ring-${id})`,
              transform: `scale(calc(var(--s-${id}) * var(--stretch) + 0.12), calc(var(--s-${id}) + 0.12))`,
            }}
          />
        )}
      </g>
    </svg>
  );
}

function Hitos({ steps, m }: { steps: Step[]; m: number }) {
  return (
    <ol className="mt-5 border-t rule">
      {steps.map((s) => {
        const on = m >= s.at;
        return (
          <li
            key={s.kind}
            data-on={on}
            className={`flex items-baseline gap-4 border-b rule py-2.5 ${on ? "text-ink" : "text-ink/60"}`}
          >
            <span className="w-14 shrink-0 font-semibold tabular-nums">
              {s.at} min
            </span>
            <span className="t-body">
              {s.label}
              <span className="sr-only">
                {on ? " (ya ocurrió)" : " (todavía no)"}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Clock({
  id,
  withSentinel,
  steps,
  m,
  ha,
}: {
  id: "with" | "without";
  withSentinel: boolean;
  steps: Step[];
  m: number;
  ha: number;
}) {
  return (
    <div className="min-w-0">
      <h3 className="t-h3">{withSentinel ? "Con Sentinel" : "Sin Sentinel"}</h3>
      <p className="t-body mt-1 text-ink/75">
        {withSentinel
          ? "El satélite ve el calor antes que el humo."
          : "Alguien ve la columna de humo y llama."}
      </p>
      <div className="mt-5">
        <Scene id={id} withSentinel={withSentinel} />
      </div>
      <p className="mt-5 flex flex-wrap items-baseline gap-x-3">
        <span
          className={`t-display tabular-nums ${withSentinel ? "text-brand" : "text-signal"}`}
        >
          {fmt(ha)}
        </span>
        <span className="t-body text-ink/75">ha comprometidas</span>
      </p>
      <Hitos steps={steps} m={m} />
    </div>
  );
}

export function FireSimulator() {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mRef = useRef(START_MIN);
  const windRef = useRef<Wind>("medio");
  const rafRef = useRef(0);
  const visibleRef = useRef(true);
  const [minute, setMinute] = useState(START_MIN);
  const [wind, setWind] = useState<Wind>("medio");
  const [playing, setPlaying] = useState(false);

  // Escribe las variables CSS del minuto (fraccionario) sin pasar por React.
  const paint = useCallback((m: number) => {
    const root = rootRef.current;
    if (!root) return;
    for (const [name, v] of Object.entries(cssVars(m, windRef.current)))
      root.style.setProperty(name, v);
  }, []);

  const setTime = useCallback(
    (m: number) => {
      const clamped = Math.min(MAX_MIN, Math.max(0, m));
      mRef.current = clamped;
      paint(clamped);
      if (inputRef.current) inputRef.current.value = String(clamped);
      const i = Math.floor(clamped + 1e-6);
      setMinute((prev) => (prev === i ? prev : i));
    },
    [paint],
  );

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setPlaying(false);
  }, []);

  const play = useCallback(() => {
    const from = mRef.current >= MAX_MIN ? 0 : mRef.current;
    const t0 = performance.now();
    setPlaying(true);
    const tick = (now: number) => {
      if (!visibleRef.current) return stop();
      const m = from + (now - t0) / MS_PER_MIN;
      setTime(m);
      if (m >= MAX_MIN) return stop();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [setTime, stop]);

  useEffect(() => {
    const root = rootRef.current;
    const io = new IntersectionObserver(([e]) => {
      visibleRef.current = e.isIntersecting;
    });
    if (root) io.observe(root);
    return () => {
      io.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [paint]);

  const pickWind = (w: Wind) => {
    windRef.current = w;
    setWind(w);
    paint(mRef.current);
  };

  const { k } = WINDS[wind];
  const haWith = areaAt(minute, RESPONSE_WITH, k);
  const haWithout = areaAt(minute, RESPONSE_WITHOUT, k);
  const diff = haWithout - haWith;

  return (
    <div ref={rootRef} style={cssVars(START_MIN, "medio")} className="text-ink">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-t rule pt-6">
        <label htmlFor="sim-minute" className="min-w-0">
          <span className="t-body block text-ink/75">Minuto del incendio</span>
          <output
            htmlFor="sim-minute"
            className="t-display block tabular-nums leading-none"
          >
            {minute}
          </output>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label="Viento (ejemplo)"
            className="flex border border-ink/30"
          >
            {(Object.keys(WINDS) as Wind[]).map((w) => (
              <button
                key={w}
                type="button"
                aria-pressed={wind === w}
                onClick={() => pickWind(w)}
                className={`px-3.5 py-2 text-sm font-medium capitalize transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${wind === w ? "bg-ink text-paper" : "text-ink hover:bg-ink/5"}`}
              >
                Viento {w}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={playing ? stop : play}
            className="inline-flex items-center gap-2 bg-brand px-5 py-2 text-sm font-semibold text-paper hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:hidden"
          >
            {playing ? (
              <Pause className="size-4" aria-hidden />
            ) : (
              <Play className="size-4" aria-hidden />
            )}
            {playing ? "Pausar" : "Reproducir"}
          </button>
        </div>
      </div>

      <div className="mt-6">
        <input
          ref={inputRef}
          id="sim-minute"
          type="range"
          min={0}
          max={MAX_MIN}
          step={1}
          defaultValue={START_MIN}
          aria-valuetext={`Minuto ${minute} del incendio`}
          onChange={(e) => {
            if (playing) stop();
            setTime(Number(e.target.value));
          }}
          className="block h-8 w-full cursor-pointer accent-[#0b4f35] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        />
        <div aria-hidden className="relative mt-1 h-5">
          {[0, 10, 20, 30, 40, 50, 60].map((t) => (
            <span
              key={t}
              className={`t-caption absolute -translate-x-1/2 tabular-nums ${t % 20 !== 0 ? "hidden sm:block" : ""}`}
              style={{
                left: `calc(${(t / MAX_MIN) * 100}% + ${8 - (t / MAX_MIN) * 16}px)`,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-0">
        <div className="md:pr-10">
          <Clock id="with" withSentinel steps={WITH} m={minute} ha={haWith} />
        </div>
        <div className="rule md:border-l md:pl-10">
          <Clock
            id="without"
            withSentinel={false}
            steps={WITHOUT}
            m={minute}
            ha={haWithout}
          />
        </div>
      </div>

      <p className="t-h2 rule mt-12 max-w-3xl text-balance border-t pt-8">
        En el minuto {minute}, el foco con Sentinel es{" "}
        <span className="tabular-nums">{fmt(Math.max(0, diff))} ha</span> más
        chico.
      </p>
      <p className="t-caption mt-4 max-w-2xl">
        Simulación ilustrativa, no es un pronóstico. Las hectáreas salen de un
        modelo exponencial simple con valores de ejemplo, y el aviso con
        Sentinel ({CLAIMS.detectionMinutes} min) es un objetivo, no un resultado
        medido.
      </p>
    </div>
  );
}
