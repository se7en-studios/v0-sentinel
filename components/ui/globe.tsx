"use client";

import createGlobe, { COBEOptions } from "cobe";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const GLOBE_CONFIG: COBEOptions = {
  width: 800,
  height: 800,
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.3,
  dark: 0,
  diffuse: 0.6,
  mapSamples: 16000,
  mapBrightness: 4,
  baseColor: [0.87, 0.84, 0.76],
  markerColor: [15 / 255, 122 / 255, 79 / 255],
  glowColor: [0.96, 0.94, 0.89],
  markers: [
    { location: [-41.1335, -71.3103], size: 0.12 }, // Bariloche / Patagonia
    { location: [-34.6037, -58.3816], size: 0.06 }, // CABA
    { location: [-32.8895, -68.8458], size: 0.05 }, // Mendoza
    { location: [-27.4698, -58.8306], size: 0.05 }, // Corrientes
    { location: [-12.0464, -77.0428], size: 0.04 }, // Lima (Impact Startup Competition Perú)
    { location: [38.7223, -9.1393], size: 0.04 }, // Lisboa (Softlanding Europa)
  ],
};

export function Globe({
  className,
  config = GLOBE_CONFIG,
}: {
  className?: string;
  config?: COBEOptions;
}) {
  const phiRef = useRef(config.phi);
  const widthRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const rRef = useRef(0);

  const updatePointerInteraction = (value: number | null) => {
    pointerInteracting.current = value;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value ? "grabbing" : "grab";
    }
  };

  const updateMovement = (clientX: number) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current;
      pointerInteractionMovement.current = delta;
      rRef.current = delta / 200;
    }
  };

  const onResize = () => {
    if (canvasRef.current) {
      widthRef.current = canvasRef.current.offsetWidth;
    }
  };

  useEffect(() => {
    window.addEventListener("resize", onResize);
    onResize();

    const globe = createGlobe(canvasRef.current!, {
      ...config,
      width: widthRef.current * 2,
      height: widthRef.current * 2,
    });

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animationFrame = 0;
    const animate = () => {
      if (!still && pointerInteracting.current === null) phiRef.current += 0.003;
      globe.update({
        phi: phiRef.current + rRef.current,
        width: widthRef.current * 2,
        height: widthRef.current * 2,
      });
      animationFrame = requestAnimationFrame(animate);
    };
    // ponytail: no se anima fuera de pantalla ni con la pestaña oculta (antes giraba siempre y robaba GPU al scrollear).
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      if (e.isIntersecting && !document.hidden) animate();
    });
    io.observe(canvasRef.current!);

    setTimeout(() => {
      if (canvasRef.current) canvasRef.current.style.opacity = "1";
    });
    return () => {
      io.disconnect();
      cancelAnimationFrame(animationFrame);
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      className={cn(
        "absolute inset-0 mx-auto aspect-[1/1] w-full max-w-[600px]",
        className,
      )}
    >
      <canvas
        className="size-full opacity-0 transition-opacity duration-500 [contain:layout_paint_size]"
        ref={canvasRef}
        onPointerDown={(e) =>
          updatePointerInteraction(
            e.clientX - pointerInteractionMovement.current,
          )
        }
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerOut={() => updatePointerInteraction(null)}
        onMouseMove={(e) => updateMovement(e.clientX)}
        onTouchMove={(e) =>
          e.touches[0] && updateMovement(e.touches[0].clientX)
        }
      />
    </div>
  );
}
