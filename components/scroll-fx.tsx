"use client";

import { useEffect } from "react";

// Efectos globales livianos. El loop de rAF se duerme cuando no hay nada que animar y solo escribe donde se ve:
//  --vel     velocidad de scroll suavizada (-1..1), escrita SOLO en las cintas visibles (en :root invalidaba el estilo de toda la página)
//  --mx/--my posición del mouse dentro de la tarjeta bajo el cursor: foco de luz que la sigue
//  hero      el peso de cada palabra del título crece cuando el mouse se acerca (solo con el hero a la vista)
export function ScrollFx() {
  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const fine = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    let lastY = window.scrollY;
    let vel = 0;
    let mouse: { x: number; y: number } | null = null;
    let card: HTMLElement | null = null;
    let moved = false;
    let heroVisible = true;
    let raf = 0;

    const words =
      fine && !reduce
        ? [
            ...document.querySelectorAll<HTMLElement>(
              "[data-hero-word]:not(.a-em)",
            ),
          ]
        : [];
    const weights = words.map(() => 700);
    const ribbons = new Set<HTMLElement>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement;
        if (el.id === "inicio") heroVisible = e.isIntersecting;
        else if (e.isIntersecting) ribbons.add(el);
        else {
          ribbons.delete(el);
          el.style.removeProperty("--vel");
        }
      }
      wake();
    });
    document
      .querySelectorAll<HTMLElement>(".a-marquee")
      .forEach((el) => io.observe(el));
    const hero = document.getElementById("inicio");
    if (hero && words.length) io.observe(hero);

    const tick = () => {
      raf = 0;
      let busy = false;

      const y = window.scrollY;
      const target = reduce ? 0 : Math.max(-1, Math.min(1, (y - lastY) / 60));
      lastY = y;
      vel += (target - vel) * 0.12;
      if (Math.abs(vel) < 0.002) vel = 0;
      else busy = true;
      const v = vel.toFixed(3);
      ribbons.forEach((el) => el.style.setProperty("--vel", v));

      if (mouse && card && moved) {
        const b = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${mouse.x - b.left}px`);
        card.style.setProperty("--my", `${mouse.y - b.top}px`);
        card.style.setProperty(
          "--ry",
          `${((mouse.x - b.left) / b.width - 0.5) * 7}deg`,
        );
        card.style.setProperty(
          "--rx",
          `${(0.5 - (mouse.y - b.top) / b.height) * 5}deg`,
        );
      }
      moved = false;

      if (mouse && heroVisible && words.length) {
        // Primero se leen todas las posiciones y después se escriben los pesos: sin layout forzado entre palabra y palabra.
        const m = mouse;
        const wants = words.map((w) => {
          const b = w.getBoundingClientRect();
          const d = Math.hypot(
            m.x - (b.left + b.width / 2),
            m.y - (b.top + b.height / 2),
          );
          return 700 + Math.max(0, 1 - d / 320) * 200; // 700 → 900 cerca del cursor
        });
        words.forEach((w, i) => {
          const next = weights[i] + (wants[i] - weights[i]) * 0.14;
          if (Math.abs(wants[i] - next) > 0.5) busy = true;
          if (Math.round(next) !== Math.round(weights[i]))
            w.style.fontWeight = String(Math.round(next));
          weights[i] = next;
        });
      }
      if (busy) raf = requestAnimationFrame(tick);
    };
    function wake() {
      if (!raf) raf = requestAnimationFrame(tick);
    }

    const onMove = (e: PointerEvent) => {
      mouse = { x: e.clientX, y: e.clientY };
      card =
        (e.target as HTMLElement | null)?.closest<HTMLElement>(".a-card") ??
        null;
      moved = true;
      wake();
    };
    const onLeave = () => {
      mouse = null;
      card = null;
    };
    window.addEventListener("scroll", wake, { passive: true });
    if (fine) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
    }
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("scroll", wake);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);
  return null;
}
