"use client";

import { useEffect } from "react";

// Marca con data-off las cintas y capítulos con animación infinita que no están en pantalla,
// y el CSS (globals.css) las pausa: menos trabajo para el navegador al scrollear.
export function PauseOffscreen() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".a-marquee, [data-pause-offscreen]");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.removeAttribute("data-off");
          else e.target.setAttribute("data-off", "");
        }),
      { rootMargin: "200px 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
