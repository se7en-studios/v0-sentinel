import Image from "next/image";
import { ASection, AHeading, aFocus } from "@/components/a-section";
import { pressMentions } from "@/lib/press-mentions";

type Item = { title: string; detail: string; href?: string };

const noteFor = (outlet: string) =>
  pressMentions.find((m) => m.outlet === outlet)?.url;

const PHOTOS = [
  {
    src: "/logros-tile-1.jpg",
    alt: "El equipo recibiendo el premio en ILAN 2025",
    caption: "Premios ILAN 2025, innovación universitaria.",
  },
  {
    src: "/logros-tile-3.jpg",
    alt: "Ceremonia de los Premios Sadosky 2025",
    caption: "Ceremonia de los Premios Sadosky 2025.",
  },
  {
    src: "/logros-tile-0.jpg",
    alt: "Participantes del Prendete Pitch Day con sus tickets simbólicos",
    caption: "Prendete Pitch Day, CICE (Mendoza).",
  },
  {
    src: "/logros-tile-4.jpg",
    alt: "Presentación remota de Sentinel en las jornadas JIJE de la UNL",
    caption: "JIJE 20 años, UNL: presentamos a distancia.",
  },
];

const GROUPS: { label: string; items: Item[] }[] = [
  {
    label: "Ganamos",
    items: [
      {
        title: "Premios ILAN 2025",
        detail: "Innovación tecnológica universitaria, con final en Tel Aviv.",
        href: noteFor("UTN"),
      },
      {
        title: "JIJE 20 años, UNL",
        detail:
          "Primer puesto en las Jornadas de Ingeniería de la Universidad Nacional del Litoral.",
      },
      {
        title: "Premios Sadosky 2025",
        detail:
          "Premios de la Cámara de la Industria Argentina del Software (CESSI).",
        href: noteFor("CESSI"),
      },
    ],
  },
  {
    label: "Fuimos finalistas",
    items: [
      {
        title: "Premios Verdes 2026",
        detail:
          "Proyectos ambientales finalistas; el premio incluye un viaje a Ecuador.",
      },
      {
        title: "Climate Launchpad Argentina",
        detail:
          "Finalistas nacionales de la competencia global de innovación climática.",
      },
      {
        title: "Impact Startup Competition Perú 2026",
        detail: "Startups de impacto ambiental de Latinoamérica.",
      },
    ],
  },
  {
    label: "Participamos",
    items: [
      {
        title: "Prendete Pitch Day, CICE",
        detail: "Competencia de pitch para founders universitarios de Mendoza.",
      },
      {
        title: "Usina Emprendedores, CAC",
        detail:
          "Programa de la Cámara Argentina de Comercio para escalar startups.",
      },
      {
        title: "Softlanding en Europa, Piensas.xyz",
        detail:
          "Viaje financiado para conectar con el ecosistema tech europeo.",
      },
      {
        title: "Emprelatam y Draper House Americas",
        detail: "Programa de aceleración para startups de la región.",
      },
      {
        title: "Fondo del Gobierno de Mendoza",
        detail:
          "USD 3.000: nuestro primer capital no dilutivo, vía fondo provincial de innovación.",
      },
    ],
  },
];

function PhotoStrip() {
  return (
    <ul
      aria-label="Fotos de premios y competencias"
      tabIndex={0}
      className={`scrollbar-hide -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 md:-mx-8 md:px-8 ${aFocus}`}
    >
      {PHOTOS.map((p) => (
        <li key={p.src} className="w-[72vw] max-w-[320px] shrink-0 snap-start">
          <figure className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-a-line bg-a-card">
            <Image
              src={p.src}
              alt={p.alt}
              fill
              sizes="(max-width: 640px) 72vw, 320px"
              loading="lazy"
              className="object-cover"
            />
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 to-transparent" />
            <figcaption className="absolute inset-x-0 bottom-0 p-5 text-base font-medium leading-snug text-white">
              {p.caption}
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}

export function AwardsBlock() {
  return (
    <div className="grid gap-10">
      <PhotoStrip />
      <div className="grid gap-4 md:grid-cols-3">
        {GROUPS.map((g) => (
          <section
            key={g.label}
            className="a-card min-w-0 p-6"
            aria-label={g.label}
          >
            <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-a-accent">
              {g.label}
            </h3>
            <ul className="mt-5 space-y-5">
              {g.items.map((a) => (
                <li key={a.title}>
                  <p className="font-semibold text-[#e3f6dc]">
                    {a.href ? (
                      <a
                        href={a.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`underline decoration-a-line underline-offset-4 hover:decoration-a-accent ${aFocus}`}
                      >
                        {a.title}
                        <span className="sr-only">
                          {" "}
                          (abre la nota en pestaña nueva)
                        </span>
                      </a>
                    ) : (
                      a.title
                    )}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-a-mute">
                    {a.detail}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

// Compatibilidad: el capítulo completo vive en Proof.
export function Awards() {
  return (
    <ASection id="noticias">
      <AHeading eyebrow="Logros" title="Lo que ya pasó, con fuente" />
      <div className="mt-12">
        <AwardsBlock />
      </div>
    </ASection>
  );
}
