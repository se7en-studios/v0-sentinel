"use client";

import { useEffect } from "react";

// Efectos globales livianos (una sola rAF, solo escriben variables CSS):
//  --vel     velocidad de scroll suavizada (-1..1): las cintas se inclinan al scrollear rápido
//  --mx/--my posición del mouse dentro de la tarjeta bajo el cursor: foco de luz que la sigue
//  hero      el peso de cada palabra del título crece cuando el mouse se acerca (eje de peso de Archivo)
export function ScrollFx() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const root = document.documentElement;
    let lastY = window.scrollY;
    let vel = 0;
    let mouse: { x: number; y: number } | null = null;
    let card: HTMLElement | null = null;
    const words = fine && !reduce ? [...document.querySelectorAll<HTMLElement>("[data-hero-word]:not(.a-em)")] : [];
    const weights = words.map(() => 700);
    let raf = 0;

    const tick = () => {
      const y = window.scrollY;
      const target = reduce ? 0 : Math.max(-1, Math.min(1, (y - lastY) / 60));
      lastY = y;
      vel += (target - vel) * 0.12;
      if (Math.abs(vel) < 0.002) vel = 0;
      root.style.setProperty("--vel", vel.toFixed(3));

      if (mouse && card) {
        const b = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${mouse.x - b.left}px`);
        card.style.setProperty("--my", `${mouse.y - b.top}px`);
        card.style.setProperty("--ry", `${((mouse.x - b.left) / b.width - 0.5) * 7}deg`);
        card.style.setProperty("--rx", `${(0.5 - (mouse.y - b.top) / b.height) * 5}deg`);
      }
      if (mouse && words.length) {
        words.forEach((w, i) => {
          const b = w.getBoundingClientRect();
          const d = Math.hypot(mouse!.x - (b.left + b.width / 2), mouse!.y - (b.top + b.height / 2));
          const want = 700 + Math.max(0, 1 - d / 320) * 200; // 700 → 900 cerca del cursor
          weights[i] += (want - weights[i]) * 0.14;
          w.style.fontWeight = String(Math.round(weights[i]));
        });
      }
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      mouse = { x: e.clientX, y: e.clientY };
      card = (e.target as HTMLElement | null)?.closest<HTMLElement>(".a-card") ?? null;
    };
    const onLeave = () => {
      mouse = null;
      card = null;
    };
    if (fine) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
    }
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);
  return null;
}
