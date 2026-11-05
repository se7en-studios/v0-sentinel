"use client";

import type { COBEOptions } from "cobe";
import { Globe } from "@/components/ui/globe";

// Globo oscuro centrado en la Patagonia; los puntos naranja son focos de ejemplo (el dato en vivo está en la sección "En vivo").
const CONFIG: COBEOptions = {
  width: 800,
  height: 800,
  devicePixelRatio: 1.5,
  phi: 5.95, // longitud ~ -71° al frente
  theta: -0.5,
  dark: 1,
  diffuse: 1.1,
  mapSamples: 10000,
  mapBrightness: 6,
  baseColor: [0.16, 0.3, 0.42],
  markerColor: [1, 0.55, 0.25],
  glowColor: [0.2, 0.27, 0.36],
  markers: [
    { location: [-41.13, -71.31], size: 0.035 }, // Bariloche
    { location: [-41.96, -71.53], size: 0.028 }, // El Bolsón
    { location: [-42.91, -71.32], size: 0.028 }, // Esquel
    { location: [-40.76, -71.65], size: 0.025 }, // Villa La Angostura
    { location: [-38.95, -68.06], size: 0.028 }, // Neuquén
    { location: [-39.03, -67.58], size: 0.02 }, // Río Negro
  ],
};

export function HeroGlobe() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute bottom-[-4%] right-[1%] aspect-square w-[min(60vw,820px)] max-md:bottom-auto max-md:top-[6%] max-md:right-[-18%] max-md:w-[96vw]"
    >
      <Globe config={CONFIG} className="max-w-none" />
    </div>
  );
}
