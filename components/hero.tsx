import Image from "next/image";
import { CLAIMS } from "@/lib/claims";
import { PHOTOS } from "@/lib/photos";

const photo = PHOTOS.heroFire;

export function Hero() {
  return (
    <section id="inicio" className="bg-paper text-ink">
      <div className="mx-auto w-full max-w-7xl px-5 pb-10 pt-28 md:px-8 md:pb-14 md:pt-40">
        <div className="grid gap-x-8 gap-y-8 lg:grid-cols-12">
          <h1 className="t-display text-balance lg:col-span-7">El aviso llega antes que el humo.</h1>
          <div className="lg:col-span-4 lg:col-start-9 lg:self-end">
            <p className="t-lead max-w-md">
              Cruzamos imágenes de satélite, datos de terreno y un modelo de detección para avisar a municipios, brigadas y
              productores de la Patagonia cuando aparece un foco de calor.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
              <a
                href="#contacto"
                className="inline-flex min-h-12 items-center justify-center rounded-sm bg-brand px-7 text-base font-semibold text-paper transition-colors hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Pedir un piloto
              </a>
              <a
                href="/demo"
                className="text-base font-medium text-brand underline underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              >
                Ver el panel
              </a>
            </div>
          </div>
        </div>

        <p className="t-body mt-10 border-t rule pt-5 text-ink/80 md:mt-14">
          Objetivos de diseño, todavía sin medir en campo:{" "}
          <strong className="font-semibold text-ink">{CLAIMS.detectionMinutes} minutos</strong> para detectar un foco,{" "}
          <strong className="font-semibold text-ink">{CLAIMS.accuracyPct} % de precisión</strong> y monitoreo{" "}
          <strong className="font-semibold text-ink">{CLAIMS.monitoringHours} horas</strong> por día.
        </p>
      </div>

      <figure>
        <div className="relative h-[60svh] min-h-[22rem] w-full overflow-hidden bg-ink md:h-[78svh]">
          <Image
            src={photo.src}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            priority
            sizes="100vw"
            className="absolute inset-0 h-full w-full object-cover object-[50%_62%]"
          />
        </div>
        <figcaption className="t-caption mx-auto w-full max-w-7xl px-5 py-3 md:px-8">{photo.caption}</figcaption>
      </figure>
    </section>
  );
}
