import Image from "next/image";
import { CLAIMS } from "@/lib/claims";

// ponytail: rutas directas; si aparece lib/photos.ts, cambiar acá. problem-a4 es un
// collage de tres tomas y no sirve recortado, por eso la tira lleva solo a2 y a3.
const STRIP = [
  {
    src: "/problem-a2.jpg",
    alt: "Frente de fuego en la ladera de un cerro frente a un lago, con el cielo rojo de humo",
    caption: "Frente de fuego sobre un lago patagónico. Foto de archivo.",
    position: "50% 70%",
  },
  {
    src: "/problem-a3.jpg",
    alt: "Ladera ardiendo de noche sobre un lago, con árboles en primer plano",
    caption: "Ladera en llamas sobre un lago patagónico. Foto de archivo.",
    position: "50% 60%",
  },
];

export function Problem() {
  return (
    <section id="problema" className="a-root relative scroll-mt-20">
      <div className="relative flex min-h-[85svh] items-end overflow-hidden">
        <Image
          src="/problem-a1.jpg"
          alt="Incendio forestal de noche en la Patagonia andina, visto desde el aire"
          fill
          sizes="100vw"
          loading="lazy"
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-a-bg via-a-bg/55 to-a-bg/10"
        />
        <div className="relative mx-auto w-full max-w-[1100px] px-5 pb-14 pt-40 md:px-8 md:pb-20">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-a-mute">
            El problema
          </p>
          <h2 className="a-display-m mt-4 max-w-3xl text-white">
            Un foco se corta con una cuadrilla o se convierte en un frente
          </h2>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1100px] px-5 py-20 md:px-8 md:py-28">
        <div className="a-sub grid grid-cols-1 gap-x-12 gap-y-5 md:grid-cols-2">
          <p>
            Casi todos los incendios grandes empiezan chicos: una brasa, una
            colilla, una chispa de una máquina. Durante los primeros minutos
            alcanza con una cuadrilla y una motobomba. Después, con viento y
            pasto seco, hace falta un operativo entero.
          </p>
          <p>
            En la cordillera y en la estepa casi nunca hay testigos. Hay
            kilómetros sin casas, sin torres y a veces sin señal. El foco se
            nota cuando la columna de humo es lo bastante alta como para que
            alguien la vea de lejos y llame, y para entonces ya pasó un buen
            rato.
          </p>
          <p>
            Cuando la brigada llega temprano, trabaja sobre un perímetro chico,
            con menos riesgo para la gente y sin depender de que el viento
            aguante. Cuando llega tarde, se pelea contra un frente en lugar de
            contra una chispa.
          </p>
          <p>
            Nosotros atacamos solamente una parte del problema: el tiempo entre
            que el fuego empieza y alguien con capacidad de actuar se entera.
            Leemos el calor desde satélites ({CLAIMS.satellites}) y avisamos a
            municipios y brigadas. Nuestro objetivo es hacerlo en{" "}
            {CLAIMS.detectionMinutes} minutos; es una meta de diseño, todavía no
            un resultado medido en campo.
          </p>
        </div>

        <ul className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          {STRIP.map((p) => (
            <li key={p.src} className="min-w-0">
              <div className="a-brackets">
                <span className="a-bk a-bk-tr" aria-hidden />
                <span className="a-bk a-bk-bl" aria-hidden />
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={p.src}
                    alt={p.alt}
                    fill
                    sizes="(min-width: 768px) 540px, 100vw"
                    loading="lazy"
                    className="object-cover"
                    style={{ objectPosition: p.position }}
                  />
                </div>
              </div>
              <p className="mt-3 text-xs text-a-faint">{p.caption}</p>
            </li>
          ))}
        </ul>

        <figure className="mx-auto mt-20 max-w-2xl text-center">
          <blockquote className="a-display-m !text-[clamp(1.75rem,3.4vw,2.75rem)] text-white">
            «No queremos reemplazar a nadie en el terreno. Queremos que se
            enteren antes.»
          </blockquote>
          <figcaption className="mt-5 text-sm text-a-mute">
            El equipo de Sentinel
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
