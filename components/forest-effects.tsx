"use client";

// Atmosphere of the scroll journey: light shafts, dust in the light, clouds, birds, film finish and
// the smoke column. All CSS/SVG; the scroll-driven bits receive the shared progress value `p`.

import { motion, useTransform, type MotionValue } from "framer-motion";

type P = MotionValue<number>;

const RAYS = [
  { rot: -38, w: 4, o: 0.35 },
  { rot: -24, w: 6, o: 0.5 },
  { rot: -11, w: 3.5, o: 0.4 },
  { rot: 2, w: 7, o: 0.5 },
  { rot: 15, w: 4, o: 0.38 },
  { rot: 28, w: 6, o: 0.45 },
  { rot: 41, w: 3.5, o: 0.3 },
];

/** Light shafts from the sun through the trees: strongest at dawn, gone once the fire takes over. */
export function SunRays({ p }: { p: P }) {
  const opacity = useTransform(p, [0, 0.35, 0.62], [0.7, 0.55, 0]);
  return (
    <motion.div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-screen" style={{ opacity }}>
      {RAYS.map((r, i) => (
        <div
          key={i}
          className="jn-ray absolute left-[58%] top-[26%] h-[85%] origin-top"
          style={{
            width: `${r.w}vmin`,
            transform: `translateX(-50%) rotate(${r.rot}deg)`,
            opacity: r.o,
            animationDelay: `${-i * 1.7}s`,
            background: "linear-gradient(to bottom, rgba(255,236,190,0.6), rgba(255,226,160,0.1) 70%, transparent)",
            maskImage: "linear-gradient(to right, transparent, #000 35%, #000 65%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, #000 35%, #000 65%, transparent)",
          }}
        />
      ))}
    </motion.div>
  );
}

const MOTES = Array.from({ length: 18 }, (_, i) => ({
  x: (i * 37) % 100,
  y: 50 + ((i * 53) % 38),
  s: 1.5 + ((i * 7) % 4) * 0.8,
  d: 9 + ((i * 5) % 9),
  delay: -((i * 3.7) % 14),
}));

/** Pollen and dust drifting in the light. */
export function DustMotes() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {MOTES.map((m, i) => (
        <span
          key={i}
          className="jn-mote"
          style={{ left: `${m.x}%`, top: `${m.y}%`, width: m.s, height: m.s, animationDuration: `${m.d}s`, animationDelay: `${m.delay}s` }}
        />
      ))}
    </div>
  );
}

/** Slow soft clouds, parallaxed a little by the scroll. */
export function Clouds({ p }: { p: P }) {
  const x = useTransform(p, [0, 1], ["0vw", "-14vw"]);
  return (
    <motion.div aria-hidden className="pointer-events-none absolute inset-x-0 top-[6%] h-[34%]" style={{ x }}>
      {[
        { l: "6%", t: "14%", w: 46, o: 0.34 },
        { l: "44%", t: "4%", w: 58, o: 0.26 },
        { l: "78%", t: "26%", w: 40, o: 0.3 },
      ].map((c, i) => (
        <div
          key={i}
          className="absolute rounded-[50%]"
          style={{
            left: c.l,
            top: c.t,
            width: `${c.w}vw`,
            height: "9vmin",
            opacity: c.o,
            background: "radial-gradient(ellipse at 50% 55%, rgba(255,236,214,0.9), rgba(255,226,200,0.25) 55%, transparent 72%)",
          }}
        />
      ))}
    </motion.div>
  );
}

/** A few birds crossing at dawn. */
export function Birds({ p }: { p: P }) {
  return (
    <>
      {[
        { win: [0.0, 0.3], top: 15, s: 22 },
        { win: [0.03, 0.34], top: 20, s: 16 },
        { win: [0.08, 0.4], top: 12, s: 12 },
      ].map((b, i) => (
        <Bird key={i} p={p} win={b.win as [number, number]} top={b.top} size={b.s} delay={i * 0.18} />
      ))}
    </>
  );
}

function Bird({ p, win, top, size, delay }: { p: P; win: [number, number]; top: number; size: number; delay: number }) {
  const x = useTransform(p, win, ["-8vw", "108vw"]);
  const y = useTransform(p, [win[0], (win[0] + win[1]) / 2, win[1]], [0, -24, 8]);
  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 40 16"
      className="pointer-events-none absolute left-0"
      style={{ x, y, top: `${top}%`, width: size }}
    >
      <path className="jn-wing" style={{ animationDelay: `${delay}s` }} d="M2 10Q10 0 20 9Q30 0 38 10Q30 5 20 12Q10 5 2 10Z" fill="#0b1511" fillOpacity="0.75" />
    </motion.svg>
  );
}

/** Film grain and a soft vignette over the whole stage, so flat vectors read as a photographed scene. */
export function FilmFinish() {
  return (
    <>
      <div aria-hidden className="bg-noise pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.5) 100%)" }}
      />
    </>
  );
}

/** Smoke column over the fire: blurred puffs rise, swell and lean downwind. Grows with the fire. */
export function Smoke({ p }: { p: P }) {
  const opacity = useTransform(p, [0.6, 0.72, 1], [0, 0.7, 0.8]);
  const scale = useTransform(p, [0.6, 1], [0.6, 1.1]);
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute bottom-[70%] left-1/2 h-[60vmin] w-[24vmin] origin-bottom -translate-x-1/2"
      style={{ opacity, scale }}
    >
      {Array.from({ length: 7 }, (_, i) => (
        <span key={i} className="jn-smoke" style={{ animationDelay: `${-i * 1.15}s`, left: `${30 + (i % 3) * 14}%` }} />
      ))}
    </motion.div>
  );
}
