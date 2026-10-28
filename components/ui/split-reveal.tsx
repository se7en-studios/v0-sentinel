"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

type Props = { as?: ElementType; className?: string; children: ReactNode };

// Sin JS o con reduced-motion el texto queda visible y estático; GSAP se carga bajo demanda.
export function SplitReveal({ as: Tag = "h2", className, children }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    let revert = () => {};
    let io: IntersectionObserver | undefined;

    void import("@/lib/gsap").then(({ gsap, SplitText, refreshSoon }) => {
      if (cancelled) return;
      const run = () => {
        const ctx = gsap.context(() => {
          const split = SplitText.create(el, { type: "lines", mask: "lines", autoSplit: true, aria: "none",
            onSplit: (self) =>
              gsap.from(self.lines, {
                yPercent: 110, duration: 1, ease: "power4.out", stagger: 0.08,
                scrollTrigger: { trigger: el, start: "top 88%", once: true },
              }),
          });
          return () => split.revert();
        }, el);
        revert = () => ctx.revert();
        refreshSoon();
      };
      // ponytail: el corte en líneas mide el layout; se hace recién cuando el título está a ~1 pantalla, no los 14 al cargar.
      io = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return;
          io?.disconnect();
          void document.fonts.ready.then(() => !cancelled && run());
        },
        { rootMargin: "100% 0px 100% 0px" },
      );
      io.observe(el);
    });

    return () => {
      cancelled = true;
      io?.disconnect();
      revert();
    };
  }, []);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
