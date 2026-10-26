"use client";

import { useRef, type ReactNode } from "react";

// Inclinación 3D sutil al pasar el mouse (CSS vars + un rAF, sin estado). Táctil/reduced-motion: nada.
export function TeamTilt({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  return (
    <div
      ref={ref}
      className={`[transform:perspective(900px)_rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))] transition-transform duration-200 ease-out will-change-transform ${className}`}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const { clientX, clientY } = e;
        cancelAnimationFrame(raf.current);
        raf.current = requestAnimationFrame(() => {
          const el = ref.current;
          if (!el) return;
          const r = el.getBoundingClientRect();
          const px = (clientX - r.left) / r.width - 0.5;
          const py = (clientY - r.top) / r.height - 0.5;
          el.style.setProperty("--ry", `${(px * 8).toFixed(2)}deg`);
          el.style.setProperty("--rx", `${(-py * 8).toFixed(2)}deg`);
        });
      }}
      onPointerLeave={() => {
        cancelAnimationFrame(raf.current);
        ref.current?.style.removeProperty("--rx");
        ref.current?.style.removeProperty("--ry");
      }}
    >
      {children}
    </div>
  );
}
