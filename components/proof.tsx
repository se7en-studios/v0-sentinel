import Link from "next/link";
import { TeamBlock } from "@/components/team";
import { AwardsBlock } from "@/components/awards";
import { PressBlock } from "@/components/press";
import { PartnersBlock } from "@/components/partners";

// Quiénes somos, contado como una nota larga: equipo, logros, prensa y aliados.
export function Proof() {
  return (
    <section id="equipo" className="scroll-mt-20 bg-paper py-24 text-ink md:py-32">
      <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
        <div className="grid gap-8 lg:grid-cols-12">
          <h2 className="t-h2 lg:col-span-7">
            Somos cuatro ingenieros de la Patagonia que quieren que el fuego se
            vea antes de que sea tarde.
          </h2>
          <div className="t-lead space-y-4 lg:col-span-4 lg:col-start-9">
            <p>
              Empezamos en la universidad, en San Rafael, mirando cómo cada
              verano los incendios del sur se veían tarde. Hoy construimos un
              sistema que cruza datos satelitales con información del terreno
              para avisar de un posible foco.
            </p>
            <p>
              Todavía no hay pilotos con resultados medidos. Lo que podemos
              mostrar es quiénes somos, qué reconocimientos tuvo el proyecto y
              cómo medimos lo que afirmamos.
            </p>
          </div>
        </div>

        <div className="mt-16 md:mt-20">
          <TeamBlock />
        </div>

        <div className="mt-24 md:mt-32">
          <AwardsBlock />
        </div>

        <div id="prensa" className="mt-24 scroll-mt-20 md:mt-32">
          <PressBlock />
        </div>

        <div className="mt-24 md:mt-32">
          <PartnersBlock />
        </div>

        <p className="t-body mt-16">
          <Link
            href="/metodologia"
            className="font-semibold text-brand underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            Cómo medimos lo que afirmamos
          </Link>
        </p>
      </div>
    </section>
  );
}
