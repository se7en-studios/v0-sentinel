"use client";

import { useEffect, useRef } from "react";
import { useLang } from "@/lib/i18n/client";

const DURATION_MS = 1600;
const LOCALE = { es: "es-AR", en: "en-US" } as const;

/**
 * Número que cuenta de 0 al valor al entrar en pantalla. El HTML del servidor
 * ya trae el valor final (sin JS o con reduced-motion queda así). Un único rAF
 * escribe directo en el DOM: sin setState por frame.
 */
export function LiveCountUp({ value }: { value: number }) {
  const lang = useLang();
  const nf = (n: number) => n.toLocaleString(LOCALE[lang]);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    let raf = 0;
    const run = () => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - t0) / DURATION_MS, 1);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = nf(Math.round(value * eased));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      // Ya visible al hidratar: se deja el valor final, sin parpadeo.
      return;
    }
    el.textContent = nf(0);
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        run();
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, lang]);

  return (
    <>
      <span ref={ref} aria-hidden="true">
        {nf(value)}
      </span>
      <span className="sr-only">{nf(value)}</span>
    </>
  );
}
