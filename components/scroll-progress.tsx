"use client";

import { useEffect, useRef } from "react";

export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Se desliza (no se escala) para que el degradé verde→ember quede fijo y se revele.
    // Escribe directo al DOM (sin setState) y como máximo una vez por frame.
    let ticking = false;
    const update = () => {
      ticking = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (bar.current) bar.current.style.transform = `translateX(${(p - 1) * 100}%)`;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div aria-hidden className="fixed top-0 left-0 right-0 z-[100] h-0.5 overflow-hidden">
      <div
        ref={bar}
        className="h-full w-full bg-gradient-to-r from-leaf via-leaf-bright to-ember will-change-transform"
        style={{ transform: "translateX(-100%)" }}
      />
    </div>
  );
}
