"use client";

// Simulador ilustrativo de los primeros 60 minutos. El slider escribe CSS variables por refs
// (escala del fuego, humo); React solo re-renderiza cuando cambia el minuto ENTERO.
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BellRing,
  CloudFog,
  Flame,
  Pause,
  RotateCcw,
  Play,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
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
const ICONS: Record<Kind, LucideIcon> = {
  spark: Flame,
  smoke: CloudFog,
  alert: BellRing,
  call: BellRing,
  response: ShieldCheck,
};

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

// Suaviza el salto entre minutos y entre viento bajo/medio/alto (transform sobre variables CSS).
const TWEEN =
  "motion-safe:transition-[transform,opacity] motion-safe:duration-300 motion-safe:ease-out [transform-box:fill-box]";

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

function Scene({
  id,
  withSentinel,
}: {
  id: "with" | "without";
  withSentinel: boolean;
}) {
  const smokeTone = "#7d8a82";
  return (
    <svg
      viewBox="0 0 320 180"
      role="img"
      aria-label={
        withSentinel
          ? "Escena ilustrativa: el foco crece poco y se rodea de brigada"
          : "Escena ilustrativa: el foco crece sin control hasta la respuesta"
      }
      className="block h-auto w-full rounded-xl border border-a-line"
    >
      <defs>
        <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0c1310" />
          <stop offset="1" stopColor={withSentinel ? "#16251d" : "#2a2218"} />
        </linearGradient>
        <radialGradient id={`fire-${id}`}>
          <stop offset="0" stopColor="#f3cf8f" />
          <stop offset="0.45" stopColor="#d9923a" />
          <stop offset="1" stopColor="#d9923a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#sky-${id})`} />
      <path
        d="M0 120 L50 85 L100 112 L160 78 L225 110 L275 88 L320 112 V180 H0Z"
        fill="#0a100d"
      />
      <path
        d="M0 150 L70 128 L140 146 L210 126 L320 148 V180 H0Z"
        fill="#070b09"
      />
      <g fill="#050806" aria-hidden>
        {[18, 40, 66, 252, 280, 302].map((x, i) => (
          <path key={x} d={`M${x} 160 l-7 ${i % 2 ? 22 : 28} h14 z`} />
        ))}
      </g>
      <g transform="translate(160 140)">
        <ellipse
          rx="100"
          ry="100"
          fill={`url(#fire-${id})`}
          className={TWEEN}
          style={{
            transform: `scale(calc(var(--s-${id}) * var(--stretch)), var(--s-${id}))`,
          }}
        />
        {/* Humo: aparece ~20 min; con Sentinel ya hay brigada, columna más baja */}
        <g
          style={{ opacity: `var(--smoke-${id})` }}
          className="motion-safe:transition-opacity motion-safe:duration-500"
        >
          <ellipse
            cx="6"
            cy={withSentinel ? -34 : -50}
            rx="24"
            ry="14"
            fill={smokeTone}
            opacity="0.55"
          />
          <ellipse
            cx="16"
            cy={withSentinel ? -52 : -78}
            rx="32"
            ry="18"
            fill={smokeTone}
            opacity="0.4"
          />
          <ellipse
            cx="30"
            cy={withSentinel ? -66 : -108}
            rx="40"
            ry="20"
            fill={smokeTone}
            opacity="0.28"
          />
        </g>
        {withSentinel && (
          <circle
            r="104"
            fill="none"
            stroke="#a9efc9"
            strokeWidth="1.5"
            strokeDasharray="7 6"
            className={TWEEN}
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

function Hitos({
  steps,
  m,
  withSentinel,
}: {
  steps: Step[];
  m: number;
  withSentinel: boolean;
}) {
  return (
    <ol className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
      {steps.map((s) => {
        const Icon = ICONS[s.kind];
        const on = m >= s.at;
        const tone = withSentinel ? "text-a-accent" : "text-[#e3b25c]";
        return (
          <li key={s.kind} data-on={on} className="flex items-start gap-2.5">
            <Icon
              aria-hidden
              className={`mt-1 size-4 shrink-0 transition-colors ${on ? tone : "text-a-faint"}`}
            />
            <span className={on ? "text-white" : "text-a-faint"}>
              <span className="block text-lg font-semibold leading-tight tabular-nums">
                {s.at} min
              </span>
              <span className="text-sm">
                {s.label}
                <span className="sr-only">
                  {on ? " (ya ocurrió)" : " (todavía no)"}
                </span>
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
    <div className="min-w-0 rounded-xl border border-a-line bg-a-surface p-4 md:p-5">
      <h3 className="flex items-center gap-2.5 text-lg font-semibold text-white">
        <span
          aria-hidden
          className={`size-2.5 rounded-full ${withSentinel ? "bg-a-accent" : "bg-[#e3b25c]"}`}
        />
        {withSentinel ? "Con Sentinel" : "Sin Sentinel"}
      </h3>
      <p className="mt-1 text-sm text-a-mute">
        {withSentinel
          ? "El satélite ve el calor antes que el humo."
          : "Alguien ve la columna de humo y llama."}
      </p>
      <div className="mt-4">
        <Scene id={id} withSentinel={withSentinel} />
      </div>
      <p className="mt-4 flex flex-wrap items-baseline gap-x-2">
        <span
          className={`inline-block min-w-[4.5ch] text-5xl font-semibold leading-none tracking-tight tabular-nums md:text-6xl ${withSentinel ? "text-a-accent" : "text-[#e3b25c]"}`}
        >
          {fmt(ha)}
        </span>
        <span className="text-sm text-a-mute">
          ha comprometidas (ilustrativo)
        </span>
      </p>
      <div aria-hidden className="mt-3 h-1 overflow-hidden rounded-full bg-a-line">
        <div
          className={`h-full w-full origin-left rounded-full motion-safe:transition-transform motion-safe:duration-300 ${withSentinel ? "bg-a-accent" : "bg-[#e3b25c]"}`}
          style={{ transform: `scaleX(var(--s-${id}))` }}
        />
      </div>
      <Hitos steps={steps} m={m} withSentinel={withSentinel} />
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
    <div
      ref={rootRef}
      style={cssVars(START_MIN, "medio")}
      className="a-card a-scale-in relative overflow-hidden p-5 text-white md:p-10"
    >
      <div className="relative">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <label htmlFor="sim-minute" className="min-w-0">
            <span className="block text-xs font-medium uppercase tracking-[0.16em] text-a-faint">
              Simulador · primeros 60 minutos
            </span>
            <span className="mt-1 block text-xl font-semibold">
              Minuto del incendio:{" "}
              <output htmlFor="sim-minute" className="tabular-nums">
                {minute}
              </output>
            </span>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <div
              role="group"
              aria-label="Viento (ejemplo)"
              className="flex rounded-full border border-a-line bg-a-surface p-1"
            >
              {(Object.keys(WINDS) as Wind[]).map((w) => (
                <button
                  key={w}
                  type="button"
                  aria-pressed={wind === w}
                  onClick={() => pickWind(w)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${wind === w ? "bg-a-accent text-[#06150d]" : "text-a-mute hover:text-white"}`}
                >
                  Viento {w}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={playing ? stop : play}
              aria-pressed={playing}
              className={`inline-flex min-w-[9.5rem] justify-center motion-reduce:hidden items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.97] ${playing ? "border border-a-accent bg-transparent text-a-accent" : "bg-a-accent text-[#06150d]"}`}
            >
              {playing ? (
                <Pause className="size-4" aria-hidden />
              ) : minute >= MAX_MIN ? (
                <RotateCcw className="size-4" aria-hidden />
              ) : (
                <Play className="size-4" aria-hidden />
              )}
              {playing ? "Pausar" : minute >= MAX_MIN ? "Repetir" : "Reproducir"}
            </button>
          </div>
        </div>

        <div className="mt-6 px-1">
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
            className="block h-8 w-full cursor-pointer accent-[#a9efc9] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          />
          <div aria-hidden className="relative mt-1 h-5">
            {[0, 10, 20, 30, 40, 50, 60].map((t) => (
              <span
                key={t}
                className={`absolute -translate-x-1/2 text-xs tabular-nums text-a-faint ${t % 20 !== 0 ? "hidden sm:block" : ""}`}
                style={{
                  left: `calc(${(t / MAX_MIN) * 100}% + ${8 - (t / MAX_MIN) * 16}px)`,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          <Clock id="with" withSentinel steps={WITH} m={minute} ha={haWith} />
          <Clock
            id="without"
            withSentinel={false}
            steps={WITHOUT}
            m={minute}
            ha={haWithout}
          />
        </div>

        <p className="mt-10 border-t border-a-line pt-8 text-balance font-[family-name:var(--font-display)] text-[clamp(1.9rem,4vw,3.2rem)] leading-[1.05] tracking-tight">
          La diferencia:{" "}
          <span className="text-a-accent tabular-nums">
            {fmt(Math.max(0, diff))} ha
          </span>{" "}
          menos
          <span className="ml-3 inline-block align-middle text-sm text-a-faint">
            en el minuto {minute}
          </span>
        </p>
        <p className="mt-4 text-xs text-a-faint">
          Simulación ilustrativa, no es un pronóstico · el aviso con Sentinel (
          {CLAIMS.detectionMinutes} min) es un objetivo, no un resultado medido
        </p>
      </div>
    </div>
  );
}
