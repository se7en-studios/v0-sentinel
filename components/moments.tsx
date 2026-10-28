import type { ReactNode } from "react";
import Image from "next/image";
import { momentsFor } from "@/components/awards";
import { getLang, t, type Copy } from "@/lib/i18n";
import { CircularGallery } from "@/components/ui/circular-gallery";
import { MomentsPinner } from "@/components/moments-pinner";

const COPY: Copy<{ eyebrow: string; heading: ReactNode; sub: string }> = {
  es: {
    eyebrow: "Momentos",
    heading: (
      <>
        Más momentos <span className="a-em">del camino.</span>
      </>
    ),
    sub: "Fotos del equipo en las competencias y eventos donde presentamos Sentinel.",
  },
  en: {
    eyebrow: "Moments",
    heading: (
      <>
        More moments <span className="a-em">along the way.</span>
      </>
    ),
    sub: "Photos of the team at the competitions and events where we presented Sentinel.",
  },
};

// Sección propia (separada de Reconocimientos) para que las fotos se vean grandes. Con reduced-motion no gira: grilla.
export function MomentsSection() {
  const c = t(COPY);
  const MOMENTS = momentsFor(getLang());
  return (
    <section
      id="momentos"
      aria-labelledby="momentos-title"
      className="a-root a-glow relative overflow-hidden px-5 py-24 md:px-8 md:py-32 data-[pin]:flex data-[pin]:h-screen data-[pin]:flex-col data-[pin]:justify-center data-[pin]:pb-0 data-[pin]:pt-16"
    >
      <div className="mx-auto max-w-[1100px] text-center">
        <p className="a-eyebrow flex items-center justify-center gap-3 !text-a-accent">
          <span aria-hidden className="h-px w-8 bg-a-accent/60" />
          {c.eyebrow}
        </p>
        <h2 id="momentos-title" className="a-display-m mx-auto mt-4 max-w-3xl !text-[clamp(2.5rem,5.4vw,4.75rem)] text-white">
          {c.heading}
        </h2>
        <p className="a-sub mx-auto mt-5 max-w-xl">
          {c.sub}
        </p>
      </div>

      <MomentsPinner />
      <CircularGallery
        items={MOMENTS}
        className="-mt-2 h-[58vh] min-h-[440px] max-md:h-[84vh] max-md:min-h-[460px] max-md:[zoom:0.58] motion-reduce:hidden"
      />

      <ul className="mx-auto mt-12 hidden max-w-[1100px] grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5 motion-reduce:grid">
        {MOMENTS.map((m) => (
          <li key={m.src} className="relative aspect-[3/4] overflow-hidden rounded-xl border border-white/25">
            <Image src={m.src} alt={m.alt} fill sizes="(min-width: 1024px) 20vw, 45vw" quality={90} loading="lazy" className="object-cover" />
          </li>
        ))}
      </ul>
    </section>
  );
}
