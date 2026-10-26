import Image from "next/image";
import { pressMentions } from "@/lib/press-mentions";
import { PHOTOS } from "@/lib/photos";

type Kind = "won" | "finalist" | "took-part" | "program";
type Achievement = {
  year?: string;
  title: string;
  kind: Kind;
  detail: string;
  href?: string;
};

const noteFor = (outlet: string) =>
  pressMentions.find((m) => m.outlet === outlet)?.url;

const VERB: Record<Kind, string> = {
  won: "Ganamos.",
  finalist: "Fuimos finalistas.",
  "took-part": "Participamos.",
  program: "Programa en el que participamos.",
};

// Orden cronológico inverso; lo que no tiene año confirmado va al final, sin inventarlo.
const achievements: Achievement[] = [
  {
    year: "2026",
    title: "Premios Verdes",
    kind: "finalist",
    detail: "Proyectos ambientales; el premio incluye un viaje a Ecuador.",
  },
  {
    year: "2026",
    title: "Impact Startup Competition, Perú",
    kind: "finalist",
    detail: "Startups de impacto ambiental de Latinoamérica.",
  },
  {
    year: "2025",
    title: "Premios Sadosky",
    kind: "won",
    detail: "Cámara de la Industria Argentina del Software (CESSI).",
    href: noteFor("CESSI"),
  },
  {
    year: "2025",
    title: "Premios ILAN",
    kind: "won",
    detail: "Innovación tecnológica universitaria, con final en Tel Aviv.",
    href: noteFor("UTN"),
  },
  {
    title: "JIJE 20 años, Universidad Nacional del Litoral",
    kind: "won",
    detail: "Primer puesto en las Jornadas de Ingeniería.",
  },
  {
    title: "Climate Launchpad Argentina",
    kind: "finalist",
    detail: "Competencia global de innovación climática, etapa nacional.",
  },
  {
    title: "Fondo del Gobierno de Mendoza",
    kind: "program",
    detail:
      "USD 3.000 de capital no dilutivo, vía el fondo provincial de innovación.",
  },
  {
    title: "Usina Emprendedores, Cámara Argentina de Comercio",
    kind: "program",
    detail: "Programa para escalar startups.",
  },
  {
    title: "Softlanding en Europa, Piensas.xyz",
    kind: "program",
    detail: "Viaje financiado para conectar con el ecosistema tech europeo.",
  },
  {
    title: "Emprelatam y Draper House Americas",
    kind: "program",
    detail: "Programa de aceleración para startups de la región.",
  },
  {
    title: "Prendete Pitch Day, CICE",
    kind: "took-part",
    detail: "Competencia de pitch para founders universitarios de Mendoza.",
  },
];

const photos = [PHOTOS.awardsGroup, PHOTOS.awardsStage, PHOTOS.awardsRoom];

export function AwardsBlock() {
  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <h3 className="t-h2">Lo que ya pasó</h3>
        <ol className="mt-8 border-b rule">
          {achievements.map((a) => (
            <li
              key={a.title}
              className="grid grid-cols-[4rem_1fr] gap-x-4 border-t rule py-5 sm:grid-cols-[6rem_1fr]"
            >
              <span className="font-serif text-2xl tabular-nums text-ink/80 sm:text-3xl">
                {a.year ?? "s/f"}
              </span>
              <div>
                <p className="t-h3">
                  {a.href ? (
                    <a
                      href={a.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-ink/30 underline-offset-4 hover:decoration-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
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
                <p className="t-body mt-1 text-ink/80">
                  <strong className="font-semibold">{VERB[a.kind]}</strong>{" "}
                  {a.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="t-caption mt-3">
          s/f: sin año confirmado en nuestros registros.
        </p>
      </div>

      <div className="space-y-8 lg:col-span-4 lg:col-start-9">
        {photos.map((p) => (
          <figure key={p.src}>
            <Image
              src={p.src}
              alt={p.alt}
              width={p.width}
              height={p.height}
              sizes="(max-width: 1024px) 100vw, 380px"
              loading="lazy"
              className="h-auto w-full"
            />
            <figcaption className="t-caption mt-2">{p.caption}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
