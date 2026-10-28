import type { ReactNode } from "react";
import {
  AudiencePanels,
  type AudiencePanel,
} from "@/components/audience-panels";
import { SplitReveal } from "@/components/ui/split-reveal";
import { Eyebrow } from "@/components/a-section";
import { PHOTOS } from "@/lib/photos";
import { getLang, homePath, t, type Copy } from "@/lib/i18n";

type Item = Pick<AudiencePanel, "who" | "problem" | "gets">;

const PROFILES = [
  { perfil: "municipio", photo: PHOTOS.aftermathRoad },
  { perfil: "brigada", photo: PHOTOS.brigadePack },
  { perfil: "campo", photo: PHOTOS.valleySmoke },
] as const;

const COPY: Copy<{
  label: string;
  heading: ReactNode;
  note: string;
  items: Item[];
}> = {
  es: {
    label: "Para quién",
    heading: (
      <>
        Pensado para quienes <span className="a-em">llegan primero</span> al
        fuego
      </>
    ),
    note: "Piloto abierto: todavía no hay casos publicados.",
    items: [
      {
        who: "Municipios y Defensa Civil",
        problem: "Se enteran por un llamado, cuando el fuego ya avanzó.",
        gets: "Una consola con focos verificados para activar el protocolo a tiempo.",
      },
      {
        who: "Brigadas y bomberos",
        problem: "Salir sin saber dónde está el frente ni hacia dónde sopla.",
        gets: "Una alerta por WhatsApp con coordenadas, viento y acceso, directo al equipo.",
      },
      {
        who: "Campos, forestales y productores",
        problem: "Un foco cercano que nadie ve a tiempo pone en juego el año.",
        gets: "Un aviso temprano sobre tus lotes y un registro del evento.",
      },
    ],
  },
  en: {
    label: "Who it's for",
    heading: (
      <>
        Built for those who <span className="a-em">get to the fire first</span>
      </>
    ),
    note: "Open pilot: there are no published cases yet.",
    items: [
      {
        who: "Municipalities and civil protection",
        problem:
          "They find out from a phone call, when the fire has already spread.",
        gets: "A console with verified hotspots to activate the protocol in time.",
      },
      {
        who: "Fire brigades and firefighters",
        problem:
          "Heading out without knowing where the fire front is or which way the wind blows.",
        gets: "A WhatsApp alert with coordinates, wind and access, straight to the crew.",
      },
      {
        who: "Farms, forestry and producers",
        problem:
          "A nearby hotspot nobody spots in time puts the whole year at risk.",
        gets: "An early warning for your plots and a record of the event.",
      },
    ],
  },
};

export function Audiences() {
  const c = t(COPY);
  const lang = getLang();
  const audiences: AudiencePanel[] = PROFILES.map((p, i) => ({
    ...c.items[i],
    href: homePath(lang, `?perfil=${p.perfil}#contacto`),
    photo: p.photo,
  }));
  return (
    <section
      id="para-quien"
      aria-label={c.label}
      className="a-forest font-[family-name:var(--font-geist)]"
    >
      <div className="mx-auto max-w-[1100px] px-5 py-24 text-center md:px-8 md:py-32">
        <Eyebrow>{c.label}</Eyebrow>
        <SplitReveal
          as="h2"
          className="a-display-m mx-auto mt-5 max-w-3xl text-white"
        >
          {c.heading}
        </SplitReveal>
      </div>
      <AudiencePanels items={audiences} />
      <p className="mx-auto max-w-[1100px] px-5 py-8 text-[0.8125rem] text-a-mute md:px-8">
        {c.note}
      </p>
    </section>
  );
}
