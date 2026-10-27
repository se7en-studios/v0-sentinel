"use client";

import { useRef, type ReactNode } from "react";

// El hijo sigue al puntero unos px al acercarse; solo con mouse y sin reduced-motion.
export function Magnetic({ children, pull = 0.25 }: { children: ReactNode; pull?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const enabled = () =>
    window.matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)").matches;

  return (
    <span
      ref={ref}
      className="inline-block transition-transform duration-300 ease-out will-change-transform"
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el || !enabled()) return;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * pull;
        const y = (e.clientY - (r.top + r.height / 2)) * pull;
        el.style.transform = `translate(${x}px, ${y}px)`;
      }}
      onPointerLeave={() => ref.current && (ref.current.style.transform = "")}
    >
      {children}
    </span>
  );
}
