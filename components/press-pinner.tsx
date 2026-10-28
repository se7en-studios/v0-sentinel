"use client";

import { useEffect } from "react";

const PIN_MQ = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";

// En escritorio la prensa se clava y la rueda del mouse mueve las notas de costado.
export function PressPinner() {
  useEffect(() => {
    const root = document.getElementById("prensa-pin");
    const view = root?.querySelector<HTMLElement>("[data-press-view]");
    const track = view?.querySelector<HTMLElement>("ul");
    if (!root || !view || !track) return;
    let cancelled = false;
    let revert = () => {};
    void import("@/lib/gsap").then(({ gsap, ScrollTrigger }) => {
      if (cancelled) return;
      const mm = gsap.matchMedia();
      mm.add(PIN_MQ, () => {
        root.setAttribute("data-pin", "");
        const dist = () => Math.max(0, track.scrollWidth - view.clientWidth);
        gsap.to(track, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: () => `+=${Math.round(dist() * 1.1)}`,
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            refreshPriority: -4,
          },
        });
        return () => root.removeAttribute("data-pin");
      });
      const t = window.setTimeout(() => ScrollTrigger.refresh(), 700);
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
