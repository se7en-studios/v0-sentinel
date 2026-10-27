"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CssGlobe } from "@/components/ui/css-globe";
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
  { top: 30, left: 50, scale: 1 },
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
    <div className="relative">
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
            className={cn(
              "transition-opacity duration-700",
              active === sections.length - 1 || mobile
                ? "opacity-45"
                : "opacity-95",
            )}
          />
        </div>
      </div>

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
              <p className={cn("a-eyebrow", s.align !== "center" && "!text-left")}>{s.badge}</p>
              <h2 className="a-display mt-4 !text-[clamp(2.5rem,6vw,5.5rem)]">
                {s.title}
                {s.subtitle ? (
                  <span className="block text-a-mute">{s.subtitle}</span>
                ) : null}
              </h2>
              <p
                className={cn(
                  "a-sub mt-6 max-w-xl",
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
