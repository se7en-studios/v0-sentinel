"use client";

// Scroll journey under the hero: you travel through a forest at dawn while scrolling, drones and a
// satellite cross the sky, a fire is detected and the alert goes out. One scroll value (0..1) drives
// everything through motion values, so scrolling never re-renders React. With reduced motion the scene
// is a still frame and the chapters become a plain list.

import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  motion,
  useMotionTemplate,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ArrowRight, BellRing } from "lucide-react";
import {
  Drone,
  Flame,
  ForestLayer,
  Satellite,
  type LayerKind,
} from "./forest-art";
import { CLAIMS } from "@/lib/claims";
import { Birds, Clouds, DustMotes, FilmFinish, Smoke, SunRays } from "./forest-effects";

type P = MotionValue<number>;

const CHAPTERS = [
  {
    kicker: "01 · El territorio",
    title: "Millones de hectáreas. Nadie puede mirarlas todas.",
    body: "Un incendio empieza con una chispa en un lugar al que nadie llega a tiempo.",
    range: [0, 0.2],
  },
  {
    kicker: "02 · Sensores y drones",
    title: "Ojos en el aire, sumándose de a poco",
    body: "Los drones y sensores propios se integran de forma progresiva a la plataforma. Hoy la base es satelital; mañana el territorio tiene presencia permanente.",
    range: [0.2, 0.42],
  },
  {
    kicker: "03 · Satélites",
    title: "El calor se ve desde el espacio",
    body: "VIIRS, MODIS y GOES-19 cruzan el territorio varias veces por hora. Sentinel procesa cada pasada apenas llega.",
    range: [0.42, 0.62],
  },
  {
    kicker: "04 · Detección",
    title: "Foco detectado en minutos, no en horas",
    body: "La anomalía térmica se cruza con terreno, clima y combustible para filtrar falsos positivos y priorizar el foco real.",
    range: [0.62, 0.82],
  },
  {
    kicker: "05 · Alerta",
    title: "Quien tiene que actuar, lo sabe primero",
    body: "Municipios, brigadas y propietarios reciben el aviso con ubicación y riesgo de propagación.",
    range: [0.82, 1.01],
    cta: true,
  },
] as const;

/** Layers: [kind, height % of the stage, how much of its travel it covers at the end]. */
const LAYERS: [LayerKind, number, number][] = [
  ["ridge", 62, 0.12],
  ["far", 52, 0.3],
];
const MID_HEIGHT = 66;
const NEAR_HEIGHT = 56;

const travel = (f: number) => `translate3d(calc(${-f} * (100% - 100vw)), 0, 0)`;

/** Drones: [scroll window, top %, size, direction] — nearer ones are bigger and faster. */
const DRONES = [
  { win: [0.12, 0.52], top: 22, size: "clamp(96px, 13vw, 190px)", dir: 1 },
  { win: [0.18, 0.6], top: 17, size: "clamp(60px, 7.5vw, 110px)", dir: -1 },
  { win: [0.26, 0.72], top: 36, size: "clamp(78px, 10vw, 150px)", dir: 1 },
] as const;

function FlyingDrone({ p, d }: { p: P; d: (typeof DRONES)[number] }) {
  const from = d.dir === 1 ? "-22vw" : "122vw";
  const to = d.dir === 1 ? "122vw" : "-22vw";
  const x = useTransform(p, [d.win[0], d.win[1]], [from, to]);
  const rotate = useTransform(p, [d.win[0], d.win[1]], [d.dir * -5, d.dir * 5]);
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute left-0 will-change-transform"
      style={{
        top: `${d.top}%`,
        x,
        rotate,
        width: d.size,
        aspectRatio: "160 / 260",
      }}
    >
      <div className="jn-bob h-full w-full" style={d.dir === -1 ? { filter: "blur(0.7px)", opacity: 0.8 } : undefined}>
        <Drone />
      </div>
    </motion.div>
  );
}

/** True while `p` is inside [a, b] (with a little slack). Re-renders only when it flips, not on every scroll tick. */
function useWithin(p: P, a: number, b: number, initial: boolean) {
  const [on, setOn] = useState(initial);
  useMotionValueEvent(p, "change", (v) => {
    const now = v >= a - 0.02 && v <= b + 0.02;
    setOn((prev) => (prev === now ? prev : now));
  });
  return on;
}

