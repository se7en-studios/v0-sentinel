import Image from "next/image";
import { ArrowDown, ArrowRight } from "lucide-react";
import { PHOTOS, creditLine } from "@/lib/photos";
import { HeroReveal } from "@/components/hero-reveal";

const PROOFS = [
  "Lee NASA FIRMS y GOES-19",
  "Panel funcionando hoy",
  "Objetivo de aviso: 8 min",
];

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

// El hero pinta con CSS puro (.a-load): no espera a GSAP.
export function Hero() {
  const fire = PHOTOS.heroFire;
  return (
    <>
      <section
        id="inicio"
        className="a-root relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden"
      >
        <div data-hero-photo className="absolute inset-0 -z-20 will-change-transform">
          <Image
            src={fire.src}
            alt={fire.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: fire.position }}
          />
        </div>
        <div data-hero-dim aria-hidden className="absolute inset-0 -z-10 bg-a-bg opacity-0" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-a-bg/90 via-a-bg/30 to-transparent to-55%"
        />
        <p className="absolute right-5 top-20 text-xs text-white/70 md:right-8">{creditLine(fire)}</p>

        <div className="mx-auto w-full max-w-6xl px-5 pb-8 pt-32 md:px-8 md:pb-12">
          <h1 className="a-display a-load max-w-4xl">El aviso llega antes que el humo.</h1>

          <p className="a-sub a-load mt-6 max-w-xl text-[#e3f6dc]" style={delay(240)}>
            Detectamos focos de incendio desde el espacio y avisamos en minutos a quien tiene que actuar. Para municipios, brigadas y productores de la Patagonia.
          </p>

          <div className="a-load mt-8 flex flex-wrap items-center gap-x-8 gap-y-4" style={delay(400)}>
            <a href="#contacto" className="a-pill !pr-1.5">
              Pedir un piloto
              <span className="grid size-8 place-items-center rounded-full bg-[#06150d] text-a-accent">
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </a>
            <a
              href="#plataforma"
              className="inline-flex items-center gap-2 rounded-sm text-sm text-[#e3f6dc] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a9efc9]"
            >
              Ver cómo funciona
              <ArrowDown className="size-4" aria-hidden />
            </a>
          </div>

          <ul
            className="a-load mt-10 flex flex-col divide-y divide-a-line border-y border-a-line text-sm text-[#e3f6dc] sm:flex-row sm:divide-x sm:divide-y-0"
            style={delay(560)}
          >
            {PROOFS.map((p) => (
              <li key={p} className="py-3 sm:px-6 sm:first:pl-0 sm:last:pr-0">
                {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <HeroReveal />
    </>
  );
}
