import Image from "next/image";
import { CLAIMS } from "@/lib/claims";
import { PHOTOS, creditLine } from "@/lib/photos";
import { SplitReveal } from "@/components/ui/split-reveal";
import { ProblemReveal } from "@/components/problem-reveal";

const LINES = [
  "Casi todos los incendios grandes empiezan chicos: durante los primeros minutos alcanza con una cuadrilla y una motobomba.",
  "En la cordillera y la estepa casi nunca hay testigos: el foco se nota cuando la columna de humo ya se ve de lejos.",
  `Si la brigada llega temprano, trabaja sobre un perímetro chico. Nuestro objetivo es avisarle en ${CLAIMS.detectionMinutes} minutos.`,
];

export function Problem() {
  const photo = PHOTOS.problemWide;
  return (
    <section id="problema" className="a-root relative scroll-mt-20">
      <div className="relative flex min-h-[100svh] items-end overflow-hidden">
        {/* Marco más alto que la pantalla: .a-parallax lo desplaza lento al scrollear. */}
        <div className="a-parallax absolute inset-x-0 -top-[9%] h-[118%]">
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="100vw"
            quality={90}
            loading="lazy"
            className="object-cover"
            style={{ objectPosition: photo.position }}
          />
        </div>
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-a-bg via-a-bg/45 to-a-bg/5"
        />
        <div className="relative mx-auto w-full max-w-[1100px] px-5 pb-16 pt-40 md:px-8 md:pb-24">
          <SplitReveal
            as="h2"
            className="a-display-m max-w-4xl !text-[clamp(2.5rem,6vw,5rem)] text-white"
          >
            Un foco se corta con una cuadrilla o <span className="a-em">se convierte en un frente.</span>
          </SplitReveal>
        </div>
      </div>
      <p className="mx-auto w-full max-w-[1100px] px-5 pt-3 text-[0.8125rem] leading-relaxed text-a-faint md:px-8 md:text-right">
        {photo.caption} {creditLine(photo)}
      </p>

      <ProblemReveal lines={LINES} />
    </section>
  );
}
