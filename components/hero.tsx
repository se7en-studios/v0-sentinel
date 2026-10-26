import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { CLAIMS } from "@/lib/claims";
import { CountUp } from "@/components/count-up";
import { FireTimeline } from "@/components/fire-timeline";

export { FireTimeline };

const STATS = [
  { to: CLAIMS.detectionMinutes, unit: "min", label: "Objetivo de detección" },
  { to: CLAIMS.accuracyPct, unit: "%", label: "Precisión objetivo" },
  { to: CLAIMS.monitoringHours, unit: "h", label: "Monitoreo continuo" },
];

const AUDIENCES = [
  "Municipios y Defensa Civil",
  "Brigadas y bomberos",
  "Campos y forestales",
];

// Retícula fina + coordenadas: la capa de datos de «Patagonia a la lupa».
const GRID =
  "linear-gradient(rgba(244,239,226,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(244,239,226,0.07) 1px, transparent 1px)";

export function Hero() {
  return (
    <div id="inicio">
      <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-charcoal text-[#f4efe2]">
        <Image
          src="/hero-forest.avif"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-30 object-cover"
        />
        <div aria-hidden className="absolute inset-0 -z-20 bg-gradient-to-t from-charcoal via-charcoal/80 to-charcoal/55" />
        <div aria-hidden className="absolute inset-0 -z-20 bg-gradient-to-r from-charcoal/70 to-transparent" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{ backgroundImage: GRID, backgroundSize: "72px 72px" }}
        />
        <div aria-hidden className="t-label absolute right-5 top-24 -z-10 hidden text-right text-[#f4efe2]/60 sm:block md:right-8">
          <div>S 41°09′ · O 71°18′</div>
          <div>{CLAIMS.region}</div>
        </div>

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-5 pb-10 pt-32 md:px-8 md:pb-14">
          <p className="t-label mb-5 text-leaf-bright">Sentinel Cloud · detección temprana de incendios</p>
          <h1 className="t-display max-w-4xl text-balance">El aviso llega antes que el humo.</h1>
          <p className="t-lead mt-6 max-w-xl text-[#f4efe2]/90">
            Cruzamos satélites ({CLAIMS.satellites}), terreno e IA. Avisamos a quien tiene que actuar, apenas aparece un foco térmico.
          </p>

          <dl className="mt-8 grid max-w-xl grid-cols-3 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col">
                <dt className="order-2 mt-1 text-sm leading-snug text-[#f4efe2]/80">{s.label}</dt>
                <dd className="t-h2 order-1 text-[#f4efe2]">
                  <CountUp to={s.to} />
                  <span className="text-leaf-bright">{s.unit}</span>
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="#contacto"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-leaf-bright px-8 py-3.5 text-base font-semibold text-charcoal transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Solicitar un piloto <ArrowRight className="size-4" aria-hidden />
            </a>
            <a
              href="/demo"
              className="inline-flex items-center justify-center rounded-full border border-[#f4efe2]/40 px-8 py-3.5 text-base text-[#f4efe2] transition-colors hover:border-[#f4efe2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Ver el panel en vivo
            </a>
          </div>
        </div>

        <nav aria-label="Para quién" className="border-t border-[#f4efe2]/15 bg-charcoal/85">
          <ul className="mx-auto flex max-w-6xl flex-col px-5 md:flex-row md:px-8">
            {AUDIENCES.map((a) => (
              <li key={a} className="md:flex-1">
                <a
                  href="#para-quien"
                  className="flex items-center justify-between gap-3 py-4 text-base text-[#f4efe2]/90 transition-colors hover:text-leaf-bright focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white md:py-5"
                >
                  {a} <ArrowRight className="size-4 shrink-0" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </section>
      <FireTimeline />
    </div>
  );
}