function Chapter({ p, i, children }: { p: P; i: number; children: ReactNode }) {
  const [a, b] = CHAPTERS[i].range;
  const active = useWithin(p, a, b, i === 0);
  const last = i === CHAPTERS.length - 1;
  const edge = 0.035;
  const opacity = useTransform(
    p,
    [a, a + edge, b - edge, b],
    [i === 0 ? 1 : 0, 1, 1, last ? 1 : 0],
  );
  const y = useTransform(
    p,
    [a, a + edge, b - edge, b],
    [i === 0 ? 0 : 28, 0, 0, last ? 0 : -28],
  );
  return (
    <motion.div className="absolute inset-x-0 bottom-0" style={{ opacity, y }} inert={!active}>
      {children}
    </motion.div>
  );
}

function ChapterText({ i }: { i: number }) {
  const c = CHAPTERS[i];
  const Title = i === 0 ? "h2" : "h3";
  return (
    // Scrim propio: el texto nunca depende de lo que haya detrás en el cielo.
    <div className="max-w-xl rounded-2xl bg-charcoal/80 p-5 text-[#f4efe2] sm:p-7">
      <p className="t-label mb-3 text-leaf-bright">{c.kicker}</p>
      <Title className="t-h2 text-[1.9rem] text-balance sm:text-5xl">{c.title}</Title>
      <p className="t-body mt-4 max-w-md text-[#f4efe2]/90">{c.body}</p>
      {i === 3 && (
        <p className="t-small mt-5 inline-flex items-baseline gap-2 rounded-full border border-leaf-bright/40 px-4 py-1.5">
          <span className="text-lg font-bold text-leaf-bright">{CLAIMS.detectionMinutes} min</span> tiempo
          de detección objetivo
        </p>
      )}
      {"cta" in c && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href="/demo"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-leaf-bright px-7 py-3 text-base font-semibold text-charcoal transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Ver el panel en vivo <ArrowRight className="size-4" aria-hidden />
          </a>
          <a
            href="#nosotros"
            className="inline-flex items-center justify-center rounded-full border border-[#f4efe2]/40 px-7 py-3 text-base text-[#f4efe2] transition-colors hover:border-[#f4efe2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Conocer la plataforma
          </a>
        </div>
      )}
    </div>
  );
}

function ParallaxLayer({ p, kind, height, factor, sway }: { p: P; kind: LayerKind; height: number; factor: number; sway?: boolean }) {
  const transform = useTransform(p, (v) => travel(v * factor));
  return (
    <motion.div aria-hidden className="pointer-events-none absolute bottom-0 left-0 will-change-transform" style={{ height: `${height}%`, transform }}>
      <ForestLayer kind={kind} sway={sway} />
    </motion.div>
  );
}

/** The fire, in the world (it travels with the mid trees): a main flame, a front that spreads, smoke. */
function FireFront({ p, animate }: { p: P; animate: boolean }) {
  const main = useTransform(p, [0.58, 0.68], [0, 1]);
  const side = useTransform(p, [0.66, 0.82], [0, 1]);
  const glow = useTransform(p, [0.6, 0.8], [0, 1]);
  const reticle = useTransform(p, [0.64, 0.72], [0, 1]);
  const reticleScale = useTransform(reticle, [0, 1], [1.6, 1]);
  return (
    <div
      style={{ left: "calc(0.68 * (100% - 100vw) + 50vw)" }}
      className="absolute bottom-[30%] h-[28vmin] w-[22vmin] -translate-x-1/2 max-sm:bottom-[58%] max-sm:h-[34vmin] max-sm:w-[27vmin]"
    >
      <motion.div
        aria-hidden
        className="absolute -inset-x-[110%] -bottom-[8%] h-[70%] rounded-[50%] bg-[radial-gradient(ellipse,rgba(255,120,30,0.55),transparent_68%)] blur-md"
        style={{ opacity: glow, scale: glow }}
      />
      <Smoke p={p} />
      <motion.div aria-hidden className="absolute -left-[62%] bottom-0 h-[62%] w-[52%] origin-bottom" style={{ scale: side, opacity: side }}>
        <Flame animate={animate} id="b" />
      </motion.div>
      <motion.div aria-hidden className="absolute -right-[66%] bottom-0 h-[78%] w-[62%] origin-bottom" style={{ scale: side, opacity: side }}>
        <Flame animate={animate} id="c" />
      </motion.div>
      <motion.div aria-hidden className="absolute -right-[22%] bottom-0 h-[46%] w-[34%] origin-bottom" style={{ scale: side, opacity: side }}>
        <Flame animate={animate} id="d" />
      </motion.div>
      <motion.div className="h-full w-full origin-bottom" style={{ scale: main, opacity: main }}>
        <Flame animate={animate} id="a" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span key={i} aria-hidden className="jn-ember" style={{ left: `${24 + i * 10}%`, animationDelay: `${i * 0.5}s` }} />
        ))}
      </motion.div>
      <motion.div className="absolute inset-x-[10%] inset-y-[4%] border border-leaf-bright/80" style={{ opacity: reticle, scale: reticleScale }}>
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded t-label bg-charcoal/85 px-2 py-0.5 text-leaf-bright">
          Anomalía térmica
        </span>
      </motion.div>
    </div>
  );
}

