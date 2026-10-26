import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CLAIMS } from "@/lib/claims";

export const metadata: Metadata = {
  title: "Metodología: cómo detectamos y qué medimos",
  description:
    "Fuentes satelitales, límites, falsos positivos y estado de cada cifra de Sentinel (objetivo o medido), con sus fuentes y licencias de datos.",
  alternates: { canonical: "/metodologia" },
};

const FIGURES = [
  {
    figure: `${CLAIMS.detectionMinutes} minutos de detección`,
    status: "Objetivo",
    source: "Diseño del sistema; sin pilotos cuantificados todavía.",
  },
  {
    figure: `${CLAIMS.accuracyPct}% de precisión`,
    status: "Objetivo",
    source: "Meta interna de clasificación; no medida en campo.",
  },
  {
    figure: `Monitoreo ${CLAIMS.monitoringHours} h`,
    status: "Objetivo",
    source: "Depende de la disponibilidad de cada satélite y de la nubosidad.",
  },
  {
    figure: "Focos activos del mapa en vivo",
    status: "Medido por NASA, no por Sentinel",
    source:
      "NASA FIRMS (VIIRS NOAA-20 y NOAA-21). Preliminares, sin verificar en campo.",
  },
  {
    figure: "Temperatura, humedad y viento del índice de riesgo",
    status: "Modelo meteorológico",
    source: "Open-Meteo. Pronóstico, no medición en sitio.",
  },
];

const SOURCES = [
  {
    name: "VIIRS (NOAA-20, NOAA-21)",
    detail:
      "Píxel de unos 375 m. Cada satélite pasa unas dos veces por día sobre un mismo punto (una de día y una de noche), así que un foco corto puede quedar entre pasadas.",
  },
  {
    name: "MODIS (Terra, Aqua)",
    detail:
      "Píxel de 1 km. Menos sensible a focos chicos, pero con un historial largo.",
  },
  {
    name: "GOES-19",
    detail:
      "Satélite geoestacionario: repite la imagen del disco completo cada 10 minutos, pero con píxel de unos 2 km en el ecuador terrestre y más grueso en la Patagonia, por el ángulo de visión. Sirve para detectar rápido focos grandes, no chicos.",
  },
];

const H2 = "t-h2 mb-5 mt-20 !text-3xl md:!text-4xl";
const P = "t-body text-ink/85";
const LIST = "t-body list-disc space-y-2 pl-6 text-ink/85 marker:text-brand";
const LINK = "font-semibold text-brand underline underline-offset-4";
const ROW = "border-t rule py-4 align-top";

