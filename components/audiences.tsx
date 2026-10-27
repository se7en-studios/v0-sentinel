import {
  AudiencePanels,
  type AudiencePanel,
} from "@/components/audience-panels";
import { SplitReveal } from "@/components/ui/split-reveal";
import { PHOTOS } from "@/lib/photos";

const AUDIENCES: AudiencePanel[] = [
  {
    href: "/?perfil=municipio#contacto",
    who: "Municipios y Defensa Civil",
    problem: "Se enteran por un llamado, cuando el fuego ya avanzó.",
    gets: "Una consola con focos verificados para activar el protocolo a tiempo.",
    photo: PHOTOS.aftermathRoad,
  },
  {
    href: "/?perfil=brigada#contacto",
    who: "Brigadas y bomberos",
    problem: "Salir sin saber dónde está el frente ni hacia dónde sopla.",
    gets: "Una alerta por WhatsApp con coordenadas, viento y acceso, directo al equipo.",
    photo: PHOTOS.brigadePack,
  },
  {
    href: "/?perfil=campo#contacto",
    who: "Campos, forestales y productores",
    problem: "Un foco cercano que nadie ve a tiempo pone en juego el año.",
    gets: "Un aviso temprano sobre tus lotes y un registro del evento.",
    photo: PHOTOS.valleySmoke,
  },
];

export function Audiences() {
  return (
    <section
      id="para-quien"
      aria-label="Para quién"
      className="a-forest font-[family-name:var(--font-geist)]"
    >
      <div className="mx-auto max-w-[1100px] px-5 py-24 md:px-8 md:py-32">
        <SplitReveal
          as="h2"
          className="a-display-m max-w-3xl text-white"
        >
          Pensado para quienes <span className="a-em">llegan primero</span> al fuego
        </SplitReveal>
      </div>
      <AudiencePanels items={AUDIENCES} />
      <p className="mx-auto max-w-[1100px] px-5 py-8 text-[0.8125rem] text-a-mute md:px-8">
        Piloto abierto: todavía no hay casos publicados.
      </p>
    </section>
  );
}
