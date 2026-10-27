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

    void import("@/lib/gsap").then(({ gsap, ScrollTrigger, SplitText }) => {
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
        ScrollTrigger.refresh();
      };
      void document.fonts.ready.then(() => !cancelled && run());
    });

    return () => {
      cancelled = true;
      revert();
    };
  }, []);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
