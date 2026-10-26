import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Chapter, Eyebrow } from "@/components/ui/chapter";
import { TeamBlock } from "@/components/team";
import { AwardsBlock } from "@/components/awards";
import { PressBlock } from "@/components/press";
import { PartnersBlock } from "@/components/partners";

// Un solo capítulo de confianza. Los anclajes "noticias" y "prensa" siguen existiendo
// porque lib/sections.ts (navbar y puntos laterales) todavía los referencia.
export function Proof() {
  return (
    <Chapter id="equipo">
      <span id="noticias" className="absolute" aria-hidden />
      <Eyebrow>Quiénes somos</Eyebrow>
      <h2 className="t-h2 max-w-3xl">
        Cuatro ingenieros argentinos construyendo detección temprana para la
        Patagonia.
      </h2>
      <p className="t-lead mt-5 max-w-2xl opacity-80">
        Todavía no hay pilotos cuantificados: lo que podemos mostrar hoy es
        quién lo hace, qué reconocimientos tuvo el proyecto y cómo medimos lo
        que afirmamos.
      </p>

      <div className="mt-14">
        <TeamBlock />
      </div>

      <div className="mt-24">
        <h3 className="t-h3 mb-8">Logros</h3>
        <AwardsBlock />
      </div>

      <div id="prensa" className="mt-24 scroll-mt-20">
        <h3 className="t-h3 mb-6">Dónde salimos en los medios</h3>
        <PressBlock />
      </div>

      <div className="mt-24 border-t border-foreground/15 pt-12">
        <PartnersBlock />
      </div>

      <p className="t-body mt-12">
        <Link
          href="/metodologia"
          className="inline-flex items-center gap-2 font-semibold underline decoration-foreground/30 underline-offset-4 hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Cómo medimos lo que afirmamos
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </p>
    </Chapter>
  );
}
