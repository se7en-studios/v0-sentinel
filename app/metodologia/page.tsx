import type { Metadata } from "next";
import Link from "next/link";
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

const H2 = "mt-14 mb-3 text-2xl font-semibold";

export default function MetodologiaPage() {
  return (
    <main
      id="main-content"
      className="mx-auto max-w-3xl px-6 py-28 text-[17px] leading-relaxed"
      style={{
        color: "#1a1812",
        background: "#faf7f0",
        fontFamily: "var(--font-sans)",
      }}
    >
      <p className="t-label mb-4 text-[#0b6b44]">Metodología</p>
      <h1 className="t-h2 mb-6">
        Cómo detectamos, qué verificamos y qué todavía no podemos afirmar.
      </h1>
      <p>
        Sentinel Cloud cruza datos satelitales ({CLAIMS.satellites}) con
        información geoespacial e inteligencia artificial para avisar de un
        posible foco en {CLAIMS.region}. Esta página separa lo que está diseñado
        como objetivo de lo que está medido, y de dónde sale cada dato.
      </p>

      <h2 className={H2}>Qué cifras son objetivos y cuáles están medidas</h2>
      <p className="mb-5">
        Hoy no hay pilotos con resultados cuantificados. Las cifras de tiempo y
        precisión que ves en la web son objetivos de diseño.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-left text-[15px]">
          <caption className="sr-only">
            Estado de cada cifra de Sentinel
          </caption>
          <thead>
            <tr className="border-b border-[#1a1812]/30">
              <th scope="col" className="py-2 pr-4 font-semibold">
                Cifra
              </th>
              <th scope="col" className="py-2 pr-4 font-semibold">
                Estado
              </th>
              <th scope="col" className="py-2 font-semibold">
                Fuente
              </th>
            </tr>
          </thead>
          <tbody>
            {FIGURES.map((f) => (
              <tr
                key={f.figure}
                className="border-b border-[#1a1812]/15 align-top"
              >
                <th scope="row" className="py-3 pr-4 font-medium">
                  {f.figure}
                </th>
                <td className="py-3 pr-4">{f.status}</td>
                <td className="py-3">{f.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className={H2}>Cómo funciona la detección</h2>
      <p className="mb-5">
        Los satélites detectan anomalías térmicas, no incendios: un píxel más
        caliente que su entorno. Cada fuente tiene una resolución y una
        frecuencia distintas, valores aproximados publicados por sus operadores:
      </p>
      <ul className="space-y-4">
        {SOURCES.map((s) => (
          <li key={s.name}>
            <strong>{s.name}.</strong> {s.detail}
          </li>
        ))}
      </ul>

      <h2 className={H2}>Qué verificamos y cómo</h2>
      <p>
        Una anomalía térmica es una alerta preliminar. Antes de notificar la
        contrastamos con cobertura de suelo, histórico de focos de la zona,
        fuentes industriales conocidas y, cuando existe, una segunda pasada o un
        segundo satélite. Si no se confirma, se comunica como &quot;no
        verificado&quot;. La definición exacta de estos criterios se acuerda con
        cada organización usuaria.
      </p>

      <h2 className={H2}>Falsos positivos y límites</h2>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          Quemas controladas, chimeneas industriales, pozos de petróleo y
          superficies muy reflectantes pueden dar falsos positivos.
        </li>
        <li>
          Las nubes densas y el humo espeso bloquean la observación en
          infrarrojo.
        </li>
        <li>Un foco menor al píxel o que arde entre pasadas puede no verse.</li>
        <li>
          Ningún sistema satelital elimina por completo los falsos positivos ni
          los falsos negativos.
        </li>
        <li>
          Los drones y sensores en tierra se suman de forma progresiva: hoy no
          son una flota operativa.
        </li>
      </ul>

      <h2 className={H2}>De dónde salen los datos en vivo</h2>
      <ul className="space-y-4">
        <li>
          <strong>NASA FIRMS.</strong> Focos activos de VIIRS en modo casi
          tiempo real. Los datos son abiertos, con pedido de reconocimiento a
          NASA FIRMS. Pueden llegar con hasta unas 3 horas de demora respecto de
          la observación. En la web los actualizamos cada hora como máximo, y se
          muestran con su fecha y hora.{" "}
          <a
            className="underline"
            href="https://firms.modaps.eosdis.nasa.gov/"
            target="_blank"
            rel="noopener noreferrer"
          >
            firms.modaps.eosdis.nasa.gov
          </a>
        </li>
        <li>
          <strong>Open-Meteo.</strong> Datos meteorológicos bajo licencia CC BY
          4.0, con atribución. Se consultan cada 15 minutos como máximo y son
          estimaciones de modelo para el punto elegido, no mediciones de una
          estación.{" "}
          <a
            className="underline"
            href="https://open-meteo.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            open-meteo.com
          </a>
        </li>
      </ul>
      <p className="mt-4">
        Los datos que genera la implementación de un cliente no son públicos y
        no se muestran en esta web.
      </p>

      <h2 className={H2}>Qué no prometemos</h2>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          Que cada incendio vaya a ser detectado, ni en{" "}
          {CLAIMS.detectionMinutes} minutos ni en ningún plazo garantizado.
        </li>
        <li>Ausencia total de falsos positivos.</li>
        <li>
          Reemplazar a bomberos, brigadas ni a los sistemas oficiales de alerta.
        </li>
        <li>
          Convenios o respaldo de las entidades mencionadas en la web: son
          programas y competencias en las que participamos.
        </li>
      </ul>

      <p className="mt-14">
        <Link className="underline" href="/">
          Volver al inicio
        </Link>
      </p>
    </main>
  );
}
