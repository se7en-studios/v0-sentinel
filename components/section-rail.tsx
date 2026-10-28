"use client";

import { useEffect, useState } from "react";
import { useCopy } from "@/lib/i18n/client";
import type { Copy } from "@/lib/i18n";

const STOP_IDS = ["propuesta", "problema", "plataforma", "en-vivo", "para-quien", "mundo", "equipo", "momentos", "contacto"];

const COPY: Copy<{ nav: string; labels: string[] }> = {
  es: {
    nav: "Recorrido de la página",
    labels: ["Qué hace", "El problema", "Cómo funciona", "En vivo", "Para quién", "El mundo", "Equipo", "Momentos", "Contacto"],
  },
  en: {
    nav: "Page tour",
    labels: ["What it does", "The problem", "How it works", "Live", "Who it's for", "The world", "Team", "Moments", "Contact"],
  },
};

// Riel de navegación a la izquierda (solo escritorio): un punto de brasa marca dónde estás en el recorrido.
export function SectionRail() {
  const [active, setActive] = useState(-1);
  const c = useCopy(COPY);
  const STOPS = STOP_IDS.map((id, i) => ({ id, label: c.labels[i] }));

  useEffect(() => {
    const els = STOP_IDS.map((id) => document.getElementById(id));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(els.indexOf(e.target as HTMLElement));
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <nav
      aria-label={c.nav}
      className="pointer-events-none fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 xl:block"
      style={{ opacity: active < 0 ? 0 : 1, transition: "opacity .5s" }}
    >
      <ol className="pointer-events-auto relative grid gap-3.5">
        <span aria-hidden className="absolute bottom-1 left-[5px] top-1 w-px bg-white/15" />
        {STOPS.map((s, i) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              aria-label={s.label}
              aria-current={i === active ? "location" : undefined}
              className="group relative flex items-center gap-3 py-0.5"
            >
              <span
                aria-hidden
                className={`relative z-10 block size-[11px] rounded-full border transition-all duration-500 ${
                  i === active
                    ? "scale-125 border-[#ffb27a] bg-[#ff7a45] shadow-[0_0_14px_3px_rgba(255,122,69,0.75)]"
                    : i < active
                      ? "border-[#a9efc9]/60 bg-[#a9efc9]/50"
                      : "border-white/30 bg-[#0c1310]"
                }`}
              />
              <span className="whitespace-nowrap rounded-full bg-black/60 px-2.5 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-[#e3f6dc] opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                {s.label}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
