import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ASection, AHeading, aFocus } from "@/components/a-section";
import { TeamBlock } from "@/components/team";
import { AwardsBlock } from "@/components/awards";
import { PressBlock } from "@/components/press";
import { PartnersBlock } from "@/components/partners";

// Un solo capítulo de confianza. Los anclajes "noticias" y "prensa" siguen existiendo
// porque lib/sections.ts (navbar y puntos laterales) todavía los referencia.
export function Proof() {
  return (
    <>
    <ASection id="equipo">
      <AHeading
        eyebrow="Quiénes somos"
        title="Somos cuatro ingenieros argentinos y queremos llegar antes al fuego en la Patagonia"
        sub="Todavía no tenemos pilotos con resultados para mostrarte. Lo que sí podemos mostrar es quiénes somos, qué reconocimientos tuvo el proyecto y cómo medimos lo que afirmamos."
      />

      <div className="mt-14 md:mt-20">
        <TeamBlock />
      </div>
    </ASection>

    <ASection id="reconocimientos" tone="surface" className="!py-20 md:!py-28">
      <span id="noticias" className="absolute" aria-hidden />
      <h2 className="a-title a-rise text-center">Lo que ya pasó</h2>
      <div className="mt-10">
        <AwardsBlock />
      </div>

      <div id="prensa" className="mt-24 scroll-mt-20">
        <h3 className="a-title a-rise !text-2xl text-center">Dónde salimos en los medios</h3>
        <div className="mt-10">
          <PressBlock />
        </div>
      </div>

      <div className="mt-24 border-t border-a-line pt-12">
        <PartnersBlock />
      </div>

      <p className="mt-12 text-center">
        <Link href="/metodologia" className={`a-pill-ghost group ${aFocus}`}>
          Cómo medimos lo que afirmamos
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
        </Link>
      </p>
    </ASection>
    </>
  );
}
