"use client";

import { useState } from "react";
import { Maximize2, Minimize2, Video, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Ctx } from "./ctx";
import { ThermalCam } from "./thermal-cam";

/** Floating camera window over the map, like the reference drone view. Simulated feed. */
export function DronePip({ ctx }: { ctx: Ctx }) {
  const [open, setOpen] = useState(true);
  const [big, setBig] = useState(false);
  const [mode, setMode] = useState<"ir" | "eo">("ir");
  const d =
    ctx.drones.find((x) => x.spec.id === ctx.activeDrone && x.track) ??
    ctx.drones.find((x) => x.track);

  if (!d?.track) {
    return null;
  }
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="glass absolute right-3 top-[4.25rem] z-10 flex h-9 items-center gap-2 rounded-xl border border-[var(--hairline)] px-3 text-[12px] font-medium shadow-[var(--shadow-1)]"
      >
        <Video className="size-3.5 text-[var(--fire)]" aria-hidden /> Cámara{" "}
        {d.spec.name}
      </button>
    );
  }
  const fire = ctx.fires.length > 0;
  const mm = String(Math.floor(((ctx.now / 1000) % 3600) / 60)).padStart(
    2,
    "0",
  );
  const ss = String(Math.floor((ctx.now / 1000) % 60)).padStart(2, "0");
  const [lng, lat] = d.track.pos;
  return (
    <figure
      className={cn(
        "absolute right-3 top-[4.25rem] z-10 overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[var(--shadow-2)] transition-[width] duration-200",
        big
          ? "w-[min(34rem,calc(100%-1.5rem))]"
          : "w-[min(20rem,calc(100%-1.5rem))]",
      )}
      aria-label={`Cámara de ${d.spec.name} (simulada)`}
    >
      <div
        className={cn(
          "relative",
          mode === "eo" &&
            "[&_canvas]:[filter:grayscale(1)_contrast(1.15)_brightness(0.8)_sepia(0.5)_hue-rotate(60deg)]",
        )}
      >
        <ThermalCam seed={d.spec.id} hot={fire} />
        <div className="pointer-events-none absolute inset-0 font-mono text-[9px] leading-tight text-[#a8ffd0] [text-shadow:0_0_4px_rgba(0,0,0,0.9)]">
          <div className="absolute left-2 top-1.5">
            <span className="text-[#ff6b5a]">● REC</span> 00:{mm}:{ss}
            <br />
            {d.spec.name} · {mode === "ir" ? "IR TÉRMICO" : "EO VISIBLE"}
          </div>
          <div className="absolute right-2 top-1.5 text-right">
            ENLACE SEGURO
            <br />
            {d.telem.signal} dBm
          </div>
          <div className="absolute bottom-1.5 left-2">
            ALT {d.telem.altitude} m
            <br />
            VEL {d.telem.speed} km/h · RMB {Math.round(d.track.heading)}°
          </div>
          <div className="absolute bottom-1.5 right-2 text-right">
            {lat.toFixed(4)}, {lng.toFixed(4)}
            <br />
            BAT {d.telem.battery}%
          </div>
        </div>
      </div>
      <figcaption className="flex items-center gap-1 bg-[#0c0b09] px-2 py-1.5 text-white">
        <span className="mr-auto text-[10.5px] font-semibold tracking-wide">
          {d.spec.name} · simulado
        </span>
        {(["ir", "eo"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              "rounded-md px-2 py-1.5 text-[10px] font-bold uppercase transition-colors sm:py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              mode === m
                ? "bg-[var(--fire)] text-white"
                : "text-white/55 hover:text-white",
            )}
          >
            {m}
          </button>
        ))}
        <button
          type="button"
          aria-label={big ? "Reducir cámara" : "Ampliar cámara"}
          onClick={() => setBig(!big)}
          className="grid size-8 place-items-center rounded-md text-white/60 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-6"
        >
          {big ? (
            <Minimize2 className="size-3" />
          ) : (
            <Maximize2 className="size-3" />
          )}
        </button>
        <button
          type="button"
          aria-label="Cerrar cámara"
          onClick={() => setOpen(false)}
          className="grid size-8 place-items-center rounded-md text-white/60 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-6"
        >
          <X className="size-3" />
        </button>
      </figcaption>
    </figure>
  );
}
