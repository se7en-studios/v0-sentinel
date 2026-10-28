"use client";

import { useEffect, useRef } from "react";

// Video del mundo (un chico camina sobre la Tierra con satélites alrededor). Va anclado abajo a la derecha y
// sus bordes se funden con el fondo. Con reduced-motion o ahorro de datos queda el póster fijo; sin pantalla, pausa.
export function HeroWorldVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const conn = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    if (
      conn?.saveData ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    // El video no se pide hasta que la página terminó de cargar: así el póster es lo que pinta primero (LCP)
    // y los 300 KB–1,2 MB del mp4 no compiten con el resto de los recursos.
    let io: IntersectionObserver | undefined;
    const start = () => {
      // ponytail: <source media> no sirve en <video>; el archivo se elige acá (celular = 360p, ~300 KB).
      v.src = window.matchMedia("(max-width: 767px)").matches
        ? "/video/hero-mundo-m.mp4"
        : "/video/hero-mundo.mp4";
      io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) void v.play().catch(() => {});
          else v.pause();
        },
        { threshold: 0.05 },
      );
      io.observe(v);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      io?.disconnect();
    };
  }, []);

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="none"
      poster="/video/hero-mundo-poster.webp"
      aria-hidden
      tabIndex={-1}
      className="pointer-events-none absolute bottom-[-2%] right-[-7%] h-[78%] w-auto max-w-none [mask-image:radial-gradient(ellipse_60%_66%_at_55%_55%,#000_52%,transparent_100%)] max-md:[mask-image:radial-gradient(ellipse_54%_50%_at_52%_50%,#000_58%,transparent_100%)] max-md:bottom-auto max-md:top-[7%] max-md:right-[-14%] max-md:h-[37%]"
    >
    </video>
  );
}
