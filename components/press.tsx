"use client";

import { useRef } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Newspaper } from "lucide-react";
import { pressMentions, type PressMention } from "@/lib/press-mentions";
import { formatDate } from "@/lib/format-date";
import { Chapter, Eyebrow } from "@/components/ui/chapter";

const btn =
  "flex h-11 w-11 items-center justify-center rounded-full border border-foreground/20 text-foreground/80 transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function PressBlock() {
  const trackRef = useRef<HTMLUListElement>(null);
  const scrollByCard = (dir: 1 | -1) =>
    trackRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="t-small max-w-md opacity-80">
          Medios y organizaciones que cubrieron el proyecto o las competencias
          donde participamos.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            aria-label="Notas anteriores"
            className={btn}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            aria-label="Notas siguientes"
            className={btn}
          >
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
      <ul
        ref={trackRef}
        aria-label="Notas de prensa"
        className="scrollbar-hide relative -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-8 pt-1 md:-mx-8 md:px-8"
      >
        {pressMentions.map((m) => (
          <li
            key={m.url}
            className="w-[72vw] max-w-[280px] shrink-0 snap-start"
          >
            <PressCard mention={m} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function PressCard({ mention }: { mention: PressMention }) {
  return (
    <a
      href={mention.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-[20px] bg-charcoal shadow-[0_24px_50px_-24px_rgba(18,17,14,0.55)] ring-1 ring-foreground/10 transition-all duration-300 hover:-translate-y-1 hover:ring-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {mention.image ? (
        // og:image de cada medio, hotlinkeada: next/image exigiría whitelist de dominios.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={encodeURI(mention.image)}
          alt=""
          width={300}
          height={375}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover saturate-[0.8] transition-transform duration-500 group-hover:scale-105 group-hover:saturate-100"
        />
      ) : (
        <Newspaper
          className="absolute inset-0 m-auto h-8 w-8 text-[#f4efe2]/30"
          aria-hidden
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/70 via-45% to-charcoal/10"
      />
      <p className="t-label glass absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[#f4efe2]">
        {mention.outlet}
      </p>
      <ArrowUpRight
        className="absolute right-4 top-4 h-5 w-5 text-[#f4efe2]/80 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        aria-hidden
      />
      <div className="relative p-4">
        <p className="line-clamp-3 font-heading text-lg font-semibold leading-snug tracking-tight text-[#f4efe2]">
          {mention.title}
          <span className="sr-only"> (abre en pestaña nueva)</span>
        </p>
        {mention.date && (
          <p className="t-small mt-2 text-[#f4efe2]/75">
            {formatDate(mention.date)}
          </p>
        )}
      </div>
    </a>
  );
}

// Compatibilidad: el capítulo completo vive en Proof.
export function Press() {
  return (
    <Chapter id="prensa">
      <Eyebrow>Prensa</Eyebrow>
      <h2 className="t-h2 mb-10 max-w-3xl">Dónde salimos en los medios.</h2>
      <PressBlock />
    </Chapter>
  );
}
