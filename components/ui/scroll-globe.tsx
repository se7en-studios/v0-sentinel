"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CssGlobe } from "@/components/ui/css-globe";
import { SplitReveal } from "@/components/ui/split-reveal";
import { cn } from "@/lib/utils";
import { useCopy } from "@/lib/i18n/client";
import type { Copy } from "@/lib/i18n";

const CHAPTERS: Copy<string> = { es: "Capítulos", en: "Chapters" };

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
  { top: 86, left: 50, scale: 0.9 },
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

// Focos de calor sobre el mapa (lat, lon reales de la cordillera patagónica y otros puntos del mundo).
// Aparecen desde "Verificar"; en "Contexto" se suman más. Giran con la Tierra.
const DOTS = [
  { lat: -41.1, lon: -71.3, delay: 0 }, // Bariloche
  { lat: -42.9, lon: -71.3, delay: 0.5 }, // Esquel
  { lat: -39.0, lon: -70.9, delay: 1 }, // Neuquén cordillera
  { lat: -43.3, lon: -71.5, delay: 0.3 }, // Chubut
  { lat: -33.0, lon: -68.9, delay: 0.8, more: true }, // Mendoza
  { lat: -31.4, lon: -64.2, delay: 1.2, more: true }, // Córdoba
  { lat: -24.8, lon: -65.4, delay: 0.6, more: true }, // Salta
  { lat: -12, lon: -55, delay: 0.2, more: true }, // Amazonia
  { lat: 37, lon: -120, delay: 0.9, more: true }, // California
  { lat: -25, lon: 135, delay: 0.4, more: true }, // Australia
  { lat: 39, lon: -8, delay: 1.1, more: true }, // Portugal
];

// El globo es fijo (sticky) y se mueve según la sección que está en el centro de la pantalla.
export function ScrollGlobe({
  sections,
  positions = DEFAULT_POSITIONS,
}: {
  sections: ScrollGlobeSection[];
  positions?: Pos[];
}) {
  const chapters = useCopy(CHAPTERS);
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
    <div data-pause-offscreen className="a-glow relative">
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
          <CssGlobe
            dots={DOTS}
            showDots={active >= 1}
            denseDots={active >= 2}
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
        aria-label={chapters}
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
                className="a-display mt-5 !text-[clamp(2rem,4.2vw,4rem)] !leading-[1.02] !tracking-[-0.03em] [text-shadow:0_2px_30px_rgba(0,0,0,0.5)]"
              >
                {s.title}
                {s.subtitle ? (
                  <span className="block bg-gradient-to-r from-[#a9efc9] via-[#d8f5cf] to-[#ffb27a] bg-clip-text text-transparent">
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
                      className="rounded-xl border border-a-line bg-a-bg/85 p-4 text-left"
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
