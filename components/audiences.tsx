import Image from "next/image";
import { ArrowRight, Landmark, Siren, Sprout } from "lucide-react";
import { Chapter, Eyebrow } from "@/components/ui/chapter";
import { Reveal } from "@/components/ui/reveal";
import { Spotlight } from "@/components/ui/spotlight";
import { Magnetic } from "@/components/ui/magnetic";
import { AlertPhone } from "@/components/alert-phone";

// Acento sutil por público, todo dentro de la paleta; `ink` cumple AA sobre crema.
const AUDIENCES = [
  {
    perfil: "municipio",
    who: "Municipios y Defensa Civil",
    icon: Landmark,
    photo: "/problem-a2.jpg",
    focus: "50% 62%",
    ink: "#0b6b44",
    tint: "#0f7a4f",
    problem:
      "Se enteran del fuego por un llamado, cuando ya avanzó. Coordinar recursos con poca información cuesta tiempo.",
    gets: "Consola con focos verificados, ubicación y contexto de propagación, más alertas para activar protocolos.",
  },
  {
    perfil: "brigada",
    who: "Brigadas y bomberos",
    icon: Siren,
    photo: "/problem-a3.jpg",
    focus: "50% 55%",
    ink: "#9a4a06",
    tint: "#c2680f",
    problem:
      "Llegar sin saber dónde está el frente, hacia dónde va el viento ni cómo acceder al lugar.",
    gets: "Alerta geolocalizada por WhatsApp con coordenadas, viento y terreno, directo al celular del equipo.",
  },
  {
    perfil: "campo",
    who: "Campos, forestales y aseguradoras",
    icon: Sprout,
    photo: "/problem-a4.jpg",
    focus: "50% 6%",
    ink: "#0d6b66",
    tint: "#14877f",
    problem:
      "Un foco cercano que nadie ve a tiempo puede costar cosechas, plantaciones y pólizas.",
    gets: "Aviso temprano sobre tus lotes y un registro de eventos para decidir y documentar.",
  },
];

export function Audiences() {
  return (
    <Chapter id="para-quien" className="overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-[-10%] size-[36rem] rounded-full bg-leaf/10 blur-[110px]"
      />
      <div className="relative">
        <Eyebrow>Para quién</Eyebrow>
        <Reveal>
          <h2 className="t-h2 max-w-3xl">
            Tres públicos, un mismo problema:{" "}
            <span className="font-display font-normal text-leaf">llegar antes</span>
          </h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-10 md:mt-16 lg:grid-cols-12 lg:gap-12">
          <div className="flex min-w-0 flex-col gap-6 lg:col-span-7">
            {AUDIENCES.map((a, i) => {
              const Icon = a.icon;
              return (
                <Reveal key={a.perfil} delay={i * 100}>
                  <Spotlight
                    as="article"
                    className="glass-light group flex flex-col overflow-hidden rounded-[20px] transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-[0_34px_70px_-26px_rgb(26_24_18/0.55)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:flex-row"
                  >
                    <div className="relative h-44 shrink-0 overflow-hidden sm:h-auto sm:w-2/5">
                      <Image
                        src={a.photo}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 22vw, (min-width: 640px) 40vw, 100vw"
                        style={{ objectPosition: a.focus }}
                        className="object-cover saturate-[.7] transition duration-700 group-hover:scale-110 group-hover:saturate-100 motion-reduce:transition-none"
                      />
                      <div
                        aria-hidden
                        className="absolute inset-0 mix-blend-soft-light opacity-70"
                        style={{ background: a.tint }}
                      />
                      <div
                        aria-hidden
                        className="absolute inset-0 bg-linear-to-t from-charcoal/70 via-charcoal/10 to-transparent"
                      />
                      <span
                        className="absolute bottom-4 left-4 grid size-11 place-items-center rounded-xl bg-[#faf7f0] shadow-lg transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 motion-reduce:transition-none"
                        style={{ color: a.ink }}
                      >
                        <Icon className="size-5" aria-hidden />
                      </span>
                    </div>
                    <div
                      className="flex min-w-0 flex-1 flex-col p-6 md:p-7"
                      style={{ borderTop: `3px solid ${a.tint}` }}
                    >
                      <h3 className="t-h3">{a.who}</h3>
                      <p className="t-label mt-4" style={{ color: a.ink }}>
                        El problema
                      </p>
                      <p className="t-body mt-1.5">{a.problem}</p>
                      <p className="t-label mt-4" style={{ color: a.ink }}>
                        Qué recibís
                      </p>
                      <p className="t-body mt-1.5">{a.gets}</p>
                      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-6">
                        <Magnetic>
                          <a
                            href={`/?perfil=${a.perfil}#contacto`}
                            className="group/cta inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgb(9_89_58/0.7)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          >
                            Solicitar un piloto{" "}
                            <ArrowRight
                              className="size-4 transition-transform group-hover/cta:translate-x-1 motion-reduce:transition-none"
                              aria-hidden
                            />
                          </a>
                        </Magnetic>
                        <span className="t-small opacity-70">Piloto abierto</span>
                      </div>
                    </div>
                  </Spotlight>
                </Reveal>
              );
            })}
          </div>
          <Reveal delay={150} className="min-w-0 lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <AlertPhone />
            </div>
          </Reveal>
        </div>
      </div>
    </Chapter>
  );
}
