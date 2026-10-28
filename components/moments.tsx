import Image from "next/image";
import { MOMENTS } from "@/components/awards";
import { CircularGallery } from "@/components/ui/circular-gallery";

// Sección propia (separada de Reconocimientos) para que las fotos se vean grandes. Con reduced-motion no gira: grilla.
export function MomentsSection() {
  return (
    <section
      id="momentos"
      aria-labelledby="momentos-title"
      className="a-root a-glow relative overflow-hidden px-5 py-24 md:px-8 md:py-32"
    >
      <div className="mx-auto max-w-[1100px] text-center">
        <p className="a-eyebrow flex items-center justify-center gap-3 !text-a-accent">
          <span aria-hidden className="h-px w-8 bg-a-accent/60" />
          Momentos
        </p>
        <h2 id="momentos-title" className="a-display-m mx-auto mt-4 max-w-3xl !text-[clamp(2.5rem,5.4vw,4.75rem)] text-white">
          Más momentos <span className="a-em">del camino.</span>
        </h2>
        <p className="a-sub mx-auto mt-5 max-w-xl">
          Fotos del equipo en las competencias y eventos donde presentamos Sentinel.
        </p>
      </div>

      <CircularGallery
        items={MOMENTS}
        className="-mt-2 h-[64vh] min-h-[480px] max-md:h-[84vh] max-md:min-h-[460px] max-md:[zoom:0.58] motion-reduce:hidden"
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
