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

// Mismo grading para todas las fotos: desaturado leve + tinte verde→ember.
const GRADE = "saturate-[0.6] contrast-[1.08] brightness-[0.9]";
const TINT =
  "bg-gradient-to-tr from-leaf/35 via-transparent to-ember/30 mix-blend-soft-light";

function Photo({
  src,
  className,
  sizes,
}: {
  src: string;
  className: string;
  sizes: string;
}) {
  return (
    <div
      className={`absolute overflow-hidden rounded-[20px] border border-[#f4efe2]/15 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] ${className}`}
    >
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        loading="lazy"
        className={`object-cover ${GRADE}`}
      />
      <div aria-hidden className={`absolute inset-0 ${TINT}`} />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-charcoal/55 via-transparent to-transparent"
      />
    </div>
  );
}

export function Problem() {
  return (
    <Chapter
      id="problema"
      tone="dark"
      className="overflow-hidden pb-44 md:pb-56"
    >
      {/* Foto a sangre como atmósfera: se disuelve hacia abajo, nunca compite con el texto. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[70%]"
        style={{
          maskImage: "linear-gradient(to bottom, #000 25%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, #000 25%, transparent 100%)",
        }}
      >
        <Image
          src="/problem-a1.jpg"
          alt=""
          fill
          sizes="100vw"
          loading="lazy"
          className={`object-cover ${GRADE}`}
        />
        <div className={`absolute inset-0 ${TINT}`} />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/90 via-charcoal/60 to-charcoal/30" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-charcoal to-transparent"
      />
      <div
        aria-hidden
        className="bg-noise pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
      />

      <div className="relative grid items-center gap-14 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Eyebrow tone="dark">El costo de llegar tarde</Eyebrow>
          <h2 className="t-display text-balance [text-shadow:0_2px_30px_rgba(0,0,0,0.5)]">
            Hoy la Patagonia duele.
          </h2>
          <p className="t-lead mt-6 max-w-xl text-[#f4efe2]/90">
            Cada temporada se repite lo mismo: incendios que avanzan antes de
            que alguien pueda dar la alarma. Detrás de cada hectárea hay un
            hogar, un trabajo y una biodiversidad que no vuelve en lo que dura
            una vida.
          </p>
        </div>

        <div
          aria-hidden
          className="relative h-[22rem] sm:h-[26rem] lg:col-span-5 lg:h-[30rem]"
        >
          <Photo
            src="/problem-a2.jpg"
            sizes="(min-width: 1024px) 28vw, 70vw"
            className="right-0 top-0 h-[72%] w-[66%]"
          />
          <Photo
            src="/problem-a3.jpg"
            sizes="(min-width: 1024px) 22vw, 52vw"
            className="bottom-0 left-0 h-[54%] w-[50%] border-[3px] border-charcoal"
          />
        </div>
      </div>

      <dl className="relative mt-16 grid gap-5 md:mt-24 md:grid-cols-3 md:gap-6">
        {IMPACTS.map((i, idx) => (
          <div
            key={i.value}
            className={`glass relative flex flex-col overflow-hidden rounded-[20px] p-7 md:p-8 ${idx === 1 ? "md:mt-10" : ""} ${idx === 2 ? "md:mt-20" : ""}`}
          >
            <span
              aria-hidden
              className="t-display pointer-events-none absolute -right-2 -top-4 select-none text-[6.5rem] leading-none text-ember/20"
            >
              {String(idx + 1).padStart(2, "0")}
            </span>
            <dt className="t-h2 relative order-1 text-ember-soft">{i.value}</dt>
            <dd className="t-body relative order-2 mt-4 text-[#f4efe2]/85">
              {i.body}
            </dd>
          </div>
        ))}
      </dl>

      <div className="relative mt-16 max-w-3xl md:mt-24">
        <p className="t-display text-balance text-[clamp(1.9rem,4.2vw,3.25rem)]">
          Llegar a tiempo cambia todo lo que viene después.
        </p>
        <p className="t-small mt-5 text-[#f4efe2]/70">
          Lectura cualitativa del equipo. No publicamos cifras sin fuente
          verificable.
        </p>
        <a
          href="#contacto"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-leaf-bright px-7 py-3.5 text-base font-semibold text-charcoal shadow-[0_10px_40px_-10px_rgba(95,227,161,0.55)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Sumar mi municipio o campo{" "}
          <ArrowRight className="size-4" aria-hidden />
        </a>
      </div>

      {/* Funde hacia el capítulo claro siguiente en vez de cortar en seco. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background md:h-52"
      />
    </Chapter>
  );
}
