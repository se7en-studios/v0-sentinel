"use client";

import { useRef, type ReactNode } from "react";

// Botón "magnético": se acerca levemente al cursor. Solo mouse, sin reduced-motion; transform puro.
export function Magnetic({ children, strength = 0.25 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <span
      ref={ref}
      className="inline-block transition-transform duration-200 ease-out will-change-transform"
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || reduce()) return;
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * strength;
        const y = (e.clientY - (r.top + r.height / 2)) * strength;
        el.style.transform = `translate(${x}px, ${y}px)`;
      }}
      onPointerLeave={() => {
        if (ref.current) ref.current.style.transform = "";
      }}
    >
      {children}
    </span>
  );
}
