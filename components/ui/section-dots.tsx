"use client";

import { SECTIONS } from "@/lib/sections";
import { useActiveSection } from "@/hooks/use-active-section";

// Complementa la barra de progreso ("cuánto") con "dónde". Va sobre una
// pastilla clara para leerse tanto en capítulos claros como oscuros.
export function SectionDots() {
  const active = useActiveSection() ?? "inicio";

  return (
    <nav
      aria-label="Secciones de la página"
      className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-1 rounded-full border border-black/10 bg-[#faf7f0]/90 py-2 shadow-sm xl:flex"
    >
      {SECTIONS.map((s) => {
        const isActive = active === s.id;
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="group relative flex h-6 w-6 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-[#0f7a4f]"
            aria-label={s.label}
            aria-current={isActive ? "location" : undefined}
          >
            <span className="t-label pointer-events-none absolute right-8 whitespace-nowrap rounded-sm bg-charcoal px-2.5 py-1 normal-case tracking-normal text-[#f4efe2] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
              {s.label}
            </span>
            <span
              className={`rounded-full transition-all duration-300 ${
                isActive ? "h-2.5 w-2.5 bg-leaf" : "h-1.5 w-1.5 bg-[#1a1812]/45"
              }`}
            />
          </a>
        );
      })}
    </nav>
  );
}
