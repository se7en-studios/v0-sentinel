import { ArrowRight } from "lucide-react";
import {
  ScrollGlobe,
  type ScrollGlobeSection,
} from "@/components/ui/scroll-globe";
import { CLAIMS } from "@/lib/claims";

// Capítulo con un globo que se mueve por la pantalla según la sección. Todo el contenido sale de lo que ya
// dice la landing (Cómo funciona / Alcance): no agrega afirmaciones nuevas.
const SECTIONS: ScrollGlobeSection[] = [
  {
    id: "mundo",
    badge: "El mundo",
    title: "Un planeta",
    subtitle: "mirado desde el espacio",
    description:
      "Los satélites que leemos, NASA FIRMS y GOES-19, ven cada foco de calor del continente. Sentinel lo convierte en un aviso para quien tiene que actuar.",
    align: "left",
  },
  {
    id: "mundo-verificar",
    badge: "Verificar",
    title: "Un punto de calor",
    subtitle: "todavía no es un incendio",
    description:
      "Cruzamos las fuentes y descartamos el calor industrial antes de avisarle a nadie.",
    align: "center",
  },
  {
    id: "mundo-contexto",
    badge: "Contexto",
    title: "Cada foco,",
    subtitle: "con su contexto",
    description: "Antes de avisar, el foco se completa con datos del lugar.",
    align: "left",
    features: [
      {
        title: "Relieve, viento y localidad",
        description: "Se suman a cada foco detectado.",
      },
      {
        title: "Ubicación y acceso",
        description: "Llegan por WhatsApp a quien tiene que actuar.",
      },
      {
        title: `Objetivo: ${CLAIMS.detectionMinutes} minutos`,
        description:
          "Desde la detección; todavía en medición en un incendio real.",
      },
    ],
  },
  {
    id: "mundo-patagonia",
    badge: "Patagonia",
    title: "Empezamos por la",
    subtitle: "cordillera patagónica",
    description:
      "Hoy trabajamos acá. Si sos municipio, brigada o productor, armemos un piloto.",
    align: "center",
    actions: (
      <>
        <a href="#contacto" className="a-pill !pr-1.5">
          Pedir un piloto
          <span className="grid size-8 place-items-center rounded-full bg-[#06150d] text-a-accent">
            <ArrowRight className="size-4" aria-hidden />
          </span>
        </a>
        <a href="#plataforma" className="a-pill-ghost">
          Ver cómo funciona
        </a>
      </>
    ),
  },
];

export function World() {
  return (
    <div className="a-root" aria-label="El mundo, visto por Sentinel">
      <ScrollGlobe sections={SECTIONS} />
    </div>
  );
}
