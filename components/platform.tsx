import { PlatformDemo } from "@/components/platform-demo";
import { SplitReveal } from "@/components/ui/split-reveal";

export function Platform() {
  return (
    <section
      id="plataforma"
      className="a-bone font-[family-name:var(--font-geist)]"
    >
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="py-24 md:py-32">
          <SplitReveal as="h2" className="a-display-m max-w-3xl text-[#131a16]">
            Del satélite a tu celular, <span className="a-em">sin mirar un mapa.</span>
          </SplitReveal>
        </div>
        <PlatformDemo />
        <div className="h-24 md:h-32" aria-hidden />
      </div>
    </section>
  );
}
