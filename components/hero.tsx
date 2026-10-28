import { ArrowDown, ArrowRight } from "lucide-react";
import { HeroReveal } from "@/components/hero-reveal";
import { Magnetic } from "@/components/ui/magnetic";
import { HeroWorldVideo } from "@/components/hero-world-video";

const PROOFS = [
  "Lee NASA FIRMS y GOES-19",
  "Panel funcionando hoy",
  "Objetivo de aviso: 8 min",
];

const HEADLINE = "El aviso llega antes que el humo.";

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

// El hero pinta con CSS puro (.a-load): no espera a GSAP.
export function Hero() {
  return (
    <>
      <section
        id="inicio"
        className="a-root relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden"
      >
        {/* Fondo azul noche que continúa el del video; el wrapper conserva data-hero-photo para el efecto de scroll. */}
        <div
          data-hero-photo
          className="a-photo-in absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_72%_46%,#10203a_0%,#0b1426_52%,#0a1018_100%)] will-change-transform"
        >
          <HeroWorldVideo />
        </div>
        <div data-hero-dim aria-hidden className="absolute inset-0 -z-10 bg-a-bg opacity-0" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0a1018]/75 via-[#0a1018]/10 to-transparent to-60%" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-a-bg/90 via-a-bg/20 via-20% to-transparent to-45%"
        />

        <div className="relative z-[2] mx-auto w-full max-w-6xl px-5 pb-8 pt-32 md:px-8 md:pb-12">
          <h1 className="a-display a-display-xl max-w-6xl" aria-label={HEADLINE}>
            {HEADLINE.split(" ").map((w, i) => (
              <span key={i} aria-hidden>
                <span className="a-word-mask">
                  <span data-hero-word className={`a-word-in${w.startsWith("humo") ? " a-em" : ""}`} style={delay(150 + i * 80)}>{w}</span>
                </span>{" "}
              </span>
            ))}
          </h1>

          <p className="a-sub a-load mt-6 max-w-xl text-[#e3f6dc]" style={delay(240)}>
            Detectamos focos de incendio desde el espacio y avisamos en minutos a quien tiene que actuar. Para municipios, brigadas y productores de la Patagonia.
          </p>

          <div className="a-load mt-8 flex flex-wrap items-center gap-x-8 gap-y-4" style={delay(400)}>
            <Magnetic>
              <a href="#contacto" className="a-pill !pr-1.5">
                Pedir un piloto
                <span className="grid size-8 place-items-center rounded-full bg-[#06150d] text-a-accent">
                  <ArrowRight className="size-4" aria-hidden />
                </span>
              </a>
            </Magnetic>
            <a
              href="#plataforma"
              className="inline-flex items-center gap-2 rounded-sm text-[0.9375rem] text-[#e3f6dc] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a9efc9]"
            >
              Ver cómo funciona
              <ArrowDown className="size-4" aria-hidden />
            </a>
          </div>

          <ul
            className="a-load mt-10 flex flex-col divide-y divide-a-line border-y border-a-line text-[0.9375rem] text-[#e3f6dc] sm:flex-row sm:divide-x sm:divide-y-0"
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