/** The whole scene, driven by `p` (0..1). */
function Scene({ p, reduce }: { p: P; reduce: boolean }) {
  const top = useTransform(
    p,
    [0, 0.5, 0.7, 1],
    ["#12110e", "#1d1b17", "#3a2016", "#2a1510"],
  );
  const bottom = useTransform(
    p,
    [0, 0.5, 0.7, 1],
    ["#e9dcc0", "#d9a874", "#e8732a", "#9a3a1a"],
  );
  const sky = useMotionTemplate`linear-gradient(to bottom, ${top} 0%, ${bottom} 100%)`;
  const heat = useTransform(p, [0.6, 0.72, 1], [0, 0.55, 0.7]);
  const sunY = useTransform(p, [0, 1], ["0%", "-14%"]);

  const midTravel = useTransform(p, (v) => travel(v));

  const beam = useTransform(p, [0.58, 0.66, 0.76, 0.84], [0, 1, 1, 0]);
  const satX = useTransform(p, [0.36, 0.94], ["-12vw", "112vw"]);
  const satY = useTransform(p, [0.36, 0.65, 0.94], [22, 0, 22]);
  const noticeOn = useWithin(p, 0.82, 1.1, false);
  const notice = useTransform(p, [0.82, 0.88], [0, 1]);
  const noticeY = useTransform(p, [0.82, 0.88], [24, 0]);

  return (
    <>
      <motion.div className="absolute inset-0" style={{ background: sky }} />
      <Clouds p={p} />
      <motion.div
        aria-hidden
        className="absolute left-[58%] top-[24%] size-[34vmin] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#fff6d8_0%,#ffd48a88_30%,transparent_70%)]"
        style={{ y: sunY }}
      />
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_90%,#ff5a1f_0%,transparent_60%)]"
        style={{ opacity: heat }}
      />
      <Birds p={p} />

      {LAYERS.map(([kind, h, f]) => (
        <ParallaxLayer key={kind} p={p} kind={kind} height={h} factor={f} />
      ))}

      <SunRays p={p} />
      <div aria-hidden className="jn-mist absolute inset-x-0 bottom-[22%] h-[26%]" />

      <motion.div
        className="pointer-events-none absolute bottom-0 left-0 will-change-transform"
        style={{ height: `${MID_HEIGHT}%`, transform: midTravel }}
      >
        <ForestLayer kind="mid" />
        <FireFront p={p} animate={!reduce} />
      </motion.div>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[15%] h-[40%] w-px origin-top -translate-x-1/2 bg-gradient-to-b from-[#94f1be] via-[#94f1be]/60 to-transparent shadow-[0_0_18px_4px_rgba(148,241,190,0.45)]"
        style={{ opacity: beam, scaleY: beam }}
      />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-0 top-[12%] w-[clamp(56px,6vw,92px)] will-change-transform"
        style={{ x: satX, y: satY, aspectRatio: "2 / 1" }}
      >
        <Satellite />
      </motion.div>

      {DRONES.map((d) => (
        <FlyingDrone key={d.top} p={p} d={d} />
      ))}

      <ParallaxLayer p={p} kind="near" height={NEAR_HEIGHT} factor={1} />
      <ParallaxLayer p={p} kind="grass" height={82} factor={1} sway />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
      <DustMotes />
      <FilmFinish />

      <motion.div
        className="absolute right-4 top-24 w-[min(78vw,300px)] rounded-2xl border border-white/15 bg-charcoal/90 p-4 text-[#f4efe2] shadow-2xl sm:right-10 sm:top-1/3"
        style={{ opacity: notice, y: noticeY }}
        inert={!noticeOn}
        aria-hidden={!noticeOn}
      >
        <div className="flex items-center gap-2 t-label text-leaf-bright">
          <BellRing className="size-3.5" aria-hidden /> Sentinel · Alerta
        </div>
        <p className="t-small mt-2 font-medium">
          Foco confirmado a 3,2 km del Lote 14
        </p>
        <p className="t-small mt-1 text-[#f4efe2]/80">
          Viento 28 km/h del oeste · riesgo de propagación alto
        </p>
        <p className="t-label mt-3 text-[#f4efe2]/70">
          Ejemplo ilustrativo
        </p>
      </motion.div>
    </>
  );
}

// Versión estática también en pantallas angostas: el recorrido pineado cuesta demasiado en mobile.
const REDUCED = "(prefers-reduced-motion: reduce), (max-width: 767px)";
const readReduced = () => window.matchMedia(REDUCED).matches;
function subscribeReduced(cb: () => void) {
  const m = window.matchMedia(REDUCED);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}

export function ForestJourney() {
  const reduce = useSyncExternalStore(subscribeReduced, readReduced, () => false);
  const ref = useRef<HTMLElement>(null);
  const onScreen = useInView(ref, { margin: "200px 0px 200px 0px" });
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const smooth = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    mass: 0.35,
  });
  const still = useMotionValue(0.7);
  const p: P = reduce ? still : smooth;

  return (
    <section
      ref={ref}
      id="recorrido"
      data-paused={!onScreen}
      aria-label="Cómo Sentinel detecta un incendio"
      className="relative overflow-x-clip bg-charcoal"
      style={reduce ? undefined : { height: "480svh" }}
    >
      <a
        href="#fin-recorrido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-20 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-black"
      >
        Saltar el recorrido
      </a>
      <div
        className={
          reduce
            ? "relative h-[78svh] overflow-hidden"
            : "sticky top-0 h-[100svh] overflow-hidden"
        }
      >
        <Scene p={p} reduce={reduce} />
        {!reduce && (
          <div className="absolute inset-x-0 bottom-0 z-10 mx-auto h-[50svh] max-w-6xl px-5 pb-16 sm:px-10 sm:pb-12">
            <div className="relative h-full">
              {CHAPTERS.map((_, i) => (
                <Chapter key={i} p={p} i={i}>
                  <ChapterText i={i} />
                </Chapter>
              ))}
            </div>
          </div>
        )}
        {!reduce && <Ticks p={p} />}
      </div>
      {reduce && (
        <div className="mx-auto grid max-w-6xl gap-10 bg-charcoal px-5 py-14 sm:px-10 md:grid-cols-2">
          {CHAPTERS.map((_, i) => (
            <ChapterText key={i} i={i} />
          ))}
        </div>
      )}
      <div id="fin-recorrido" aria-hidden />
    </section>
  );
}

function Ticks({ p }: { p: P }) {
  return (
    <div
      aria-hidden
      className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2"
    >
      {CHAPTERS.map((c, i) => (
        <Tick key={i} p={p} range={c.range} />
      ))}
    </div>
  );
}

function Tick({ p, range }: { p: P; range: readonly [number, number] }) {
  const [a, b] = range;
  const opacity = useTransform(
    p,
    [a - 0.01, a + 0.02, b - 0.02, b + 0.01],
    [0.3, 1, 1, 0.3],
  );
  const width = useTransform(
    p,
    [a - 0.01, a + 0.02, b - 0.02, b + 0.01],
    [10, 28, 28, 10],
  );
  return (
    <motion.span
      className="h-1 rounded-full bg-leaf-bright"
      style={{ opacity, width }}
    />
  );
}
