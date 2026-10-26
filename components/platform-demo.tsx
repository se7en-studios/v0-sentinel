import Image from "next/image";
import { CLAIMS } from "@/lib/claims";

const SRC_W = 2000;
const SRC_H = 1250;

type Step = {
  n: string;
  title: string;
  body: string;
  src: string;
  // Recorte fijo sobre la captura, en píxeles de la imagen original (2000×1250).
  crop: { x: number; y: number; w: number; h: number };
  alt: string;
  caption: string;
};

const STEPS: Step[] = [
  {
    n: "1",
    title: "Detectar",
    body: `Leemos las anomalías térmicas de VIIRS y MODIS, que publica la NASA a través de FIRMS, y la alerta temprana de GOES-19, un satélite geoestacionario que mira la zona de forma continua pero con menos detalle. Cada fuente tiene su propia demora, y el panel la muestra en vez de esconderla.`,
    src: "/product/panel-2d.webp",
    crop: { x: 1500, y: 500, w: 500, h: 430 },
    alt: "Panel de capas de Sentinel con las fuentes de detección: anomalías térmicas de la NASA, alerta temprana GOES, mapa de calor y propagación prevista.",
    caption:
      "Las capas de detección del panel. Drones y sensores figuran como simulación (SIM): hoy no hay flota operando.",
  },
  {
    n: "2",
    title: "Verificar",
    body: "Un punto caliente no es un incendio. Cruzamos las fuentes entre sí, miramos cuántas pasadas lo confirman y separamos el calor industrial, que en la zona suma decenas de puntos fijos. Lo que queda es un foco con nivel de confianza.",
    src: "/product/panel-2d.webp",
    crop: { x: 0, y: 1040, w: 780, h: 210 },
    alt: "Línea de tiempo del panel con focos acumulados y detección por hora durante diez días.",
    caption:
      "Línea de tiempo y detecciones por hora de los últimos diez días: así se distingue un pico real del ruido de fondo.",
  },
  {
    n: "3",
    title: "Contextualizar",
    body: "Con el foco confirmado sumamos lo que decide cómo actuar: el relieve, la localidad más cercana, el viento y hacia dónde puede avanzar. En 3D se ve si hay un valle por el que el fuego corre o una cresta que lo frena.",
    src: "/product/panel-3d.webp",
    crop: { x: 300, y: 330, w: 900, h: 560 },
    alt: "Vista en 3D del terreno cordillerano alrededor de El Foyel y Río Villegas, con relieve sombreado y nombres de parajes.",
    caption:
      "Vista 3D del panel sobre la zona de El Foyel y Río Villegas. La propagación prevista es una capa de demostración.",
  },
  {
    n: "4",
    title: "Alertar",
    body: `Cuando un foco pasa la verificación, el aviso sale por WhatsApp con coordenadas, viento y cómo llegar, y queda registrado en el panel. Nuestro objetivo es hacerlo en ${CLAIMS.detectionMinutes} minutos desde la detección; todavía no lo medimos en un incendio real.`,
    src: "/product/panel-2d.webp",
    crop: { x: 0, y: 55, w: 1100, h: 100 },
    alt: "Franja superior del panel con el estado de las fuentes: última detección, demora del satélite, alerta temprana, focos en 24 horas y alertas.",
    caption:
      "La franja de estado del panel: última detección, demora de cada satélite y alertas activas.",
  },
];

function Crop({ step }: { step: Step }) {
  const { x, y, w, h } = step.crop;
  return (
    <figure>
      <div
        className="relative w-full overflow-hidden border rule bg-ink/5"
        style={{ aspectRatio: `${w} / ${h}` }}
      >
        <Image
          src={step.src}
          alt={step.alt}
          width={SRC_W}
          height={SRC_H}
          unoptimized
          style={{
            position: "absolute",
            maxWidth: "none",
            height: "auto",
            width: `${(SRC_W / w) * 100}%`,
            left: `${(-x / w) * 100}%`,
            top: `${(-y / h) * 100}%`,
          }}
        />
      </div>
      <figcaption className="t-caption mt-2">{step.caption}</figcaption>
    </figure>
  );
}

export function PlatformDemo() {
  return (
    <div className="mt-14 md:mt-20">
      <figure>
        <div className="border rule">
          <Image
            src="/product/panel-2d.webp"
            alt="Panel de Sentinel en vista 2D sobre la Patagonia Andina: mapa satelital con relieve, capas a la derecha y línea de tiempo con gráficos abajo."
            width={SRC_W}
            height={SRC_H}
            sizes="(min-width: 1152px) 1088px, 100vw"
            quality={90}
            priority={false}
            className="h-auto w-full"
          />
        </div>
        <figcaption className="t-caption mt-2 max-w-3xl">
          El panel completo en vista 2D: mapa a la izquierda, capas y resumen a
          la derecha, línea de tiempo y gráficos abajo. Es una captura real,
          con las fuentes {CLAIMS.satellites}.
        </figcaption>
      </figure>

      <ol className="mt-16 md:mt-24">
        {STEPS.map((s, i) => (
          <li
            key={s.n}
            className="grid grid-cols-1 gap-6 border-t rule py-10 lg:grid-cols-12 lg:gap-12 lg:py-14"
          >
            <div
              className={`lg:col-span-5 ${i % 2 === 1 ? "lg:order-2" : ""}`}
            >
              <div className="flex items-baseline gap-5">
                <span
                  aria-hidden
                  className="font-serif text-7xl leading-none text-brand md:text-8xl"
                >
                  {s.n}
                </span>
                <h3 className="t-h2 !text-3xl md:!text-4xl">{s.title}</h3>
              </div>
              <p className="t-body mt-5 max-w-md">{s.body}</p>
            </div>
            <div
              className={`min-w-0 lg:col-span-7 ${i % 2 === 1 ? "lg:order-1" : ""}`}
            >
              <Crop step={s} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
