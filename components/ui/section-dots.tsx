"use client";

import { SECTIONS } from "@/lib/sections";
import { useActiveSection } from "@/hooks/use-active-section";

// Marcador mínimo de "dónde estoy": solo puntos, sin pastilla ni etiquetas flotantes.
export function SectionDots() {
  const active = useActiveSection() ?? "inicio";

  return (
    <nav
      aria-label="Secciones de la página"
      className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center xl:flex"
    >
      {SECTIONS.map((s) => {
        const isActive = active === s.id;
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="flex h-6 w-5 items-center justify-center focus-visible:outline-2 focus-visible:outline-brand"
            aria-label={s.label}
            aria-current={isActive ? "location" : undefined}
          >
            <span
              className={`rounded-full ring-1 ring-paper ${isActive ? "size-2 bg-brand" : "size-1.5 bg-ink/40"}`}
            />
          </a>
        );
      })}
    </nav>
  );
}
