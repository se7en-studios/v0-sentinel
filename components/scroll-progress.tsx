"use client";

import { useEffect, useRef } from "react";

export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Escribe directo al DOM (sin setState), como máximo una vez por frame.
    let ticking = false;
    const update = () => {
      ticking = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (bar.current)
        bar.current.style.transform = `translateX(${(p - 1) * 100}%)`;
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
    <div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[100] h-px overflow-hidden"
    >
      <div
        ref={bar}
        className="h-full w-full bg-brand will-change-transform"
        style={{ transform: "translateX(-100%)" }}
      />
    </div>
  );
}
