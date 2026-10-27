import { pressMentions } from "@/lib/press-mentions";
import { formatDate } from "@/lib/format-date";
import { ASection, AHeading, aFocus } from "@/components/a-section";

const MAX_LINKS = 5;

// Solo texto: sin og:image de terceros ni dominios externos. Sobre fondo claro (.a-bone).
export function PressBlock() {
  return (
    <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
      <h3 className="a-rise text-[0.9375rem] font-medium uppercase tracking-[0.16em] text-[#4b5750]">
        En los medios
      </h3>
      <ul className="divide-y divide-[#131a16]/15 border-y border-[#131a16]/15">
        {pressMentions.slice(0, MAX_LINKS).map((m) => (
          <li key={m.url}>
            <a
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group block py-4 ${aFocus}`}
            >
              <span className="block text-base font-medium leading-snug underline decoration-transparent underline-offset-4 group-hover:decoration-[#131a16]">
                {m.title}
                <span className="sr-only"> (abre en pestaña nueva)</span>
              </span>
              <span className="mt-1 block text-[0.9375rem] text-[#4b5750]">
                {m.outlet}
                {m.date ? ` · ${formatDate(m.date)}` : ""}
              </span>
            </a>
          </li>
        ))}
      </ul>
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
