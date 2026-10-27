import { ArrowUpRight } from "lucide-react";
import { pressMentions } from "@/lib/press-mentions";
import { formatDate } from "@/lib/format-date";
import { ASection, AHeading, aFocus, riseDelay } from "@/components/a-section";

// Sin og:image de terceros: solo texto, así no dependemos de hotlinks ni de dominios externos.
export function PressBlock() {
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {pressMentions.map((m, i) => (
        <li key={m.url} className="a-rise min-w-0" style={riseDelay(i % 3, 8)}>
          <a
            href={m.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`a-card a-lift group flex h-full flex-col justify-between gap-6 p-6 ${aFocus}`}
          >
            <p className="text-lg font-medium leading-snug text-[#e3f6dc]">
              &ldquo;{m.title}&rdquo;
              <span className="sr-only"> (abre en pestaña nueva)</span>
            </p>
            <div className="flex items-center justify-between gap-3 text-sm">
              <p className="min-w-0 text-a-mute">
                <span className="font-semibold text-a-accent">{m.outlet}</span>
                {" · "}
                {m.date ? formatDate(m.date) : "s/f"}
              </p>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-a-mute transition-[color,transform] duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-a-accent" aria-hidden />
            </div>
          </a>
        </li>
      ))}
    </ul>
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
