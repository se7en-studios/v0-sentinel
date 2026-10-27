import Image from "next/image";
import {
  ArrowRight,
  Landmark,
  Flame,
  Tractor,
  TreePine,
  ShieldCheck,
  Leaf,
  type LucideIcon,
} from "lucide-react";
import { AlertPhone } from "@/components/alert-phone";

const AUDIENCES: {
  href: string;
  icon: LucideIcon;
  who: string;
  problem: string;
  gets: string;
  photo?: { src: string; position: string };
}[] = [
  {
    href: "/?perfil=municipio#contacto",
    icon: Landmark,
    who: "Municipios y Defensa Civil",
    problem: "Se enteran por un llamado, cuando el fuego ya avanzó.",
    gets: "Una consola con focos verificados y contexto de propagación para activar el protocolo a tiempo.",
  },
  {
    href: "/?perfil=brigada#contacto",
    icon: Flame,
    who: "Brigadas y bomberos",
    problem: "Salir sin saber dónde está el frente ni hacia dónde sopla.",
    gets: "Una alerta por WhatsApp con coordenadas, viento y acceso, directo al celular del equipo.",
    photo: { src: "/problem-a3.jpg", position: "50% 62%" },
  },
  {
    href: "/?perfil=campo#contacto",
    icon: Tractor,
    who: "Campos y productores",
    problem: "Un foco cercano que nadie ve a tiempo pone en juego el año.",
    gets: "Un aviso temprano sobre tus lotes y un registro del evento para decidir y documentar.",
    photo: { src: "/problem-a2.jpg", position: "50% 75%" },
  },
  {
    href: "#contacto",
    icon: TreePine,
    who: "Forestales",
    problem: "Las plantaciones están lejos y se miran poco entre recorridas.",
    gets: "Lectura satelital continua de tu zona y aviso cuando aparece calor cerca.",
  },
  {
    href: "#contacto",
    icon: ShieldCheck,
    who: "Aseguradoras",
    problem: "Valuar y documentar un siniestro sin datos de cuándo empezó.",
    gets: "Un historial de focos con fecha, fuente y ubicación para respaldar el análisis.",
  },
  {
    href: "#contacto",
    icon: Leaf,
    who: "ONG y áreas protegidas",
    problem: "Cuidar mucho territorio con pocos guardaparques.",
    gets: "Alertas sobre el área que cuidás y mapas para coordinar con brigadas.",
  },
];

const LINK =
  "mt-6 inline-flex items-center gap-1.5 self-start text-sm font-medium text-a-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a9efc9]";

export function Audiences() {
  return (
    <>
      <section
        id="para-quien"
        className="a-forest px-5 py-24 font-[family-name:var(--font-geist)] md:px-8 md:py-36"
      >
        <div className="mx-auto max-w-[1100px]">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-a-mute">
            Para quién
          </p>
          <h2 className="a-display-m mt-4 max-w-3xl text-white">
            Pensado para quienes llegan primero al fuego
          </h2>
        </div>

        <ul
          className="-mx-5 mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 md:mx-auto md:max-w-[1100px] md:px-0"
          aria-label="Públicos de Sentinel"
        >
          {AUDIENCES.map(({ href, icon: Icon, who, problem, gets, photo }) => (
            <li
              key={who}
              className="relative flex min-h-[28rem] w-[78%] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-2xl border border-a-line bg-a-card p-6 md:w-[300px]"
            >
              {photo ? (
                <>
                  <Image
                    src={photo.src}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 300px, 78vw"
                    loading="lazy"
                    className="object-cover"
                    style={{ objectPosition: photo.position }}
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-a-bg via-a-bg/85 to-a-bg/10"
                  />
                </>
              ) : (
                <Icon
                  className="absolute left-6 top-6 size-20 text-a-accent"
                  strokeWidth={1}
                  aria-hidden
                />
              )}
              <div className="relative flex flex-col">
                <h3 className="text-xl font-semibold tracking-tight text-white">
                  {who}
                </h3>
                <p className="mt-2 text-[0.9375rem] text-a-mute">{problem}</p>
                <p className="mt-3 text-[0.9375rem] text-[#e3f6dc]">{gets}</p>
                <a href={href} className={LINK}>
                  Pedir un piloto <ArrowRight className="size-4" aria-hidden />
                </a>
              </div>
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-4 max-w-[1100px] text-xs text-a-mute">
          Piloto abierto: todavía no hay casos publicados.
        </p>
      </section>

      <section className="a-bone px-5 py-24 font-[family-name:var(--font-geist)] md:px-8 md:py-32">
        <div className="mx-auto max-w-[1100px]">
          <h3 className="a-display-m text-center text-[#131a16]">
            Así te llega la alerta
          </h3>
          <p className="a-sub mx-auto mt-4 mb-10 max-w-xl text-center">
            El mismo foco, contado para quien tiene que actuar.
          </p>
          <AlertPhone tone="light" />
        </div>
      </section>
    </>
  );
}
