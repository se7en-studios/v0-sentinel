"use client";

import { SECTIONS } from "@/lib/sections";
import { useActiveSection } from "@/hooks/use-active-section";

// ponytail: complements the linear top ScrollProgress bar — that one shows
// "how far", this shows "where", so people can jump straight to a section
// on a page this long instead of scroll-hunting for it.
export function SectionDots() {
  const active = useActiveSection() ?? "inicio";

  return (
    <nav aria-label="Secciones de la página" className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col gap-4">
      {SECTIONS.map((s) => {
        const isActive = active === s.id;
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="group relative flex items-center justify-end p-2 -m-1 rounded-full focus-visible:outline-2 focus-visible:outline-[#0f7a4f]"
            aria-label={s.label}
            aria-current={isActive ? "location" : undefined}
          >
            <span
              className="absolute right-5 group-focus-visible:opacity-100 whitespace-nowrap text-[10px] tracking-wide px-2.5 py-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
              style={{
                fontFamily: "var(--font-sans)",
                background: "rgba(12,11,9,0.92)",
                border: "0.5px solid rgba(26,24,18,0.15)",
                color: "rgba(240,234,216,0.9)",
                backdropFilter: "blur(6px)",
              }}
            >
              {s.label}
            </span>
            <span
              className="rounded-full transition-all duration-300"
              style={{
                width: isActive ? 8 : 6,
                height: isActive ? 8 : 6,
                background: isActive ? "#0f7a4f" : "rgba(26,24,18,0.55)",
                boxShadow: isActive ? "0 0 8px #0f7a4f" : "none",
              }}
            />
          </a>
        );
      })}
    </nav>  );
}
