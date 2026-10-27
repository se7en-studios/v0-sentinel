"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { aFocus } from "@/components/a-section";

export type AwardEntry = {
  year: string;
  name: string;
  result: string;
  caption?: string;
  href?: string;
  /** Foto real del evento (inserto). Sin foto, el panel es solo tipográfico. */
  image?: string;
  alt?: string;
  /** Foto de ambiente a pantalla completa: ilustra el tema, NO es una foto del evento. */
  bg: string;
};

const PIN_MQ =
  "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";
const pad = (n: number) => String(n).padStart(2, "0");

function Intro({ entries }: { entries: AwardEntry[] }) {
  return (
    <div className="relative z-10 mx-auto flex h-full w-full max-w-[1100px] flex-col justify-center px-5 py-24 md:px-8 group-data-[pin]/aw:py-0">
      <p className="a-eyebrow !text-left">Reconocimientos</p>
      <h3 className="a-display-m mt-4 max-w-xl">Lo que ya pasó, con fuente.</h3>
      <p className="a-sub mt-4 max-w-md">
        2025 – 2026. Donde hay nota publicada, el panel lleva a ella.
      </p>
      <ol className="mt-8 max-w-xl divide-y divide-white/15 border-y border-white/15 text-[0.9375rem]">
        {entries.map((e, i) => (
          <li
            key={e.name}
            className="grid grid-cols-[2rem_3rem_1fr_auto] items-baseline gap-x-3 py-2.5"
          >
            <span className="tabular-nums text-a-faint">{pad(i + 1)}</span>
            <span className="tabular-nums text-a-mute">{e.year || "—"}</span>
            <span className="font-medium leading-snug text-[#e3f6dc]">
              {e.name}
            </span>
            <span className="text-a-mute">{e.result}</span>
          </li>
        ))}
      </ol>
      <p className="mt-8 text-[0.9375rem] text-a-faint group-data-[pin]/aw:block hidden">
        Seguí bajando: un premio por pantalla →
      </p>
    </div>
  );
}

