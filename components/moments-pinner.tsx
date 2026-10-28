"use client";

import { useEffect } from "react";

const PIN_MQ = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";

// En escritorio la sección Momentos se clava y la rueda del mouse hace girar la galería (en vez de bajar la página).
// En celular y con movimiento reducido no hace nada: la galería gira sola o queda como grilla.
export function MomentsPinner() {
  useEffect(() => {
    const root = document.getElementById("momentos");
    const ring = root?.querySelector<HTMLElement>(".a-ring");
    if (!root || !ring) return;
    let cancelled = false;
    let revert = () => {};
    void import("@/lib/gsap").then(({ gsap, ScrollTrigger }) => {
      if (cancelled) return;
      const mm = gsap.matchMedia();
      mm.add(PIN_MQ, () => {
        root.setAttribute("data-pin", "");
        gsap.fromTo(
          ring,
          { "--ry": "0deg" },
          {
            "--ry": "-360deg",
            ease: "none",
            scrollTrigger: {
              trigger: root,
              start: "top top",
              end: "+=260%",
              pin: true,
              scrub: 0.8,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              refreshPriority: -3,
            },
          },
        );
        return () => root.removeAttribute("data-pin");
      });
      // los pines de más arriba (Reconocimientos) agregan su espacio al cargar: recalcular al final
      const t = window.setTimeout(() => ScrollTrigger.refresh(), 600);
      revert = () => {
        window.clearTimeout(t);
        mm.revert();
      };
    });
    return () => {
      cancelled = true;
      revert();
    };
  }, []);
  return null;
}
