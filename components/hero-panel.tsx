"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { CLAIMS } from "@/lib/claims";

// Chips de EJEMPLO sobre la captura real: ilustran el flujo, no son datos en vivo.
const CHIPS = [
  {
    text: "Anomalía térmica · VIIRS 14:32",
    dot: "bg-ember",
    pos: "left-[2%] top-[14%]",
    depth: 18,
  },
  {
    text: `Alerta enviada a brigada · ${CLAIMS.detectionMinutes} min objetivo`,
    dot: "bg-leaf-bright",
    pos: "right-[12%] top-[56%]",
    depth: 30,
  },
];

// Producto como héroe: captura real inclinada que sangra fuera de la grilla.
// El tilt al mover el mouse solo corre con puntero fino y sin reduced-motion;
// escribe dos variables CSS por frame (sin setState).
export function HeroPanel() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const host = el?.closest("section");
    if (!el || !host) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const set = (x: number, y: number) => {
      el.style.setProperty("--px", x.toFixed(3));
      el.style.setProperty("--py", y.toFixed(3));
    };
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = host.getBoundingClientRect();
        set(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
      });
    };
    const onLeave = () => set(0, 0);
    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="relative mt-10 lg:absolute lg:right-[-6vw] lg:top-[15%] lg:mt-0 lg:w-[54vw] lg:max-w-[1080px]"
    >
      <div
        className="max-h-[300px] overflow-hidden px-5 [mask-image:linear-gradient(to_bottom,#000_55%,transparent)] sm:max-h-[420px] lg:max-h-none lg:overflow-visible lg:px-0 lg:[mask-image:none]"
      >
        {/* Máscara de escritorio: se funde hacia el fondo (abajo) y hacia el texto (izquierda). */}
        <div
          className="lg:[mask-composite:intersect] lg:[-webkit-mask-composite:source-in] lg:[mask-image:linear-gradient(to_bottom,#000_58%,transparent_96%),linear-gradient(to_right,transparent,#000_22%)] lg:[perspective:1800px]"
        >
          <div
            className="w-[118%] max-w-none transition-transform duration-200 ease-out will-change-transform sm:w-full lg:[transform:rotateY(calc(-9deg_+_var(--px,0)_*_3deg))_rotateX(calc(5deg_-_var(--py,0)_*_2.5deg))_scale(1.02)]"
          >
            <div className="browser-frame">
              <Image
                src="/product/panel-3d-hero.webp"
                alt="Captura del panel de Sentinel: mapa satelital en 3D de la Patagonia con focos térmicos, indicadores y línea de tiempo."
                width={2000}
                height={1250}
                sizes="(min-width: 1024px) 54vw, 118vw"
                className="block h-auto w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <p className="t-label mt-3 hidden text-[#f4efe2]/70 lg:block">Captura del panel de Sentinel</p>

      {CHIPS.map((c) => (
        <div
          key={c.text}
          className={`glass absolute hidden items-center gap-3 rounded-xl px-4 py-3 text-[#f4efe2] lg:flex ${c.pos}`}
          style={{ transform: `translate(calc(var(--px, 0) * ${-c.depth}px), calc(var(--py, 0) * ${-c.depth}px))` }}
        >
          <span aria-hidden className="relative flex size-2.5">
            <span className={`absolute inline-flex size-full rounded-full opacity-60 motion-safe:animate-ping ${c.dot}`} />
            <span className={`relative inline-flex size-2.5 rounded-full ${c.dot}`} />
          </span>
          <span className="text-sm font-medium">{c.text}</span>
          <span className="t-label rounded-full bg-white/10 px-2 py-0.5 text-[#f4efe2]/80">Ejemplo</span>
        </div>
      ))}
    </div>
  );
}
