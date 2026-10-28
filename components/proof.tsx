import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SplitReveal } from "@/components/ui/split-reveal";
import { ASection, Eyebrow, aFocus } from "@/components/a-section";
import { TeamBlock } from "@/components/team";
import { AwardsBlock } from "@/components/awards";
import { MomentsSection } from "@/components/moments";
import { PressBlock } from "@/components/press";
import { PartnersBlock } from "@/components/partners";
import { t, type Copy } from "@/lib/i18n";

const COPY: Copy<{
  eyebrow: string;
  heading: ReactNode;
  intro: string;
  method: string;
  after: string;
  full: string;
}> = {
  es: {
    eyebrow: "Quiénes somos",
    heading: (
      <>
        Somos cuatro ingenieros de la Patagonia que queremos <span className="a-em">que el fuego se vea antes.</span>
      </>
    ),
    intro:
      "Empezamos Sentinel en la universidad y lo seguimos construyendo nosotros. Todavía no tenemos pilotos con resultados medidos: por eso te mostramos quiénes somos, qué reconocimientos tuvo el proyecto y ",
    method: "cómo medimos lo que afirmamos",
    after: ".",
    full: "Metodología completa",
  },
  en: {
    eyebrow: "Who we are",
    heading: (
      <>
        We are four engineers from Patagonia who want <span className="a-em">fires to be seen sooner.</span>
      </>
    ),
    intro:
      "We started Sentinel at university and we keep building it ourselves. We don't have pilots with measured results yet, so we show you who we are, what recognition the project has received and ",
    method: "how we measure what we claim",
    after: ".",
    full: "Full methodology",
  },
};

// Un solo capítulo claro. "noticias" y "prensa" siguen como anclajes porque
// lib/sections.ts (navbar y puntos laterales) todavía los referencia.
export function Proof() {
  const c = t(COPY);
  return (
    <>
      <ASection id="equipo" tone="bone" className="a-fade-top !pb-0">
        <span id="reconocimientos" className="absolute" aria-hidden />
        <div className="text-center">
        <Eyebrow>{c.eyebrow}</Eyebrow>
        <SplitReveal as="h2" className="a-display-m mx-auto mt-5 max-w-3xl">
          {c.heading}
        </SplitReveal>
        <p className="a-sub a-rise mx-auto mt-8 max-w-xl">
          {c.intro}
          <Link href="/metodologia" className={`underline underline-offset-4 ${aFocus}`}>
            {c.method}
          </Link>
          {c.after}
        </p>
        </div>

        <div className="mt-16 md:mt-20">
          <TeamBlock />
        </div>
      </ASection>

      {/* Todo el ancho: la sección se clava y corre en horizontal. */}
      <AwardsBlock />
      <MomentsSection />

      <ASection tone="bone" className="a-fade-top a-fade-bottom !pt-16">
        <div id="prensa" className="scroll-mt-20">
          <span id="noticias" className="absolute" aria-hidden />
          <PressBlock />
        </div>

        <div className="mt-24 md:mt-32">
          <PartnersBlock />
        </div>

        <p className="mt-16">
          <Link
            href="/metodologia"
            className={`inline-flex min-h-11 items-center gap-2 font-medium underline underline-offset-4 ${aFocus}`}
          >
            {c.full}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </p>
      </ASection>
    </>
  );
}
