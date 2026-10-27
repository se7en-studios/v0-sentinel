"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export type CircularItem = { src: string; alt: string };

const CARD_W = 250;
const CARD_H = 333;

// Galería circular 3D (adaptada de 21st.dev): las fotos giran solas alrededor de un eje.
// A diferencia del original, el giro es una animación CSS (compositor) y no un setState por cuadro, y se pausa
// fuera de pantalla y con el mouse encima para no gastar CPU.
export function CircularGallery({ items, className = "" }: { items: CircularItem[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => el.setAttribute("data-run", String(e.isIntersecting)),
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // radio para que las tarjetas no se pisen (con 15 % de aire)
  const radius = Math.round((CARD_W * 1.15) / (2 * Math.tan(Math.PI / items.length)));
  const step = 360 / items.length;

  return (
    <div
      ref={ref}
      data-run="false"
      role="group"
      aria-label="Galería de fotos del equipo en eventos"
      className={`a-ring-wrap relative flex items-center justify-center ${className}`}
      style={{ perspective: "1700px" }}
    >
      <div className="a-ring relative" style={{ width: CARD_W, height: CARD_H, transformStyle: "preserve-3d" }}>
        {items.map((it, i) => (
          <figure
            key={it.src}
            className="absolute inset-0 m-0 overflow-hidden rounded-xl border border-white/25 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8)]"
            style={{ transform: `rotateY(${i * step}deg) translateZ(${radius}px)`, backfaceVisibility: "hidden", willChange: "transform" }}
          >
            <Image src={it.src} alt={it.alt} fill sizes="640px" quality={90} loading="lazy" className="object-cover" />
          </figure>
        ))}
      </div>
    </div>
  );
}