export default function MetodologiaPage() {
  return (
    <>
      <header>
        <Navbar />
      </header>
      <main id="main-content" className="bg-paper text-ink">
        <div className="mx-auto max-w-3xl px-6 pb-28 pt-32 md:pt-40">
          <h1 className="t-display !text-4xl md:!text-6xl">
            Cómo detectamos, qué verificamos y qué todavía no podemos afirmar
          </h1>
          <p className="t-lead mt-6 text-ink/85">
            Sentinel Cloud cruza datos satelitales ({CLAIMS.satellites}) con
            información geoespacial e inteligencia artificial para avisar de un
            posible foco en {CLAIMS.region}. Esta página separa lo que es un
            objetivo de diseño de lo que está medido, y dice de dónde sale cada
            dato.
          </p>

          <h2 className={`${H2} !mt-16`}>
            Qué cifras son objetivos y cuáles están medidas
          </h2>
          <p className={`${P} mb-6`}>
            Hoy no hay pilotos con resultados cuantificados. Las cifras de
            tiempo y precisión que ves en la web son objetivos de diseño.
          </p>
          <div className="-mx-6 overflow-x-auto px-6 pb-4">
            <table className="w-full min-w-[40rem] border-collapse text-left text-[15px]">
              <caption className="sr-only">
                Estado de cada cifra de Sentinel
              </caption>
              <thead>
                <tr className="t-label text-ink/70">
                  <th scope="col" className="pb-2 pr-4 font-medium">
                    Cifra
                  </th>
                  <th scope="col" className="pb-2 pr-4 font-medium">
                    Estado
                  </th>
                  <th scope="col" className="pb-2 font-medium">
                    Fuente
                  </th>
                </tr>
              </thead>
              <tbody>
                {FIGURES.map((f) => (
                  <tr key={f.figure}>
                    <th scope="row" className={`${ROW} pr-4 font-semibold`}>
                      {f.figure}
                    </th>
                    <td className={`${ROW} pr-4 font-semibold text-brand`}>
                      {f.status}
                    </td>
                    <td className={`${ROW} t-small text-ink/80`}>{f.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className={H2}>Cómo funciona la detección</h2>
          <p className={`${P} mb-6`}>
            Los satélites detectan anomalías térmicas, no incendios: un píxel
            más caliente que su entorno. Cada fuente tiene una resolución y una
            frecuencia distintas, valores aproximados publicados por sus
            operadores:
          </p>
          <ul className="border-b rule">
            {SOURCES.map((s) => (
              <li key={s.name} className="t-body border-t rule py-4 text-ink/85">
                <strong className="block font-serif text-xl font-medium text-ink">
                  {s.name}
                </strong>
                {s.detail}
              </li>
            ))}
          </ul>

          <h2 className={H2}>Qué verificamos y cómo</h2>
          <p className={P}>
            Una anomalía térmica es una alerta preliminar. Antes de notificarla
            la contrastamos con cobertura de suelo, histórico de focos de la
            zona, fuentes industriales conocidas y, cuando existe, una segunda
            pasada o un segundo satélite. Si no se confirma, se comunica como
            &quot;no verificado&quot;. La definición exacta de estos criterios
            se acuerda con cada organización usuaria.
          </p>

          <h2 className={H2}>Falsos positivos y límites</h2>
          <ul className={LIST}>
            <li>
              Quemas controladas, chimeneas industriales, pozos de petróleo y
              superficies muy reflectantes pueden dar falsos positivos.
            </li>
            <li>
              Las nubes densas y el humo espeso bloquean la observación en
              infrarrojo.
            </li>
            <li>
              Un foco menor al píxel o que arde entre pasadas puede no verse.
            </li>
            <li>
              Ningún sistema satelital elimina por completo los falsos positivos
              ni los falsos negativos.
            </li>
            <li>
              Los drones y sensores en tierra se suman de forma progresiva: hoy
              no son una flota operativa.
            </li>
          </ul>

          <h2 className={H2}>De dónde salen los datos en vivo</h2>
          <ul className="border-b rule">
            <li className="t-body border-t rule py-4 text-ink/85">
              <strong className="block font-serif text-xl font-medium text-ink">
                NASA FIRMS
              </strong>
              Focos activos de VIIRS en modo casi tiempo real. Los datos son
              abiertos, con pedido de reconocimiento a NASA FIRMS. Pueden llegar
              con hasta unas 3 horas de demora respecto de la observación. En la
              web los actualizamos cada hora como máximo, y se muestran con su
              fecha y hora.{" "}
              <a
                className={LINK}
                href="https://firms.modaps.eosdis.nasa.gov/"
                target="_blank"
                rel="noopener noreferrer"
              >
                firms.modaps.eosdis.nasa.gov
              </a>
            </li>
            <li className="t-body border-t rule py-4 text-ink/85">
              <strong className="block font-serif text-xl font-medium text-ink">
                Open-Meteo
              </strong>
              Datos meteorológicos bajo licencia CC BY 4.0, con atribución. Se
              consultan cada 15 minutos como máximo y son estimaciones de modelo
              para el punto elegido, no mediciones de una estación.{" "}
              <a
                className={LINK}
                href="https://open-meteo.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                open-meteo.com
              </a>
            </li>
          </ul>
          <p className={`${P} mt-5`}>
            Los datos que genera la implementación de un cliente no son públicos
            y no se muestran en esta web.
          </p>

          <h2 className={H2}>Qué no prometemos</h2>
          <ul className={LIST}>
            <li>
              Que cada incendio vaya a ser detectado, ni en{" "}
              {CLAIMS.detectionMinutes} minutos ni en ningún plazo garantizado.
            </li>
            <li>Ausencia total de falsos positivos.</li>
            <li>
              Reemplazar a bomberos, brigadas ni a los sistemas oficiales de
              alerta.
            </li>
            <li>
              Convenios o respaldo de las entidades mencionadas en la web: son
              programas y competencias en las que participamos.
            </li>
          </ul>

          <p className="mt-16">
            <Link className={LINK} href="/">
              Volver al inicio
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
