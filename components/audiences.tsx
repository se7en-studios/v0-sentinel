import { ArrowRight } from "lucide-react";
import { Chapter, Eyebrow } from "@/components/ui/chapter";

const AUDIENCES = [
  {
    perfil: "municipio",
    who: "Municipios y Defensa Civil",
    problem:
      "Se enteran del fuego por un llamado, cuando ya avanzó. Coordinar recursos con poca información cuesta tiempo.",
    gets: "Consola con focos verificados, ubicación y contexto de propagación, más alertas para activar protocolos.",
  },
  {
    perfil: "brigada",
    who: "Brigadas y bomberos",
    problem:
      "Llegar sin saber dónde está el frente, hacia dónde va el viento ni cómo acceder al lugar.",
    gets: "Alerta geolocalizada por WhatsApp con coordenadas, viento y terreno, directo al celular del equipo.",
  },
  {
    perfil: "campo",
    who: "Campos, forestales y aseguradoras",
    problem:
      "Un foco cercano que nadie ve a tiempo puede costar cosechas, plantaciones y pólizas.",
    gets: "Aviso temprano sobre tus lotes y un registro de eventos para decidir y documentar.",
  },
];

export function Audiences() {
  return (
    <Chapter id="para-quien">
      <Eyebrow>Para quién</Eyebrow>
      <h2 className="t-h2 max-w-3xl">
        Tres públicos, un mismo problema: llegar antes
      </h2>
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {AUDIENCES.map(({ perfil, who, problem, gets }) => (
          <article
            key={perfil}
            className="flex flex-col rounded-2xl border border-foreground/15 p-7 md:p-8"
          >
            <h3 className="t-h3">{who}</h3>
            <p className="t-label mt-6 text-[#0b6b44]">El problema</p>
            <p className="t-body mt-2">{problem}</p>
            <p className="t-label mt-6 text-[#0b6b44]">Qué recibís</p>
            <p className="t-body mt-2">{gets}</p>
            <a
              href={`/?perfil=${perfil}#contacto`}
              className="mt-auto inline-flex items-center gap-2 self-start rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Solicitar un piloto <ArrowRight className="size-4" aria-hidden />
            </a>
            <p className="t-small mt-3 opacity-70">Piloto abierto</p>
          </article>
        ))}
      </div>
    </Chapter>
  );
}
