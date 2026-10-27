"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CssGlobe } from "@/components/ui/css-globe";
import { SplitReveal } from "@/components/ui/split-reveal";
import { cn } from "@/lib/utils";

export type ScrollGlobeSection = {
  id: string;
  badge: string;
  title: string;
  subtitle?: string;
  description: string;
  align?: "left" | "center" | "right";
  features?: { title: string; description: string }[];
  /** Botones o links ya armados (server-friendly). */
  actions?: ReactNode;
};

type Pos = { top: number; left: number; scale: number };

// Posición del globo (en vh / vw del escenario) para cada sección.
const DEFAULT_POSITIONS: Pos[] = [
  { top: 50, left: 74, scale: 1.5 },
  { top: 80, left: 50, scale: 1 },
  { top: 62, left: 82, scale: 1.9 },
  { top: 50, left: 50, scale: 2.3 },
];
// En celular el globo va centrado y detrás del texto.
const MOBILE_POSITIONS: Pos[] = [
  { top: 24, left: 50, scale: 0.9 },
  { top: 22, left: 50, scale: 0.8 },
  { top: 24, left: 50, scale: 0.9 },
  { top: 50, left: 50, scale: 1.4 },
];

// Focos de calor sobre el globo (posiciones en % del círculo). Aparecen desde "Verificar"; en "Contexto" se suman más.
const SPOTS = [
  { x: 36, y: 62, d: 0 },
  { x: 44, y: 70, d: 0.6 },
  { x: 30, y: 48, d: 1.2 },
  { x: 52, y: 40, d: 0.3, more: true },
  { x: 40, y: 78, d: 0.9, more: true },
  { x: 58, y: 58, d: 1.5, more: true },
];

function HeatSpots({ visible, dense }: { visible: boolean; dense: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-700"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {SPOTS.map((s, i) => (
        <span
          key={i}
          className="absolute size-2 rounded-full bg-[#ffb27a] shadow-[0_0_10px_3px_rgba(255,106,43,0.9)] transition-opacity duration-700 motion-safe:animate-pulse"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            animationDelay: `${s.d}s`,
            opacity: s.more && !dense ? 0 : 1,
          }}
        />
      ))}
    </div>
  );
}

// El globo es fijo (sticky) y se mueve según la sección que está en el centro de la pantalla.
export function ScrollGlobe({
  sections,
  positions = DEFAULT_POSITIONS,
}: {
  sections: ScrollGlobeSection[];
  positions?: Pos[];
}) {
  const [active, setActive] = useState(0);
  const [mobile, setMobile] = useState(false);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767.98px)");
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // La sección que cruza el centro de la pantalla es la activa.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting)
            setActive(Number((e.target as HTMLElement).dataset.i));
        }
      },
      { rootMargin: "-48% 0px -48% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [sections.length]);

  const set = mobile ? MOBILE_POSITIONS : positions;
  const p = set[Math.min(active, set.length - 1)];

  return (
    <div className="a-glow relative">
      {/* Escenario fijo del globo: queda detrás del texto (el texto lo recubre con -mt). */}
      <div
        aria-hidden
        className="pointer-events-none sticky top-0 z-10 h-screen overflow-hidden"
      >
        <div
          data-cg
          className="absolute left-0 top-0 will-change-transform motion-safe:transition-transform motion-safe:duration-[1400ms] motion-safe:ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{
            transform: `translate3d(${p.left}vw, ${p.top}vh, 0) translate3d(-50%, -50%, 0) scale3d(${p.scale}, ${p.scale}, 1)`,
          }}
        >
          <HeatSpots visible={active >= 1} dense={active >= 2} />
          <CssGlobe
            className={cn(
              "transition-opacity duration-700",
              active === sections.length - 1 || mobile
                ? "opacity-45"
                : "opacity-95",
            )}
          />
        </div>
      </div>

      {/* Riel de capítulos: dónde estás dentro del recorrido. */}
      <nav
        aria-label="Capítulos"
        className="pointer-events-none sticky top-0 z-30 -mt-[100vh] hidden h-screen items-center justify-end pr-6 md:flex lg:pr-10"
      >
        <ol className="pointer-events-auto grid gap-4">
          {sections.map((s, i) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={i === active ? "step" : undefined}
                className="group flex items-center justify-end gap-3 text-[0.8125rem] uppercase tracking-[0.18em] text-a-faint transition-colors aria-[current]:text-a-accent hover:text-[#e3f6dc]"
              >
                <span className="opacity-0 transition-opacity group-hover:opacity-100 group-aria-[current]:opacity-100">
                  {s.badge}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "h-px bg-current transition-all duration-500",
                    i === active ? "w-10" : "w-5",
                  )}
                />
                <span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="relative z-20 -mt-[100vh]">
        {sections.map((s, i) => (
          <section
            key={s.id}
            id={s.id}
            data-i={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className={cn(
              "flex min-h-screen flex-col justify-center px-5 py-20 md:px-12 lg:px-16",
              s.align === "center" && "items-center text-center",
              s.align === "right" && "items-end text-right",
              (!s.align || s.align === "left") && "items-start text-left",
            )}
          >
            <div className="w-full max-w-3xl">
              <p
                className={cn(
                  "a-eyebrow flex items-center gap-3 !text-a-accent",
                  s.align === "center" ? "justify-center" : "!text-left",
                )}
              >
                <span aria-hidden className="h-px w-8 bg-a-accent/60" />
                <span className="tabular-nums">
                  {String(i + 1).padStart(2, "0")} / {String(sections.length).padStart(2, "0")}
                </span>
                <span className="text-a-mute">{s.badge}</span>
              </p>
              <SplitReveal
                as="h2"
                className="a-display mt-5 !text-[clamp(2.75rem,6.6vw,6rem)] !leading-[0.95] !tracking-[-0.03em] [text-shadow:0_2px_30px_rgba(0,0,0,0.5)]"
              >
                {s.title}
                {s.subtitle ? (
                  <span className="block bg-gradient-to-r from-[#a9efc9] via-[#d8f5cf] to-[#ffb27a] bg-clip-text italic text-transparent">
                    {s.subtitle}
                  </span>
                ) : null}
              </SplitReveal>
              <p
                className={cn(
                  "a-sub mt-7 max-w-xl !text-[clamp(1.125rem,1.6vw,1.4375rem)] !leading-[1.55] !text-[#c3d6c9]",
                  s.align === "center" && "mx-auto",
                )}
              >
                {s.description}
              </p>

              {s.features ? (
                <ul className="mt-8 grid max-w-xl gap-3">
                  {s.features.map((f) => (
                    <li
                      key={f.title}
                      className="rounded-xl border border-a-line bg-a-bg/70 p-4 text-left backdrop-blur-sm"
                    >
                      <p className="font-semibold text-[#e3f6dc]">{f.title}</p>
                      <p className="mt-1 text-sm text-a-mute">
                        {f.description}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}

              {s.actions ? (
                <div
                  className={cn(
                    "mt-8 flex flex-wrap gap-3",
                    s.align === "center" && "justify-center",
                  )}
                >
                  {s.actions}
                </div>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
