import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Chapter, Eyebrow } from "@/components/ui/chapter";

// Sin cifras: ninguna de las que tenía el sitio (-70%, 100+, 10x) tenía fuente.
const IMPACTS = [
  {
    value: "Décadas",
    body: "Lo que tarda en regenerarse un bosque nativo que se pierde en horas.",
  },
  {
    value: "Minutos",
    body: "Lo que separa un conato controlado de una catástrofe. El aviso temprano se juega ahí.",
  },
  {
    value: "Más riesgo",
    body: "Cuando el fuego ya se ve desde una torre o por su columna de humo, combatirlo cuesta más y expone más a las brigadas.",
  },
];

export function Problem() {
  return (
    <Chapter id="problema" tone="dark" className="overflow-hidden">
      <Image
        src="/problem-a1.jpg"
        alt=""
        fill
        sizes="100vw"
        loading="lazy"
        className="object-cover"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-charcoal/90 via-charcoal/80 to-charcoal" />

      <div className="relative">
        <Eyebrow tone="dark">El costo de llegar tarde</Eyebrow>
        <h2 className="t-display max-w-4xl text-balance">Hoy la Patagonia duele.</h2>
        <p className="t-lead mt-6 max-w-2xl text-[#f4efe2]/90">
          Cada temporada se repite lo mismo: incendios que avanzan antes de que alguien pueda dar la alarma.
          Detrás de cada hectárea hay un hogar, un trabajo y una biodiversidad que no vuelve en lo que dura una vida.
        </p>

        <dl className="mt-14 grid gap-8 border-t border-[#f4efe2]/20 pt-10 md:mt-20 md:grid-cols-3 md:gap-10">
          {IMPACTS.map((i) => (
            <div key={i.value} className="flex flex-col">
              <dt className="t-h2 order-1 text-ember-soft">{i.value}</dt>
              <dd className="t-body order-2 mt-3 text-[#f4efe2]/85">{i.body}</dd>
            </div>
          ))}
        </dl>
        <p className="t-small mt-8 text-[#f4efe2]/70">
          Lectura cualitativa del equipo. No publicamos cifras sin fuente verificable.
        </p>

        <a
          href="#contacto"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-leaf-bright px-7 py-3.5 text-base font-semibold text-charcoal transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Sumar mi municipio o campo <ArrowRight className="size-4" aria-hidden />
        </a>
      </div>
    </Chapter>
  );
}
