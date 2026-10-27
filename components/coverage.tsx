import { ASection } from "@/components/a-section";
import { SplitReveal } from "@/components/ui/split-reveal";
import { CoverageGlobe } from "@/components/coverage-globe";

// Alcance: los satélites ven el planeta; Sentinel empieza por la cordillera patagónica.
export function Coverage() {
  return (
    <ASection id="alcance">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16">
        <div>
          <p className="a-eyebrow !text-left">Alcance</p>
          <SplitReveal as="h2" className="a-display-m mt-4 max-w-xl">
            El fuego no tiene fronteras. Nosotros empezamos por la Patagonia.
          </SplitReveal>
          <p className="a-sub a-rise mt-6 max-w-md">
            Los satélites que leemos, NASA FIRMS y GOES-19, miran todo el
            continente. Hoy concentramos el trabajo en la cordillera patagónica,
            donde un foco puede pasar horas sin que nadie lo vea.
          </p>
          <p className="mt-8 flex items-center gap-3 text-[0.9375rem] text-a-mute">
            <span
              aria-hidden
              className="inline-block size-2.5 rounded-full bg-[#ffc247] shadow-[0_0_12px_#ffc247]"
            />
            Donde trabaja Sentinel
            <span
              aria-hidden
              className="ml-3 inline-block size-2.5 rounded-full bg-[#ff6a2b] shadow-[0_0_12px_#ff6a2b]"
            />
            Otras zonas de incendios grandes
          </p>
          <p className="mt-3 text-[0.8125rem] text-a-faint">
            Ilustrativo: los puntos marcan zonas, no focos en tiempo real.
          </p>
        </div>

        <div className="relative h-[420px] md:h-[560px]">
          <CoverageGlobe />
        </div>
      </div>
    </ASection>
  );
}
