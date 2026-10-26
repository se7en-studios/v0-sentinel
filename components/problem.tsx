import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { PHOTOS, type Photo } from "@/lib/photos";
import { CLAIMS } from "@/lib/claims";

function Figure({
  photo,
  sizes,
  className = "",
}: {
  photo: Photo;
  sizes: string;
  className?: string;
}) {
  return (
    <figure className={className}>
      <Image
        src={photo.src}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        sizes={sizes}
        loading="lazy"
        className="block h-auto w-full"
      />
      <figcaption className="t-caption mt-2">{photo.caption}</figcaption>
    </figure>
  );
}

export function Problem() {
  return (
    <section id="problema" className="scroll-mt-20 text-ink">
      <div className="bg-paper py-20 md:py-32">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <Reveal>
            <h2 className="t-h2 max-w-4xl text-balance">
              Un foco se corta con una cuadrilla o se convierte en un frente, y
              la diferencia es cuánto tarda alguien en enterarse
            </h2>
          </Reveal>
        </div>
      </div>

      <div className="bg-ink py-12 text-paper md:py-20">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-5 md:px-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <Reveal>
              <Image
                src={PHOTOS.problemWide.src}
                alt={PHOTOS.problemWide.alt}
                width={PHOTOS.problemWide.width}
                height={PHOTOS.problemWide.height}
                sizes="(min-width: 1024px) 58vw, 100vw"
                loading="lazy"
                className="block h-auto w-full"
              />
            </Reveal>
            <p className="t-caption mt-3">{PHOTOS.problemWide.caption}</p>
          </div>
          <blockquote className="lg:col-span-5 lg:self-center lg:pl-6">
            <p className="t-quote text-balance">
              Un foco chico se apaga con poca gente. Lo difícil es enterarse a
              tiempo.
            </p>
            <footer className="t-caption mt-4">El equipo de Sentinel</footer>
          </blockquote>
        </div>
      </div>

      <div className="bg-paper py-20 md:py-32">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="t-body space-y-6 text-ink/90 lg:col-span-6 lg:text-[1.0625rem]">
              <p>
                En los primeros minutos un foco es chico: un árbol, una franja
                de pasto seco, algo que una cuadrilla con mochilas y agua puede
                cortar. Pero en la cordillera casi nunca tiene testigos. Está en
                una ladera sin camino, en un campo sin gente o del otro lado de
                un cerro.
              </p>
              <p>
                Desde lejos no se ve. El humo recién se nota cuando el fuego ya
                tomó forma, y para entonces el viento y la pendiente trabajan a
                su favor. Alguien tiene que verlo, descartar que sea una quema,
                encontrar a quién llamar y explicar dónde está. Cada paso suma
                minutos.
              </p>
              <p>
                Cuando la brigada llega, el trabajo ya cambió. Ya no se corta un
                foco, se defiende un frente, con más gente, más agua y más
                exposición para quienes están en el terreno. Esa demora no
                figura en ninguna planilla, pero se paga en hectáreas y en
                riesgo.
              </p>
              <p>
                Nosotros atacamos un solo tramo de ese problema: ver el calor
                desde el satélite apenas aparece y avisar a quien tiene que ir.
                Nuestro objetivo es hacerlo en {CLAIMS.detectionMinutes}{" "}
                minutos. Todavía es un objetivo y no una medición.
              </p>
            </div>

            <Reveal className="lg:col-span-4 lg:col-start-9">
              <Figure
                photo={PHOTOS.problemTall1}
                sizes="(min-width: 1024px) 30vw, 100vw"
              />
            </Reveal>
          </div>

          <div className="mt-16 grid items-end gap-10 md:mt-24 lg:grid-cols-12">
            <Reveal className="max-w-sm lg:col-span-4">
              <Figure
                photo={PHOTOS.problemTall2}
                sizes="(min-width: 1024px) 28vw, 80vw"
              />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
