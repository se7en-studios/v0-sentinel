import { ArrowRight } from "lucide-react";
import {
  ScrollGlobe,
  type ScrollGlobeSection,
} from "@/components/ui/scroll-globe";
import { CLAIMS } from "@/lib/claims";
import { t, type Copy } from "@/lib/i18n";

type Text = {
  label: string;
  world: Pick<ScrollGlobeSection, "badge" | "title" | "subtitle" | "description">;
  verify: Pick<ScrollGlobeSection, "badge" | "title" | "subtitle" | "description">;
  context: Pick<ScrollGlobeSection, "badge" | "title" | "subtitle" | "description"> & {
    features: [string, string][];
    target: (minutes: number) => string;
    targetNote: string;
  };
  patagonia: Pick<ScrollGlobeSection, "badge" | "title" | "subtitle" | "description">;
  cta: string;
  how: string;
};

// Capítulo con un globo que se mueve por la pantalla según la sección. Todo el contenido sale de lo que ya
// dice la landing (Cómo funciona / Alcance): no agrega afirmaciones nuevas.
const COPY: Copy<Text> = {
  es: {
    label: "El mundo, visto por Sentinel",
    world: {
      badge: "El mundo",
      title: "Un planeta",
      subtitle: "mirado desde el espacio",
      description:
        "Los satélites que leemos, NASA FIRMS y GOES-19, ven cada foco de calor del continente. Sentinel lo convierte en un aviso para quien tiene que actuar.",
    },
    verify: {
      badge: "Verificar",
      title: "Un punto de calor",
      subtitle: "todavía no es un incendio",
      description:
        "Cruzamos las fuentes y descartamos el calor industrial antes de avisarle a nadie.",
    },
    context: {
      badge: "Contexto",
      title: "Cada foco,",
      subtitle: "con su contexto",
      description: "Antes de avisar, el foco se completa con datos del lugar.",
      features: [
        ["Relieve, viento y localidad", "Se suman a cada foco detectado."],
        ["Ubicación y acceso", "Llegan por WhatsApp a quien tiene que actuar."],
      ],
      target: (m) => `Objetivo: ${m} minutos`,
      targetNote: "Desde la detección; todavía en medición en un incendio real.",
    },
    patagonia: {
      badge: "Patagonia",
      title: "Empezamos por la",
      subtitle: "cordillera patagónica",
      description:
        "Hoy trabajamos acá. Si sos municipio, brigada o productor, armemos un piloto.",
    },
    cta: "Pedir un piloto",
    how: "Ver cómo funciona",
  },
  en: {
    label: "The world, seen by Sentinel",
    world: {
      badge: "The world",
      title: "One planet",
      subtitle: "seen from space",
      description:
        "The satellites we read, NASA FIRMS and GOES-19, see every fire hotspot on the continent. Sentinel turns it into an alert for whoever has to act.",
    },
    verify: {
      badge: "Verify",
      title: "A heat point",
      subtitle: "is not a wildfire yet",
      description:
        "We cross-check sources and rule out industrial heat before alerting anyone.",
    },
    context: {
      badge: "Context",
      title: "Every hotspot,",
      subtitle: "with its context",
      description: "Before alerting, the hotspot is completed with data about the place.",
      features: [
        ["Terrain, wind and locality", "Added to every detected hotspot."],
        ["Location and access", "Sent by WhatsApp to whoever has to act."],
      ],
      target: (m) => `Target: ${m} minutes`,
      targetNote: "From detection; still being measured in a real wildfire.",
    },
    patagonia: {
      badge: "Patagonia",
      title: "We start in the",
      subtitle: "Patagonian Andes",
      description:
        "This is where we work today. If you are a municipality, a fire brigade or a producer, let's set up a pilot.",
    },
    cta: "Request a pilot",
    how: "See how it works",
  },
};

export function World() {
  const c = t(COPY);
  const x = c.context;
  const sections: ScrollGlobeSection[] = [
    { id: "mundo", ...c.world, align: "left" },
    { id: "mundo-verificar", ...c.verify, align: "center" },
    {
      id: "mundo-contexto",
      badge: x.badge,
      title: x.title,
      subtitle: x.subtitle,
      description: x.description,
      align: "left",
      features: [
        { title: x.features[0][0], description: x.features[0][1] },
        { title: x.features[1][0], description: x.features[1][1] },
        { title: x.target(CLAIMS.detectionMinutes), description: x.targetNote },
      ],
    },
    {
      id: "mundo-patagonia",
      ...c.patagonia,
      align: "center",
      actions: (
        <>
          <a href="#contacto" className="a-pill !pr-1.5">
            {c.cta}
            <span className="grid size-8 place-items-center rounded-full bg-[#06150d] text-a-accent">
              <ArrowRight className="size-4" aria-hidden />
            </span>
          </a>
          <a href="#plataforma" className="a-pill-ghost">
            {c.how}
          </a>
        </>
      ),
    },
  ];
  return (
    <div className="a-root" aria-label={c.label}>
      <ScrollGlobe sections={sections} />
    </div>
  );
}