function Panel({ e, i, total }: { e: AwardEntry; i: number; total: number }) {
  const won = e.result.toLowerCase().startsWith("gan");
  return (
    <article
      data-panel
      className="relative flex min-h-[88svh] w-full flex-col justify-end overflow-hidden group-data-[pin]/aw:h-screen group-data-[pin]/aw:w-screen group-data-[pin]/aw:shrink-0"
    >
      {/* Foto de ambiente, a color y oscurecida; se desplaza lento con el scroll. */}
      <div data-bg className="absolute inset-y-0 -inset-x-[8%]">
        <Image
          src={e.bg}
          alt=""
          fill
          sizes="110vw"
          quality={80}
          loading="lazy"
          className="object-cover"
        />
      </div>
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-[#06100b]/90 via-[#06100b]/55 to-[#06100b]/25"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-[#06100b]/85 via-transparent to-[#06100b]/40"
      />

      <span
        aria-hidden
        data-numeral
        className="pointer-events-none absolute -top-[2vw] right-[3vw] select-none font-[family-name:var(--font-display)] text-[clamp(7rem,24vw,22rem)] leading-none text-transparent [-webkit-text-stroke:1.5px_rgb(169_239_201/0.28)]"
      >
        {e.year || "CICE"}
      </span>

      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col gap-10 px-5 pb-16 pt-28 md:px-10 md:pb-[9vh] lg:flex-row lg:items-end lg:justify-between">
        <div data-copy className="max-w-2xl">
          <p className="flex items-center gap-3 text-[0.9375rem] tabular-nums text-a-mute">
            <span className="group-data-[pin]/aw:hidden">
              {pad(i + 1)} / {pad(total)}
            </span>
            <span aria-hidden className="h-px w-10 bg-a-mute/50" />
            <span>{e.year || "Programa"}</span>
          </p>
          <p
            className={`mt-5 inline-block rounded-full px-4 py-1.5 text-[0.9375rem] font-medium ${
              won
                ? "bg-a-accent text-[#06150d]"
                : "border border-a-accent/60 text-a-accent"
            }`}
          >
            {e.result}
          </p>
          <h3 className="a-display-m mt-5 !text-[clamp(2.5rem,5.4vw,5.5rem)] text-white">
            {e.name}
          </h3>
          {e.caption ? (
            <p className="a-sub mt-5 max-w-lg !text-[#e3f6dc]/85">
              {e.caption}
            </p>
          ) : null}
          {e.href ? (
            <a
              href={e.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-7 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/40 px-5 text-[0.9375rem] font-medium text-white transition-colors hover:bg-white hover:text-[#06150d] ${aFocus}`}
            >
              Leer la nota
              <span className="sr-only"> (abre en pestaña nueva)</span>
              <span aria-hidden>↗</span>
            </a>
          ) : null}
        </div>

        {e.image ? (
          <figure
            data-inset
            className="w-full max-w-md shrink-0 lg:w-[30vw] lg:max-w-none"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/25 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
              <Image
                src={e.image}
                alt={e.alt ?? ""}
                fill
                sizes="(min-width: 1024px) 30vw, 90vw"
                loading="lazy"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-2 text-[0.8125rem] text-a-faint">
              Foto del evento.
            </figcaption>
          </figure>
        ) : null}
      </div>
    </article>
  );
}

// Apilado por defecto (celular, reduced-motion, sin JS). En lg+ con movimiento, GSAP marca data-pin:
// la sección queda fija y los paneles de pantalla completa pasan en horizontal, uno por premio.
export function AwardsPanels({ entries }: { entries: AwardEntry[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const bar = barRef.current;
    const count = countRef.current;
    if (!root || !track || !bar || !count) return;
    let cancelled = false;
    let revert = () => {};

    void import("@/lib/gsap").then(({ gsap }) => {
      if (cancelled) return;
      const mm = gsap.matchMedia();
      mm.add(PIN_MQ, () => {
        root.setAttribute("data-pin", "");
        const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
        const total = entries.length;

        const move = gsap.to(track, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: () => `+=${Math.round(dist() * 0.6)}`, // 60 %: el recorrido horizontal es más veloz que el scroll, para no alargar la página
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            refreshPriority: -2,
            onUpdate: (self) => {
              bar.style.transform = `scaleX(${self.progress})`;
              // 0 = pantalla de introducción; 1..n = premios
              const idx = Math.round(self.progress * total);
              count.textContent =
                idx === 0 ? "Reconocimientos" : `${pad(idx)} / ${pad(total)}`;
            },
          },
        });

        gsap.utils
          .toArray<HTMLElement>("[data-panel]", track)
          .forEach((panel) => {
            const bg = panel.querySelector("[data-bg]");
            const numeral = panel.querySelector("[data-numeral]");
            const copy = panel.querySelector("[data-copy]");
            const inset = panel.querySelector("[data-inset]");
            const range = {
              trigger: panel,
              containerAnimation: move,
              scrub: true,
              start: "left right",
              end: "right left",
            };
            if (bg)
              gsap.fromTo(
                bg,
                { xPercent: -5 },
                { xPercent: 5, ease: "none", scrollTrigger: range },
              );
            if (numeral)
              gsap.fromTo(
                numeral,
                { xPercent: 14 },
                { xPercent: -14, ease: "none", scrollTrigger: range },
              );
            const reveal = {
              trigger: panel,
              containerAnimation: move,
              start: "left 70%",
              toggleActions: "play none none reverse",
            };
            if (copy)
              gsap.fromTo(
                copy,
                { y: 50, opacity: 0 },
                {
                  y: 0,
                  opacity: 1,
                  duration: 0.8,
                  ease: "power3.out",
                  scrollTrigger: reveal,
                },
              );
            if (inset)
              gsap.fromTo(
                inset,
                { y: 80, opacity: 0, rotate: 3 },
                {
                  y: 0,
                  opacity: 1,
                  rotate: 0,
                  duration: 1,
                  ease: "power3.out",
                  scrollTrigger: reveal,
                },
              );
          });

        return () => root.removeAttribute("data-pin");
      });
      revert = () => mm.revert();
    });

    return () => {
      cancelled = true;
      revert();
    };
  }, [entries]);

  return (
    <div
      ref={rootRef}
      className="group/aw a-root relative data-[pin]:h-screen data-[pin]:overflow-hidden"
    >
      <div
        ref={trackRef}
        className="flex flex-col group-data-[pin]/aw:h-full group-data-[pin]/aw:w-max group-data-[pin]/aw:flex-row"
      >
        <section
          aria-label="Reconocimientos"
          className="relative flex min-h-[80svh] w-full items-center overflow-hidden group-data-[pin]/aw:h-screen group-data-[pin]/aw:w-screen group-data-[pin]/aw:shrink-0"
        >
          <Image src="/photos/ambiente-bomberos.webp" alt="" fill sizes="100vw" quality={75} loading="lazy" className="object-cover object-[70%_50%]" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#06100b] via-[#06100b]/85 to-[#06100b]/45" />
          <div aria-hidden className="absolute inset-0 bg-[#06100b]/35" />
          <Intro entries={entries} />
        </section>
        {entries.map((e, i) => (
          <Panel key={e.name} e={e} i={i} total={entries.length} />
        ))}
      </div>

      {/* Progreso: solo en la versión fija. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-20 hidden items-center gap-4 px-10 pt-24 group-data-[pin]/aw:flex"
      >
        <span
          ref={countRef}
          className="min-w-[7.5rem] text-[0.9375rem] tabular-nums text-a-mute"
        >
          Reconocimientos
        </span>
        <span className="relative h-px flex-1 bg-white/15">
          <span
            ref={barRef}
            className="absolute inset-0 origin-left scale-x-0 bg-a-accent"
          />
        </span>
      </div>
    </div>
  );
}
