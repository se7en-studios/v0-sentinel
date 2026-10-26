"use client";

import { useRef, type ElementType, type ReactNode } from "react";

// Foco de luz que sigue al puntero sobre la tarjeta (CSS vars --mx/--my + .spotlight en globals.css).
// Un solo rAF por movimiento, sin estado de React; en táctil no hace nada.
export function Spotlight({
  as: Tag = "div",
  className = "",
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const raf = useRef(0);

  return (
    <Tag
      ref={ref}
      className={`spotlight ${className}`}
      onPointerMove={(e: React.PointerEvent<HTMLElement>) => {
        if (e.pointerType !== "mouse") return;
        const el = ref.current;
        if (!el) return;
        const { clientX, clientY } = e;
        cancelAnimationFrame(raf.current);
        raf.current = requestAnimationFrame(() => {
          const r = el.getBoundingClientRect();
          el.style.setProperty("--mx", `${clientX - r.left}px`);
          el.style.setProperty("--my", `${clientY - r.top}px`);
        });
      }}
    >
      {children}
    </Tag>
  );
}
