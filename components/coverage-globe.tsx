"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { GlobeMarker, Globe3DConfig } from "@/components/ui/3d-globe";

// three + react-three-fiber pesan bastante: se cargan solo en el cliente y recién cuando la sección está cerca.
const Globe3D = dynamic(
  () => import("@/components/ui/3d-globe").then((m) => m.Globe3D),
  {
    ssr: false,
    loading: () => <div aria-hidden className="h-full w-full" />,
  },
);

const EMBER = "#ff6a2b";

// Zonas con incendios forestales grandes y recurrentes. Ilustrativo: no son focos en tiempo real.
const MARKERS: GlobeMarker[] = [
  {
    lat: -42.0,
    lng: -71.6,
    label: "Patagonia andina · donde trabaja Sentinel",
    color: "#ffc247",
  },
  { lat: -31.4, lng: -64.5, label: "Sierras de Córdoba", color: EMBER },
  { lat: -8, lng: -60, label: "Amazonia", color: EMBER },
  { lat: 37, lng: -120, label: "California", color: EMBER },
  { lat: 40, lng: -8, label: "Portugal", color: EMBER },
  { lat: -35, lng: 148, label: "Sudeste de Australia", color: EMBER },
  { lat: -3, lng: 23, label: "África central", color: EMBER },
];

// Reduced-motion: globo quieto. Táctil: no se arrastra, para que la página siga scrolleando.
// El globo solo se pinta en el cliente (ssr: false), así que leer matchMedia acá no desajusta la hidratación.
function buildConfig(): Globe3DConfig {
  const still = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  return {
    initialLat: -20,
    initialLng: -62,
    autoRotateSpeed: still ? 0 : 0.2,
    enableRotate: !touch && !still,
    bumpScale: 4,
  };
}

export function CoverageGlobe() {
  const config = useMemo(() => buildConfig(), []);
  return <Globe3D className="h-full w-full" markers={MARKERS} config={config} />;
}
