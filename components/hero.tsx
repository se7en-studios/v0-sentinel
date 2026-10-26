import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { CLAIMS } from "@/lib/claims";
import { CountUp } from "@/components/count-up";
import { FireTimeline } from "@/components/fire-timeline";
import { HeroPanel } from "@/components/hero-panel";
import { HeroThermalLazy } from "@/components/hero-thermal-lazy";
import { Magnetic } from "@/components/ui/magnetic";
import { Reveal } from "@/components/ui/reveal";

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

// Retícula fina: la capa de datos de «Patagonia a la lupa», solo un susurro.
const GRID =
  "linear-gradient(rgba(244,239,226,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(244,239,226,0.05) 1px, transparent 1px)";

// Entrada escalonada solo en CSS; el h1 queda fuera para no demorar el LCP.
const RISE = "motion-safe:animate-[hero-rise_0.8s_cubic-bezier(0.2,0.7,0.2,1)_both]";

export function Hero() {
  return (
    <div id="inicio">
      <section
        data-nav-dark
        className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-charcoal text-[#f4efe2]"
      >
        {/* Espejada: el bosque oscuro queda bajo el texto y cielo/río detrás del producto. */}
        <Image
          src="/hero-forest.avif"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-30 -scale-x-100 object-cover saturate-[0.9] brightness-110"
        />
        {/* Grading: luz cálida arriba a la derecha, verde frío abajo, scrim solo tras el texto. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-20"
          style={{
            backgroundImage:
              "radial-gradient(60% 55% at 85% 12%, rgba(232,115,42,0.22), transparent 70%), radial-gradient(50% 50% at 70% 100%, rgba(15,122,79,0.28), transparent 70%)",
          }}
        />
        <div aria-hidden className="absolute inset-0 -z-20 bg-gradient-to-b from-charcoal/70 via-charcoal/45 to-charcoal/90 lg:hidden" />
        <div
          aria-hidden
          className="absolute inset-0 -z-20 hidden bg-gradient-to-r from-charcoal/90 via-charcoal/55 to-transparent lg:block [mask-image:linear-gradient(to_right,#000_45%,transparent_75%)]"
        />
        <div aria-hidden className="absolute inset-x-0 top-0 -z-20 hidden h-40 bg-gradient-to-b from-charcoal/60 to-transparent lg:block" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 -z-20 h-1/3 bg-gradient-to-t from-charcoal to-transparent" />
        <div aria-hidden className="bg-noise absolute inset-0 -z-10 opacity-[0.07] mix-blend-overlay" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 [mask-image:radial-gradient(70%_70%_at_30%_40%,#000,transparent)]"
          style={{ backgroundImage: GRID, backgroundSize: "72px 72px" }}
        />

        <style>{`@keyframes hero-rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
        <HeroThermalLazy />

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-6 pt-32 md:px-8 lg:pb-14">
          <div className="lg:max-w-[30rem] xl:max-w-[34rem]">
            <Reveal className={RISE}>
              <p className="t-label mb-5 text-leaf-bright">Sentinel Cloud · detección temprana de incendios</p>
            </Reveal>
            <h1 className="t-display text-balance lg:text-[clamp(3rem,5.2vw,5rem)]!">El aviso llega antes que el humo.</h1>
            <Reveal delay={100} className={`${RISE} [animation-delay:120ms]`}>
              <p className="t-lead mt-6 max-w-xl text-[#f4efe2]/90">
                Cruzamos satélites ({CLAIMS.satellites}), terreno e IA. Avisamos a quien tiene que actuar, apenas aparece un foco térmico.
              </p>
            </Reveal>

            <Reveal delay={200} className={`${RISE} [animation-delay:240ms]`}>
            <dl className="mt-8 grid max-w-md grid-cols-3 gap-4 border-y border-[#f4efe2]/15 py-5">
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
            </Reveal>

            <Reveal delay={300} className={`${RISE} [animation-delay:360ms] mt-8 flex flex-col gap-3 sm:flex-row sm:items-center`}>
              <Magnetic>
                <a
                  href="#contacto"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-leaf-bright px-8 py-3.5 text-base font-semibold text-charcoal shadow-[0_10px_40px_-8px_rgb(95_227_161/0.55)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Solicitar un piloto <ArrowRight className="size-4" aria-hidden />
                </a>
              </Magnetic>
              <a
                href="/demo"
                className="glass inline-flex items-center justify-center rounded-full px-8 py-3.5 text-base text-[#f4efe2] transition-colors hover:border-[#f4efe2]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Ver el panel en vivo
              </a>
            </Reveal>
          </div>
        </div>

        <HeroPanel />

        <nav aria-label="Para quién" className="relative z-10 border-t border-[#f4efe2]/15 bg-charcoal/70 backdrop-blur-md">
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
