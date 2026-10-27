import { SplitReveal } from "@/components/ui/split-reveal";
import { CLAIMS } from "@/lib/claims";

// Propuesta de valor en una pantalla: qué hacemos, para quién y en qué plazo. Solo repite lo que ya dice el resto de la landing.
const POINTS = [
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
];

export function ValueProp() {
  return (
    <section
      id="propuesta"
      aria-labelledby="valor-title"
      className="a-root relative px-5 py-24 md:px-8 md:py-32"
    >
      <div className="mx-auto max-w-[1100px]">
        <p className="a-eyebrow flex items-center gap-3 !text-left">
          <span aria-hidden className="h-px w-8 bg-a-accent/60" />
          Qué hace Sentinel
        </p>
        <SplitReveal
          as="h2"
          className="a-display-m mt-5 max-w-4xl !text-[clamp(2.25rem,5vw,4.25rem)] text-white"
        >
          Un aviso temprano de incendios forestales,{" "}
          <span className="a-em">para municipios, brigadas y productores.</span>
        </SplitReveal>
        <ol className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-a-line bg-a-line md:grid-cols-3">
          {POINTS.map((p, i) => (
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
        <p className="mt-6 text-[0.9375rem] text-a-mute">
          Todo desde la nube, sin instalar equipos. Hoy trabajamos en un piloto
          abierto: todavía no hay casos publicados con resultados medidos.
        </p>
      </div>
    </section>
  );
}
