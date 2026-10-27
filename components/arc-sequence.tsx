"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

const STEPS = [
  { word: "se viera desde el espacio", line: "Leemos VIIRS, MODIS y GOES-19." },
  {
    word: "se verificara solo",
    line: "Cruzamos fuentes y descartamos calor industrial.",
  },
  {
    word: "se entendiera en su contexto",
    line: "Relieve, viento y localidad.",
  },
  {
    word: "llegara a tu celular",
    line: "Aviso por WhatsApp con ubicación; objetivo de 8 minutos.",
  },
  {
    word: "se pudiera ensayar",
    line: "Simulamos los primeros minutos antes de que pase.",
  },
];
const LAST = STEPS.length - 1;

// Arco semicircular en un viewBox 1000x520: centro (500,500), radio 440.
const nodePos = (i: number) => {
  const a = Math.PI - (i / LAST) * Math.PI;
  return {
    x: ((500 + 440 * Math.cos(a)) / 1000) * 100,
    y: ((500 - 440 * Math.sin(a)) / 520) * 100,
  };
};

export function ArcSequence() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    let raf = 0;
    let last = -1;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const span = Math.max(1, r.height - window.innerHeight);
      const p = Math.min(1, Math.max(0, -r.top / span));
      el.style.setProperty("--p", p.toFixed(4));
      const idx = Math.round(p * LAST);
      if (idx !== last) {
        last = idx;
        setActive(idx);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const io = new IntersectionObserver(([e]) => {
      window.removeEventListener("scroll", onScroll);
      if (e.isIntersecting) {
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const step = STEPS[active];
  return (
    <section
      ref={ref}
      aria-label="Qué pasaría si un incendio…"
      className="a-root relative h-[400svh] bg-a-bg motion-reduce:h-auto"
      style={{ "--p": 0 } as CSSProperties}
    >
      <ol className="sr-only motion-reduce:not-sr-only motion-reduce:mx-auto motion-reduce:max-w-3xl motion-reduce:space-y-6 motion-reduce:px-5 motion-reduce:py-16">
        {STEPS.map((s) => (
          <li key={s.word}>
            <span className="a-display-m block">
              ¿Y si un incendio {s.word}?
            </span>
            <span className="a-sub mt-2 block">{s.line}</span>
          </li>
        ))}
      </ol>

      <div
        aria-hidden
        className="sticky top-0 flex h-svh flex-col overflow-hidden px-5 pb-10 pt-24 motion-reduce:hidden md:px-8"
      >
        <p className="a-display-m !text-[clamp(1.5rem,3vw,2.25rem)] text-a-mute">
          ¿Y si un incendio…
        </p>

        <div className="relative mx-auto mt-auto w-full max-w-[1000px] [aspect-ratio:1000/520]">
          <svg
            viewBox="0 0 1000 520"
            className="absolute inset-0 size-full"
            fill="none"
          >
            <path
              d="M60 500A440 440 0 0 1 940 500"
              strokeWidth="1.5"
              style={{ stroke: "rgb(214 245 201 / 0.28)" }}
            />
            <g
              style={{
                transformOrigin: "500px 500px",
                transform: "rotate(calc(var(--p) * 180deg))",
              }}
            >
              <circle cx="60" cy="500" r="9" fill="var(--color-a-accent)" />
            </g>
          </svg>
          {STEPS.map((s, i) => {
            const { x, y } = nodePos(i);
            const on = i === active;
            return (
              <span
                key={s.word}
                style={{ left: `${x}%`, top: `${y}%` }}
                className={`absolute grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border text-xs font-medium transition-colors duration-300 md:size-10 md:text-sm ${
                  on
                    ? "border-a-accent bg-a-accent text-[#06150d]"
                    : "border-a-line bg-a-bg text-a-mute"
                }`}
              >
                {i + 1}
              </span>
            );
          })}
          <div className="absolute inset-x-[12%] bottom-[2%] text-center">
            <p key={active} className="a-display-m a-load text-a-accent">
              {step.word}
            </p>
            <p
              key={`l${active}`}
              className="a-sub a-load mx-auto mt-3 max-w-md"
              style={{ "--d": "90ms" } as CSSProperties}
            >
              {step.line}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
