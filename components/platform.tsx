import { PlatformDemo } from "@/components/platform-demo";
import { SplitReveal } from "@/components/ui/split-reveal";
import { Eyebrow } from "@/components/a-section";
import { t, type Copy } from "@/lib/i18n";

const COPY: Copy<{ eyebrow: string; title: string; em: string; cta: string }> = {
  es: {
    eyebrow: "Cómo funciona",
    title: "Del satélite a tu celular, ",
    em: "sin mirar un mapa.",
    cta: "Probalo con tu localidad",
  },
  en: {
    eyebrow: "How it works",
    title: "From satellite to your phone, ",
    em: "no map needed.",
    cta: "Try it with your town",
  },
};

export function Platform() {
  const c = t(COPY);
  return (
    <section
      id="plataforma"
      className="a-bone a-fade-top a-fade-bottom font-[family-name:var(--font-geist)]"
    >
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="py-24 text-center md:py-32">
          <Eyebrow>{c.eyebrow}</Eyebrow>
          <SplitReveal as="h2" className="a-display-m mx-auto mt-5 max-w-3xl text-[#131a16]">
            {c.title}<span className="a-em">{c.em}</span>
          </SplitReveal>
        </div>
        <PlatformDemo />
        <div className="flex justify-center pb-24 pt-16 md:pb-32">
          <a
            href="#en-vivo"
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#131a16]/30 px-6 font-medium text-[#131a16] transition-colors hover:bg-[#131a16] hover:text-[#e6e3dc]"
          >
            {c.cta}
            <span aria-hidden>↓</span>
          </a>
        </div>
      </div>
    </section>
  );
}
