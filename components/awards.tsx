import { Chapter, Eyebrow } from "@/components/ui/chapter";
import { pressMentions } from "@/lib/press-mentions";

type Achievement = { title: string; badge: string; detail: string; href?: string };

const noteFor = (outlet: string) => pressMentions.find((m) => m.outlet === outlet)?.url;

const competitions: Achievement[] = [
  {
    title: "Premios ILAN 2025",
    badge: "Ganador",
    detail: "Innovación tecnológica universitaria, con final en Tel Aviv.",
    href: noteFor("UTN"),
  },
  {
    title: "JIJE 20 años, UNL",
    badge: "Ganador",
    detail: "Primer puesto en las Jornadas de Ingeniería de la Universidad Nacional del Litoral.",
  },
  {
    title: "Premios Sadosky 2025",
    badge: "Ganador",
    detail: "Premios de la Cámara de la Industria Argentina del Software (CESSI).",
    href: noteFor("CESSI"),
  },
  {
    title: "Usina Emprendedores, CAC",
    badge: "Programa",
    detail: "Programa de la Cámara Argentina de Comercio para escalar startups.",
  },
  {
    title: "Prendete Pitch Day, CICE",
    badge: "Participamos",
    detail: "Competencia de pitch para founders universitarios de Mendoza.",
  },
];

const international: Achievement[] = [
  {
    title: "Premios Verdes 2026",
    badge: "Finalista",
    detail: "Proyectos ambientales finalistas; el premio incluye un viaje a Ecuador.",
  },
  {
    title: "Climate Launchpad Argentina",
    badge: "Finalista",
    detail: "Finalistas nacionales de la competencia global de innovación climática.",
  },
  {
    title: "Impact Startup Competition Perú 2026",
    badge: "Finalista",
    detail: "Startups de impacto ambiental de Latinoamérica.",
  },
  {
    title: "Softlanding en Europa, Piensas.xyz",
    badge: "Programa",
    detail: "Viaje financiado para conectar con el ecosistema tech europeo.",
  },
  {
    title: "Emprelatam y Draper House Americas",
    badge: "Programa",
    detail: "Programa de aceleración para startups de la región.",
  },
  {
    title: "Fondo del Gobierno de Mendoza",
    badge: "USD 3.000",
    detail: "Primer capital no dilutivo, vía fondo provincial de innovación.",
  },
];

function Track({ label, items }: { label: string; items: Achievement[] }) {
  return (
    <div>
      <h3 className="t-label mb-5 text-[#0b6b44]">{label}</h3>
      {/* Vertical en mobile (línea a la izquierda), horizontal desde lg (línea arriba). */}
      <ol
        className="relative ml-1.5 grid gap-6 border-l border-foreground/20 pl-6 lg:ml-0 lg:grid-flow-col lg:auto-cols-fr lg:gap-5 lg:border-l-0 lg:border-t lg:pl-0 lg:pt-6"
      >
        {items.map((a) => (
          <li key={a.title} className="relative">
            <span
              aria-hidden
              className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary lg:-top-[29px] lg:left-0"
            />
            <p className="t-label opacity-80">{a.badge}</p>
            <p className="t-body mt-1 font-semibold">
              {a.href ? (
                <a
                  href={a.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-foreground/30 underline-offset-4 hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {a.title}
                  <span className="sr-only"> (abre la nota en pestaña nueva)</span>
                </a>
              ) : (
                a.title
              )}
            </p>
            <p className="t-small mt-1 opacity-75">{a.detail}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function AwardsBlock() {
  return (
    <div className="grid gap-12">
      <Track label="Competencias nacionales" items={competitions} />
      <Track label="Selección internacional y primer apoyo" items={international} />
    </div>
  );
}

// Compatibilidad: el capítulo completo vive en Proof.
export function Awards() {
  return (
    <Chapter id="noticias">
      <Eyebrow>Logros</Eyebrow>
      <h2 className="t-h2 mb-12 max-w-3xl">Lo que ya pasó, con fuente.</h2>
      <AwardsBlock />
    </Chapter>
  );
}
