"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __lenis?: { scrollTo: (t: string | HTMLElement | number, o?: { offset?: number }) => void };
  }
}

// Lenis solo con puntero fino y sin reduced-motion; en táctil el scroll nativo es mejor.
export function SmoothScroll() {
  useEffect(() => {
    const skip = window.matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)");
    if (skip.matches) return;
    let cancelled = false;
    let cleanup = () => {};

    void Promise.all([import("lenis"), import("@/lib/gsap")]).then(([{ default: Lenis }, { gsap, ScrollTrigger }]) => {
      if (cancelled) return;
      const lenis = new Lenis({ lerp: 0.1, anchors: { offset: -80 } });
      const html = document.documentElement;
      const prevBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = "auto";
      window.__lenis = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (t: number) => lenis.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      cleanup = () => {
        gsap.ticker.remove(tick);
        lenis.destroy();
        delete window.__lenis;
        html.style.scrollBehavior = prevBehavior;
      };
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  // Las secciones fijas (pin) calculan su posición al montar; el mapa, las fotos y los videos cargan
  // después y cambian el alto de la página. Recalcular cuando eso pasa evita secciones superpuestas.
  useEffect(() => {
    if (!window.matchMedia("(min-width: 1024px) and (prefers-reduced-motion: no-preference)").matches) return;
    let timer = 0;
    let stop = () => {};
    void import("@/lib/gsap").then(({ ScrollTrigger }) => {
      let lastH = 0;
      const refresh = () => {
        const h = document.documentElement.scrollHeight;
        if (Math.abs(h - lastH) < 3) return; // evita bucles: refresh() cambia los espaciadores del pin
        lastH = h;
        window.clearTimeout(timer);
        timer = window.setTimeout(() => ScrollTrigger.refresh(), 200);
      };
      const ro = new ResizeObserver(refresh);
      ro.observe(document.body);
      window.addEventListener("load", refresh);
      void document.fonts?.ready.then(refresh);
      refresh();
      stop = () => {
        ro.disconnect();
        window.removeEventListener("load", refresh);
        window.clearTimeout(timer);
      };
    });
    return () => stop();
  }, []);

  return null;
}
