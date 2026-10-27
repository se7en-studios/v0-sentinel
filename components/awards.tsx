import Image from "next/image";
import { ASection, AHeading, aFocus } from "@/components/a-section";
import { pressMentions } from "@/lib/press-mentions";
import { PHOTOS } from "@/lib/photos";

type Entry = { year: string; name: string; result: string; href?: string };

const noteFor = (outlet: string) =>
  pressMentions.find((m) => m.outlet === outlet)?.url;

// Cronológico. Solo entradas con año confirmado en el sitio; no inventamos fechas.
const ENTRIES: Entry[] = [
  { year: "2025", name: "Premios ILAN, innovación universitaria", result: "Ganamos", href: noteFor("UTN") },
  { year: "2025", name: "JIJE 20 años, UNL", result: "Ganamos" },
  { year: "2025", name: "Premios Sadosky", result: "Ganamos", href: noteFor("CESSI") },
  { year: "2026", name: "Premios Verdes", result: "Fuimos finalistas" },
  { year: "2026", name: "Impact Startup Competition, Perú", result: "Fuimos finalistas" },
];

const PHOTO_SLOTS = [PHOTOS.awardsGroup, PHOTOS.awardsRoom];

export function AwardsBlock() {
  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
      <div>
        <h3 className="a-rise text-sm font-medium uppercase tracking-[0.16em] text-[#4b5750]">
          Reconocimientos
        </h3>
        <ol className="mt-6 divide-y divide-[#131a16]/15 border-y border-[#131a16]/15">
          {ENTRIES.map((e) => (
            <li
              key={`${e.year}-${e.name}`}
              className="grid grid-cols-[3.5rem_1fr] gap-x-4 py-4 sm:grid-cols-[3.5rem_1fr_auto]"
            >
              <span className="text-sm tabular-nums text-[#4b5750]">{e.year}</span>
              <span className="text-base font-medium leading-snug">
                {e.href ? (
                  <a
                    href={e.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`underline decoration-[#131a16]/25 underline-offset-4 hover:decoration-[#131a16] ${aFocus}`}
                  >
                    {e.name}
                    <span className="sr-only"> (abre la nota en pestaña nueva)</span>
                  </a>
                ) : (
                  e.name
                )}
              </span>
              <span className="col-start-2 text-sm text-[#4b5750] sm:col-start-auto sm:text-right">
                {e.result}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid grid-cols-2 gap-4 self-start">
        {PHOTO_SLOTS.map((p) => (
          <figure key={p.src} className="a-rise min-w-0">
            <Image
              src={p.src}
              alt={p.alt}
              width={p.width}
              height={p.height}
              sizes="(max-width: 1024px) 46vw, 270px"
              loading="lazy"
              className="aspect-[16/10] w-full object-cover object-top"
            />
            <figcaption className="mt-2 text-xs leading-snug text-[#4b5750]">{p.caption}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

// Compatibilidad: el capítulo completo vive en Proof.
export function Awards() {
  return (
    <ASection id="noticias" tone="bone">
      <AHeading eyebrow="Logros" title="Lo que ya pasó, con fuente" />
      <div className="mt-12">
        <AwardsBlock />
      </div>
    </ASection>
  );
}
