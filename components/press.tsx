import { pressMentions } from "@/lib/press-mentions";
import { formatDate } from "@/lib/format-date";

export function PressBlock() {
  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <h3 className="t-h2">Salimos en la prensa</h3>
        <p className="t-body mt-4 text-ink/80">
          Medios y organizaciones que cubrieron el proyecto o las competencias
          donde participamos.
        </p>
      </div>
      <ul aria-label="Notas de prensa" className="border-b rule lg:col-span-8">
        {pressMentions.map((m) => (
          <li key={m.url} className="border-t rule">
            <a
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group grid gap-x-6 gap-y-1 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:grid-cols-[1fr_9rem]"
            >
              <span className="font-serif text-xl leading-snug group-hover:underline group-hover:underline-offset-4">
                {m.title}
                <span className="sr-only"> (abre en pestaña nueva)</span>
              </span>
              <span className="t-small text-ink/70 sm:text-right">
                {m.outlet}
                {m.date && <span className="block">{formatDate(m.date)}</span>}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
