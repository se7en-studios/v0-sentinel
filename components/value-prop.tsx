import { SplitReveal } from "@/components/ui/split-reveal";
import { Eyebrow } from "@/components/a-section";
import { CLAIMS } from "@/lib/claims";
import { t, type Copy } from "@/lib/i18n";

// Propuesta de valor en una pantalla: qué hacemos, para quién y en qué plazo. Solo repite lo que ya dice el resto de la landing.
const COPY: Copy<{
  points: { verb: string; text: string }[];
  eyebrow: string;
  title: string;
  titleEm: string;
  cta: string;
  how: string;
  note: string;
}> = {
  es: {
    points: [
      {
        verb: "Detectamos",
        text: "Leemos los focos de calor que ven los satélites (NASA FIRMS y GOES-19) sobre la cordillera patagónica.",
      },
      {
        verb: "Verificamos",
        text: "Cruzamos las fuentes y descartamos el calor industrial antes de avisarle a nadie.",
      },
      {
        verb: "Avisamos",
        text: `Mandamos un WhatsApp con ubicación y acceso. Objetivo: ${CLAIMS.detectionMinutes} minutos desde la detección.`,
      },
    ],
    eyebrow: "Qué hace Sentinel",
    title: "Un aviso temprano de incendios forestales,",
    titleEm: "para municipios, brigadas y productores.",
    cta: "Pedir un piloto",
    how: "Ver cómo funciona",
    note: "Todo desde la nube, sin instalar equipos. Hoy trabajamos en un piloto abierto: todavía no hay casos publicados con resultados medidos.",
  },
  en: {
    points: [
      {
        verb: "We detect",
        text: "We read the fire hotspots that satellites (NASA FIRMS and GOES-19) see over the Patagonian Andes.",
      },
      {
        verb: "We verify",
        text: "We cross-check the sources and rule out industrial heat before alerting anyone.",
      },
      {
        verb: "We alert",
        text: `We send a WhatsApp alert with location and access. Target: ${CLAIMS.detectionMinutes} minutes from detection.`,
      },
    ],
    eyebrow: "What Sentinel does",
    title: "Early wildfire alerts,",
    titleEm: "for municipalities, fire brigades and producers.",
    cta: "Request a pilot",
    how: "See how it works",
    note: "Everything runs in the cloud, no equipment to install. We are running an open pilot today: there are no published cases with measured results yet.",
  },
};

export function ValueProp() {
  const c = t(COPY);
  return (
    <section
      id="propuesta"
      aria-labelledby="valor-title"
      className="a-root a-glow relative px-5 py-24 md:px-8 md:py-32"
    >
      <div className="mx-auto max-w-[1100px]">
        <Eyebrow>{c.eyebrow}</Eyebrow>
        <SplitReveal
          as="h2"
          className="a-display-m mx-auto mt-5 max-w-4xl text-center text-white"
        >
          {c.title}{" "}
          <span className="a-em">{c.titleEm}</span>
        </SplitReveal>
        <ol className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-a-line bg-a-line md:grid-cols-3">
          {c.points.map((p, i) => (
            <li key={p.verb} className="bg-a-bg p-6 md:p-8">
              <span
                aria-hidden
                className="font-[family-name:var(--font-display)] text-5xl leading-none text-a-accent/80"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="a-display-m mt-5 !text-[clamp(1.75rem,2.6vw,2.25rem)] text-[#e3f6dc]">
                {p.verb}
              </h3>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-[#b4c9bb]">
                {p.text}
              </p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a href="#contacto" className="a-pill">
            {c.cta}
          </a>
          <a href="#plataforma" className="a-pill-ghost">
            {c.how}
          </a>
        </div>
        <p className="mt-8 text-center text-[0.9375rem] text-a-mute">
          {c.note}
        </p>
      </div>
    </section>
  );
}
