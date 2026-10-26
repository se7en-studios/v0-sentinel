import Image from "next/image";
import { PHOTOS, type Photo } from "@/lib/photos";
import { AlertPhone } from "@/components/alert-phone";

type Audience = {
  perfil: "municipio" | "brigada" | "campo";
  who: string;
  photo: Photo;
  problem: string;
  gets: string;
};

const AUDIENCES: Audience[] = [
  {
    perfil: "municipio",
    who: "Municipios y Defensa Civil",
    photo: PHOTOS.problemTall1,
    problem:
      "Se enteran del fuego por un llamado de un vecino, cuando ya avanzó, y con ese dato tienen que decidir a quién mandar y a dónde.",
    gets: "Una consola con los focos verificados, su ubicación y hacia dónde pueden propagarse, y un aviso para activar el protocolo.",
  },
  {
    perfil: "brigada",
    who: "Brigadas y bomberos",
    photo: PHOTOS.problemTall2,
    problem:
      "Salen sin saber bien dónde está el frente, para dónde sopla el viento ni por qué camino se llega.",
    gets: "Un mensaje de WhatsApp en el celular con coordenadas, viento y acceso, para salir con algo más que una dirección aproximada.",
  },
  {
    perfil: "campo",
    who: "Campos, forestales y aseguradoras",
    photo: PHOTOS.landscape,
    problem:
      "Un foco a pocos kilómetros que nadie ve a tiempo puede costar una plantación, una cosecha o una póliza.",
    gets: "Un aviso temprano sobre sus lotes y un registro de cada evento para decidir y para documentar.",
  },
];

export function Audiences() {
  return (
    <section
      id="para-quien"
      className="relative scroll-mt-20 bg-paper py-20 text-ink md:py-32"
    >
      <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
        <h2 className="t-h2 max-w-3xl">
          Para quién lo estamos armando: tres lugares donde el aviso llega
          tarde
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-12 md:mt-16 lg:grid-cols-3 lg:gap-0">
          {AUDIENCES.map((a, i) => (
            <article
              key={a.perfil}
              className={`flex min-w-0 flex-col ${
                i > 0 ? "lg:border-l rule" : ""
              } ${i < AUDIENCES.length - 1 ? "lg:pr-8" : ""} ${i > 0 ? "lg:pl-8" : ""}`}
            >
              <figure>
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={a.photo.src}
                    alt={a.photo.alt}
                    fill
                    sizes="(min-width: 1024px) 360px, 100vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="t-caption mt-2">
                  {a.photo.caption}
                </figcaption>
              </figure>
              <h3 className="t-h3 mt-6 border-t rule pt-5">{a.who}</h3>
              <p className="t-body mt-3">
                <span className="font-semibold">El problema. </span>
                {a.problem}
              </p>
              <p className="t-body mt-3">
                <span className="font-semibold">Qué recibe. </span>
                {a.gets}
              </p>
              <a
                href={`/?perfil=${a.perfil}#contacto`}
                className="mt-auto inline-flex min-h-11 items-center pt-5 font-semibold text-brand underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Pedir un piloto
              </a>
            </article>
          ))}
        </div>

        <p className="t-caption mt-10 border-t rule pt-3">
          Piloto abierto: todavía no hay casos publicados.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-10 border-t rule pt-12 md:mt-20 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <h3 className="t-h2 !text-3xl md:!text-4xl">
              Así se ve la alerta en cada mano
            </h3>
            <p className="t-body mt-4 max-w-md">
              El mismo foco se cuenta distinto según quién lo recibe. Elegí un
              público para ver qué dice el mensaje: el municipio recibe contexto
              para decidir, la brigada un punto al que salir y el campo el
              tiempo que tiene para avisar a su gente.
            </p>
          </div>
          <div className="min-w-0 lg:col-span-6 lg:col-start-7">
            <AlertPhone />
          </div>
        </div>
      </div>
    </section>
  );
}
