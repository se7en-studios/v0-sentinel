import Image from "next/image";
import { ArrowRight, BellRing, ScanSearch, Satellite } from "lucide-react";
import { PHOTOS, creditLine } from "@/lib/photos";

const POINTS = [
  { icon: Satellite, label: "Lectura satelital" },
  { icon: ScanSearch, label: "Verificación" },
  { icon: BellRing, label: "Aviso a quien actúa" },
];

export function Hero() {
  const fire = PHOTOS.heroFire;
  return (
    <>
      <section
        id="inicio"
        className="a-root relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden"
      >
        <Image
          src={fire.src}
          alt={fire.alt}
          fill
          priority
          sizes="100vw"
          className="a-kenburns -z-20 object-cover"
          style={{ objectPosition: fire.position }}
        />
        <p className="absolute right-5 top-[5.25rem] z-0 text-xs text-white/60 md:right-8">
          {creditLine(fire)}
        </p>
        {/* Scrim mínimo: solo abajo/izquierda, donde va el texto. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-a-bg/90 via-a-bg/35 to-transparent to-60%"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-r from-a-bg/55 to-transparent to-55%"
        />

        <div className="mx-auto w-full max-w-6xl px-5 pb-8 pt-28 md:px-8 md:pb-12">
          <p className="a-eyebrow a-load !text-left !text-xs !text-a-mute">
            Detección temprana de incendios forestales
          </p>
          <h1 className="a-display a-load mt-4 max-w-4xl" style={{ "--d": "120ms" } as React.CSSProperties}>
            El aviso llega antes que el humo.
          </h1>

          <div className="mt-6 flex flex-col gap-6 md:mt-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-md">
              <p className="a-sub a-load" style={{ "--d": "320ms" } as React.CSSProperties}>
                Seguimos los focos de calor desde el espacio y avisamos a municipios, brigadas y propietarios de la Patagonia andina.
              </p>
              <a href="#contacto" className="a-pill a-load mt-5 !pr-1.5" style={{ "--d": "480ms" } as React.CSSProperties}>
                Pedir un piloto
                <span className="grid size-8 place-items-center rounded-full bg-[#06150d] text-a-accent">
                  <ArrowRight className="size-4" aria-hidden />
                </span>
              </a>
            </div>

            <ul className="flex flex-col gap-3 text-sm text-[#e3f6dc]">
              {POINTS.map(({ icon: Icon, label }, i) => (
                <li
                  key={label}
                  className="a-load flex items-center gap-2.5 border-t border-a-line pt-3 md:min-w-56"
                  style={{ "--d": `${620 + i * 90}ms` } as React.CSSProperties}
                >
                  <Icon className="size-4 text-a-accent" aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section aria-label="El panel de Sentinel" className="a-root bg-a-bg px-5 pb-16 pt-12 md:px-8 md:pb-24 md:pt-20">
        <figure className="mx-auto max-w-5xl">
          <div className="a-brackets a-emerge">
            <span className="a-bk a-bk-tr" />
            <span className="a-bk a-bk-bl" />
            <div className="a-frame">
              <Image
                src="/product/panel-3d-hero.webp"
                alt="Panel de Sentinel: mapa 3D de la cordillera con focos térmicos, capas y línea de tiempo"
                width={1400}
                height={875}
                sizes="(min-width: 1024px) 1024px, 100vw"
                className="h-auto w-full"
              />
            </div>
          </div>
          <figcaption className="mt-3 text-center text-xs text-a-faint">
            Captura del panel de Sentinel
          </figcaption>
        </figure>
      </section>
    </>
  );
}
