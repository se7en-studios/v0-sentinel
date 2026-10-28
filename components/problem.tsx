import Image from "next/image";
import { CLAIMS } from "@/lib/claims";
import { PHOTOS, creditLine, localizePhoto } from "@/lib/photos";
import { getLang, t, type Copy } from "@/lib/i18n";
import { SplitReveal } from "@/components/ui/split-reveal";
import { Eyebrow } from "@/components/a-section";
import { ProblemReveal } from "@/components/problem-reveal";

const COPY: Copy<{ lines: string[]; eyebrow: string; title: string; titleEm: string }> = {
  es: {
    lines: [
      "Casi todos los incendios grandes empiezan chicos: durante los primeros minutos alcanza con una cuadrilla y una motobomba.",
      "En la cordillera y la estepa casi nunca hay testigos: el foco se nota cuando la columna de humo ya se ve de lejos.",
      `Si la brigada llega temprano, trabaja sobre un perímetro chico. Nuestro objetivo es avisarle en ${CLAIMS.detectionMinutes} minutos.`,
    ],
    eyebrow: "El problema",
    title: "Un foco se corta con una cuadrilla o",
    titleEm: "se convierte en un frente.",
  },
  en: {
    lines: [
      "Almost every big wildfire starts small: in the first minutes, a crew and a pump are enough.",
      "In the mountains and the steppe there are almost never witnesses: the fire is noticed when the smoke column is already visible from far away.",
      `If the brigade arrives early, it works on a small perimeter. Our goal is to alert it within ${CLAIMS.detectionMinutes} minutes.`,
    ],
    eyebrow: "The problem",
    title: "A fire is stopped by a crew or",
    titleEm: "becomes a front.",
  },
};

export function Problem() {
  const c = t(COPY);
  const photo = localizePhoto(PHOTOS.problemWide, getLang());
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
          <Eyebrow align="left">{c.eyebrow}</Eyebrow>
          <SplitReveal
            as="h2"
            className="a-display-m mt-5 max-w-4xl text-white"
          >
            {c.title} <span className="a-em">{c.titleEm}</span>
          </SplitReveal>
        </div>
      </div>
      <p className="mx-auto w-full max-w-[1100px] px-5 pt-3 text-[0.8125rem] leading-relaxed text-a-faint md:px-8 md:text-right">
        {photo.caption} {creditLine(photo, getLang())}
      </p>

      <ProblemReveal lines={c.lines} />
    </section>
  );
}
