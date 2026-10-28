"use client";

import { useEffect, useRef } from "react";

const DIM = "#6a8576";
const LIT = "#e3f6dc";
const PIN_MQ =
  "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";
const FLOW_MQ =
  "(max-width: 1023.98px) and (prefers-reduced-motion: no-preference)";

// Las palabras arrancan apagadas y se encienden una a una con el scroll. En lg+ la sección queda fija
// mientras se descubre el texto; en celular se enciende al pasar. Con reduced-motion (o sin JS) todo queda visible:
// el color apagado se anula por CSS, así que no hay un estado "oculto" del que depender.
export function ProblemReveal({ lines }: { lines: string[] }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let cancelled = false;
    let revert = () => {};

    void import("@/lib/gsap").then(({ gsap }) => {
      if (cancelled) return;
      const words = gsap.utils.toArray<HTMLElement>("[data-w]", root);
      const light = {
        color: LIT,
        ease: "none",
        stagger: { each: 1 },
        duration: 1,
      };
      const mm = gsap.matchMedia();

      mm.add(PIN_MQ, () => {
        gsap.to(words, {
          ...light,
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: () => `+=${Math.round(window.innerHeight * 1.8)}`,
            pin: true,
            scrub: 0.5,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            refreshPriority: 3, // la sección fija más alta de la página se calcula primero: su pin-spacer desplaza a las de abajo
          },
        });
      });

      mm.add(FLOW_MQ, () => {
        gsap.to(words, {
          ...light,
          scrollTrigger: {
            trigger: root,
            start: "top 78%",
            end: "bottom 50%",
            scrub: 0.4,
          },
        });
      });

      revert = () => mm.revert();
    });

    return () => {
      cancelled = true;
      revert();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative flex items-center bg-a-bg lg:min-h-screen"
    >
      <noscript>
        <style>{`.pr-w{color:${LIT} !important}`}</style>
      </noscript>
      <style>{`@media (prefers-reduced-motion: reduce){.pr-w{color:${LIT} !important}}`}</style>
      <div className="mx-auto w-full max-w-[64rem] px-5 py-24 md:px-8 md:py-36 lg:py-0">
        <ol className="space-y-10 md:space-y-14">
          {lines.map((line) => (
            <li
              key={line}
              className="font-[family-name:var(--font-display)] text-[clamp(1.85rem,3.6vw,3.4rem)] leading-[1.14] tracking-[-0.01em]"
            >
              <p>
                {line.split(" ").map((w, i) => (
                  <span key={i}>
                    <span data-w className="pr-w" style={{ color: DIM }}>
                      {w}
                    </span>{" "}
                  </span>
                ))}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
