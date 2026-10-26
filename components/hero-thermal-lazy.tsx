"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Thermometer } from "lucide-react";

const HeroThermal = dynamic(
  () => import("@/components/hero-thermal").then((m) => m.HeroThermal),
  { ssr: false },
);

// ponytail: la capa térmica (filtro SVG sobre la foto a pantalla completa) cuesta ~1,5 s de CPU en
// móviles lentos, así que no existe hasta que alguien la pide: tocar el botón o, en desktop, mover el mouse.
type Mode = "idle" | "hover" | "full";

export function HeroThermalLazy() {
  const [mode, setMode] = useState<Mode>("idle");

  useEffect(() => {
    if (mode !== "idle") return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const host = document.querySelector<HTMLElement>("[data-nav-dark]");
    if (!host) return;
    const wake = () => setMode("hover");
    host.addEventListener("pointermove", wake, { once: true, passive: true });
    return () => host.removeEventListener("pointermove", wake);
  }, [mode]);

  if (mode !== "idle") return <HeroThermal startFull={mode === "full"} />;

  return (
    <div className="absolute right-5 top-[4.5rem] z-20 md:right-8 md:top-24">
      <button
        type="button"
        aria-pressed={false}
        onClick={() => setMode("full")}
        className="glass inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-[#f4efe2] transition-colors hover:border-[#f4efe2]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <Thermometer className="size-4" aria-hidden />
        Visión térmica
      </button>
    </div>
  );
}
