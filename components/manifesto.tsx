import Image from "next/image";
import { ScrollWords } from "@/components/ui/scroll-words";
import { PHOTOS } from "@/lib/photos";

export function Manifesto() {
  const photo = PHOTOS.problemTall2;
  return (
    <section aria-label="Por qué Sentinel" className="a-forest px-5 py-20 md:px-8 md:py-32">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_300px] lg:gap-16">
        <div className="min-w-0">
          <p className="a-eyebrow mb-8 !text-left !text-xs !text-a-mute">Por qué existe Sentinel</p>
          <ScrollWords
            className="a-title !text-left !text-[clamp(1.875rem,4.4vw,3.5rem)]"
            text="Los incendios forestales avanzan más rápido de lo que alguien puede verlos. Sentinel lee los satélites, cruza los datos del terreno y le avisa a quien tiene que actuar, apenas aparece un foco de calor."
          />
        </div>
        <figure className="hidden lg:block">
          <div className="a-brackets">
            <span className="a-bk a-bk-tr" />
            <span className="a-bk a-bk-bl" />
            <Image
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              sizes="300px"
              loading="lazy"
              className="aspect-[4/5] w-full rounded-lg object-cover"
            />
          </div>
          <figcaption className="mt-3 text-xs text-a-mute">{photo.caption}</figcaption>
        </figure>
      </div>
    </section>
  );
}
