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
        className="scrollbar-hide relative -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 md:-mx-8 md:px-8"
      >
        {pressMentions.map((m) => (
          <li
            key={m.url}
            className="w-[78vw] max-w-[300px] shrink-0 snap-start"
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
      className="group flex h-full flex-col overflow-hidden rounded-sm border border-foreground/15 transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className="relative aspect-[4/3] w-full bg-ash/10">
        {mention.image ? (
          // og:image de cada medio, hotlinkeada: next/image exigiría whitelist de dominios.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={encodeURI(mention.image)}
            alt=""
            width={300}
            height={225}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <Newspaper
            className="absolute inset-0 m-auto h-8 w-8 opacity-30"
            aria-hidden
          />
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between gap-3 p-4">
        <p className="t-label flex items-center justify-between text-[#0b6b44]">
          {mention.outlet}
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </p>
        <p className="t-small line-clamp-3 font-semibold">
          {mention.title}
          <span className="sr-only"> (abre en pestaña nueva)</span>
        </p>
        {mention.date && (
          <p className="t-small opacity-70">{formatDate(mention.date)}</p>
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
