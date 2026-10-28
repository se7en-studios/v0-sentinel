"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { creditLine, type Photo } from "@/lib/photos";
import { useCopy, useLang } from "@/lib/i18n/client";
import type { Copy } from "@/lib/i18n";

const COPY: Copy<{ cta: string }> = {
  es: { cta: "Pedir un piloto" },
  en: { cta: "Request a pilot" },
};

export type AudiencePanel = {
  href: string;
  who: string;
  problem: string;
  gets: string;
  photo: Photo;
};

const LINK =
  "mt-8 inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-a-accent px-6 text-[0.9375rem] font-medium text-[#06150d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";

// Apilados por defecto (mobile, reduced-motion, sin JS). En lg+ con movimiento, GSAP
// marca data-pin y cada panel se descubre con clip-path mientras la sección queda fija.
export function AudiencePanels({ items }: { items: AudiencePanel[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<{ start: number; end: number } | null>(null);
  const { cta } = useCopy(COPY);
  const lang = useLang();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let cancelled = false;
    let revert = () => {};

    void import("@/lib/gsap").then(({ gsap, ScrollTrigger }) => {
      if (cancelled) return;
      const mm = gsap.matchMedia();
      mm.add(
        "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        () => {
          const panels = gsap.utils.toArray<HTMLElement>("[data-panel]", root);
          root.setAttribute("data-pin", "");
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: root,
              start: "top top",
              end: `+=${(panels.length - 1) * 100}%`,
              pin: true,
              scrub: 0.6,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              refreshPriority: -1,
              onRefresh: (self) => {
                triggerRef.current = { start: self.start, end: self.end };
              },
            },
          });
          panels.slice(1).forEach((panel, i) => {
            const img = panel.querySelector("[data-img]");
            const copy = panel.querySelector("[data-copy]");
            tl.fromTo(
              panel,
              { clipPath: "inset(100% 0% 0% 0%)" },
              { clipPath: "inset(0% 0% 0% 0%)", duration: 1 },
              i,
            );
            if (img)
              tl.fromTo(img, { scale: 1.18 }, { scale: 1, duration: 1 }, i);
            if (copy)
              tl.fromTo(
                copy,
                { opacity: 0, y: 40 },
                { opacity: 1, y: 0, duration: 0.5 },
                i + 0.5,
              );
          });
          return () => {
            root.removeAttribute("data-pin");
            triggerRef.current = null;
          };
        },
      );
      revert = () => mm.revert();
      void document.fonts.ready.then(
        () => !cancelled && ScrollTrigger.refresh(),
      );
    });

    return () => {
      cancelled = true;
      revert();
    };
  }, []);

  // Un panel todavía tapado no debe quedar inalcanzable con el teclado.
  const reveal = (i: number) => {
    const t = triggerRef.current;
    if (!t || i === 0) return;
    window.scrollTo({
      top: t.start + ((t.end - t.start) * i) / (items.length - 1),
    });
  };

  return (
    <div
      ref={rootRef}
      className="group relative data-[pin]:h-svh data-[pin]:overflow-hidden"
    >
      {items.map(({ href, who, problem, gets, photo }, i) => (
        <article
          key={who}
          data-panel
          aria-label={who}
          className="relative flex min-h-[88svh] items-end overflow-hidden group-data-[pin]:absolute group-data-[pin]:inset-0 group-data-[pin]:min-h-0"
        >
          <div data-img className="absolute inset-0">
            <Image
              src={photo.src}
              alt=""
              fill
              sizes="100vw"
              quality={85}
              loading="lazy"
              className="object-cover"
              style={{ objectPosition: photo.position }}
            />
          </div>
          {/* Solo legibilidad: la foto queda sin tinte salvo el pie. */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-[75%] bg-gradient-to-t from-black/85 via-black/45 to-transparent"
          />
          <div
            data-copy
            className="relative mx-auto flex w-full max-w-[1100px] flex-col px-5 pb-20 pt-32 md:px-8 md:pb-24"
          >
            <h3 className="a-display-m max-w-3xl text-white">{who}</h3>
            <p className="mt-5 max-w-xl text-base text-white/85 md:text-lg">
              {problem}
            </p>
            <p className="mt-3 max-w-xl text-base text-white md:text-lg">
              {gets}
            </p>
            <a href={href} className={LINK} onFocus={() => reveal(i)}>
              {cta}
              <ArrowRight className="size-4" aria-hidden />
            </a>
          </div>
          <p className="absolute bottom-4 left-5 right-5 text-[0.8125rem] text-white/75 md:left-8">
            {creditLine(photo, lang)}
          </p>
        </article>
      ))}
    </div>
  );
}
