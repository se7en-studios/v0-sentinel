"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

// Registro único: importar siempre desde acá (solo cliente, solo landing).
if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger, SplitText);

// Un solo ScrollTrigger.refresh() agrupado: varios componentes lo pedían por separado al montar (cada uno fuerza layout global).
let refreshQueued = false;
export function refreshSoon() {
  if (refreshQueued || typeof window === "undefined") return;
  refreshQueued = true;
  gsap.delayedCall(0.25, () => {
    refreshQueued = false;
    ScrollTrigger.refresh();
  });
}

export { gsap, ScrollTrigger, SplitText };
