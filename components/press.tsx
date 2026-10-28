import { pressMentions } from "@/lib/press-mentions";
import { formatDate } from "@/lib/format-date";
import { ASection, AHeading, aFocus } from "@/components/a-section";
import { PressPinner } from "@/components/press-pinner";

const MAX_LINKS = 5;

// Solo texto: sin og:image de terceros ni dominios externos. Sobre fondo claro (.a-bone).
export function PressBlock() {
  return (
    <div
      id="prensa-pin"
      className="group/pr grid gap-10 md:grid-cols-[1fr_2fr] md:gap-16 data-[pin]:ml-[calc(50%-50vw)] data-[pin]:h-screen data-[pin]:w-screen data-[pin]:grid-cols-[24rem_1fr] data-[pin]:items-center data-[pin]:gap-10 data-[pin]:pl-[max(2rem,calc((100vw-1100px)/2))]"
    >
      <PressPinner />
      <div className="a-rise md:sticky md:top-28 md:self-start group-data-[pin]/pr:static group-data-[pin]/pr:self-center">
        <p className="text-[0.9375rem] font-medium uppercase tracking-[0.16em] text-[#4b5750]">
          Prensa
        </p>
        <h3 className="a-display-m mt-3 !text-[clamp(2.25rem,4.2vw,3.75rem)]">
          En los medios.
        </h3>
      </div>
      <div data-press-view className="min-w-0 group-data-[pin]/pr:overflow-hidden">
      <ul className="divide-y divide-[#131a16]/15 border-y border-[#131a16]/15 group-data-[pin]/pr:flex group-data-[pin]/pr:w-max group-data-[pin]/pr:gap-6 group-data-[pin]/pr:divide-y-0 group-data-[pin]/pr:border-y-0 group-data-[pin]/pr:pr-[10vw]">
        {pressMentions.slice(0, MAX_LINKS).map((m, i) => (
          <li
            key={m.url}
            className="group-data-[pin]/pr:w-[26rem] group-data-[pin]/pr:shrink-0 group-data-[pin]/pr:rounded-2xl group-data-[pin]/pr:border group-data-[pin]/pr:border-[#131a16]/20 group-data-[pin]/pr:bg-white/35"
          >
            <a
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group grid grid-cols-[2.5rem_1fr_auto] items-start gap-x-4 py-6 transition-colors hover:bg-[#131a16]/[0.04] md:grid-cols-[3.5rem_1fr_auto] md:px-3 ${aFocus}`}
            >
              <span aria-hidden className="font-[family-name:var(--font-display)] text-3xl leading-none text-[#131a16]/30 transition-colors group-hover:text-[#0f7a4f] md:text-4xl">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>
                <span className="block font-[family-name:var(--font-display)] text-[clamp(1.25rem,2vw,1.75rem)] leading-[1.15]">
                  {m.title}
                  <span className="sr-only"> (abre en pestaña nueva)</span>
                </span>
                <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.9375rem] text-[#4b5750]">
                  <span className="rounded-full border border-[#131a16]/25 px-3 py-0.5 font-medium text-[#131a16]">
                    {m.outlet}
                  </span>
                  {m.date ? <span>{formatDate(m.date)}</span> : null}
                </span>
              </span>
              <span aria-hidden className="mt-1 text-2xl text-[#131a16]/40 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#0f7a4f]">
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>
      </div>
    </div>
  );
}

// Compatibilidad: el capítulo completo vive en Proof.
export function Press() {
  return (
    <ASection id="prensa">
      <AHeading eyebrow="Prensa" title="Dónde salimos en los medios" />
      <div className="mt-12">
        <PressBlock />
      </div>
    </ASection>
  );
}
