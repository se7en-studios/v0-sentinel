import { LiveExplorer } from "@/components/locality-check";
import { localityStats } from "@/components/locality-stats";
import { formatUpdated } from "@/components/data/data-section";
import { FIRMS_LABEL } from "@/lib/firms";
import { RISK_RANK, riskLabel } from "@/lib/landing-data/risk";
import { topByFrp } from "@/lib/landing-data/firms";
import { curateNews } from "@/lib/landing-data/news";
import { fetchActiveFires } from "@/components/active-fires";
import { fetchImpact } from "@/components/fire-impact-stats";
import {
  fetchReading,
  locations,
  type Reading,
} from "@/components/fire-risk-index";
import {
  MAX_ITEMS,
  fetchWildfireNews,
  relativeTime,
} from "@/components/wildfire-news";

const MAP_ARGENTINA = 150;
const MAX_NEWS = 3;
const nf = (n: number) => n.toLocaleString("es-AR");

const link =
  "underline underline-offset-2 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const serif = "font-[family-name:var(--font-serif)]";

export async function LiveChapter() {
  const [fires, impact, rawReadings, rawNews] = await Promise.all([
    fetchActiveFires(),
    fetchImpact(),
    Promise.all(locations.map(fetchReading)),
    fetchWildfireNews(),
  ]);

  const readings = rawReadings.filter((r): r is Reading => r !== null);
  const rows = readings.map((r) => ({ r, label: riskLabel(r) }));
  const overall = rows.length
    ? rows.reduce((w, x) => (RISK_RANK[x.label] > RISK_RANK[w.label] ? x : w))
        .label
    : null;
  const readingTime = readings[0]?.time.replace("T", " ").slice(0, 16) ?? "";
  const news = rawNews ? curateNews(rawNews, MAX_ITEMS).slice(0, MAX_NEWS) : [];
  const newsAt = new Date();

  const mapFires = fires ? topByFrp(fires.inArgentina, MAP_ARGENTINA) : [];
  const places = rows.map(({ r, label }) => ({
    name: r.location.name,
    province: r.location.province,
    lat: r.location.lat,
    lon: r.location.lon,
    label,
    temperature: r.temperature,
    humidity: r.humidity,
    windSpeed: r.windSpeed,
  }));

  const total = fires?.inArgentina.length ?? 0;

  return (
    <section
      id="en-vivo"
      aria-labelledby="live-title"
      className="relative scroll-mt-20 bg-paper py-20 text-ink md:py-32"
    >
      <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
        <header className="grid min-w-0 gap-6 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-8">
            {fires && total > 0 ? (
              <h2 id="live-title">
                <span className="t-display block tabular-nums text-signal">
                  {nf(total)}
                </span>
                <span className="t-h2 mt-2 block">
                  focos de calor en Argentina en las últimas 24 horas
                </span>
              </h2>
            ) : (
              <h2 id="live-title" className="t-h2">
                Los focos de calor que ven hoy los satélites sobre Argentina
              </h2>
            )}
          </div>
          <div className="min-w-0 lg:col-span-4 lg:self-end">
            <p className="t-body">
              {fires ? (
                <>
                  Datos de NASA FIRMS ({FIRMS_LABEL}), actualizados el{" "}
                  <time dateTime={fires.at.toISOString()}>
                    {formatUpdated(fires.at)}
                  </time>
                  .
                </>
              ) : (
                "No hay conexión con NASA FIRMS en este momento."
              )}{" "}
              Un foco de calor no es un incendio confirmado, y los satélites
              reportan con una demora de horas.
            </p>
          </div>
        </header>

        <div className="mt-12 grid min-w-0 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="min-w-0 lg:col-span-8">
            {fires ? (
              <LiveExplorer
                fires={mapFires}
                places={places}
                readingTime={readingTime}
                sourceLabel={FIRMS_LABEL}
                stats={localityStats(fires.inArgentina)}
                totalFires={total}
                firesAt={formatUpdated(fires.at)}
              />
            ) : (
              <p
                role="status"
                className="t-body border-y rule py-10 text-ink/80"
              >
                El mapa de focos de NASA FIRMS no está disponible en este
                momento. Se reintenta automáticamente; volvé a visitar la página
                en unos minutos.
              </p>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-10 lg:col-span-4">
            <section
              aria-labelledby="live-cifras"
              className="border-t rule pt-4"
            >
              <h3 id="live-cifras" className="t-h3">
                Focos en Argentina
              </h3>
              <dl className="mt-4 grid grid-cols-2 gap-5">
                <div className="flex min-w-0 flex-col-reverse gap-1">
                  <dt className="t-caption ">últimas 24 horas</dt>
<dd className={`${serif} text-4xl tabular-nums text-signal`}>
                    {fires ? nf(total) : "—"}
                  </dd>
                </div>
                <div className="flex min-w-0 flex-col-reverse gap-1">
                  <dt className="t-caption ">últimos 90 días</dt>
<dd className={`${serif} text-4xl tabular-nums text-signal`}>
                    {impact
                      ? `${impact.failedChunks > 0 ? "≥ " : ""}${nf(impact.total)}`
                      : "—"}
                  </dd>
                </div>
              </dl>
              <p className="t-caption mt-4">
                {impact?.failedChunks
                  ? `Dato parcial: ${impact.failedChunks} de ${impact.totalChunks} períodos no respondieron; es un mínimo. `
                  : ""}
                Fuente:{" "}
                <a
                  href="https://firms.modaps.eosdis.nasa.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={link}
                >
                  NASA FIRMS
                </a>{" "}
                ({FIRMS_LABEL}), confianza media o alta, dato preliminar sin
                verificar en campo.
                {impact && <> Actualizado {formatUpdated(impact.at)}.</>} El
                contorno de Argentina está simplificado y puede errar cerca de
                la frontera.
              </p>
            </section>

            <section
              aria-labelledby="live-riesgo"
              className="border-t rule pt-4"
            >
              <h3 id="live-riesgo" className="t-h3">
                Riesgo por localidad
              </h3>
              {overall && (
                <p className="t-body mt-1">
                  Patagonia hoy: <strong>{overall}</strong>
                </p>
              )}
              {rows.length > 0 ? (
                <table className="mt-3 w-full table-fixed border-collapse text-left text-sm tabular-nums">
                  <caption className="sr-only">
                    Riesgo estimado, temperatura, humedad y viento por localidad
                  </caption>
                  <thead>
                    <tr className="t-caption border-b rule">
                      <th scope="col" className="w-[34%] py-2 pr-2 font-normal">
                        Localidad
                      </th>
                      <th scope="col" className="w-[22%] py-2 pr-2 font-normal">
                        Riesgo
                      </th>
                      <th
                        scope="col"
                        className="py-2 pr-2 text-right font-normal"
                      >
                        Temp.
                      </th>
                      <th
                        scope="col"
                        className="py-2 pr-2 text-right font-normal"
                      >
                        Hum.
                      </th>
                      <th scope="col" className="py-2 text-right font-normal">
                        Viento
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ r, label }) => (
                      <tr key={r.location.name} className="border-b rule">
                        <th
                          scope="row"
                          className="break-words py-2.5 pr-2 font-semibold"
                        >
                          {r.location.name}
                        </th>
                        <td className="py-2.5 pr-2">{label}</td>
                        <td className="py-2.5 pr-2 text-right">
                          {Math.round(r.temperature)}°
                        </td>
                        <td className="py-2.5 pr-2 text-right">
                          {Math.round(r.humidity)}%
                        </td>
                        <td className="py-2.5 text-right">
                          {Math.round(r.windSpeed)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p role="status" className="t-small mt-3 text-ink/80">
                  La lectura de Open-Meteo no está disponible en este momento.
                </p>
              )}
              <p className="t-caption mt-3">
                {readingTime && `Lectura ${readingTime} (hora local). `}
                Temperatura en °C y viento en km/h. Índice ilustrativo propio
                (temperatura, humedad y viento), no es el FWI oficial. Fuente:{" "}
                <a
                  href="https://open-meteo.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={link}
                >
                  Open-Meteo
                </a>{" "}
                (CC BY 4.0).
              </p>
            </section>
          </div>
        </div>

        {news.length > 0 && (
          <section aria-labelledby="live-noticias" className="mt-16 md:mt-24">
            <h3 id="live-noticias" className="t-h3">
              Noticias recientes sobre incendios
            </h3>
            <ul className="mt-4 list-none p-0">
              {news.map((item) => (
                <li
                  key={item.link}
                  className="grid min-w-0 gap-1 border-t rule py-5 md:grid-cols-12 md:gap-8"
                >
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${serif} min-w-0 text-xl leading-snug hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:col-span-9 md:text-2xl`}
                  >
                    {item.title}
                    <span className="sr-only">
                      {" "}
                      (se abre en una pestaña nueva)
                    </span>
                  </a>
                  <p className="t-caption md:col-span-3 md:text-right">
                    {item.source} ·{" "}
                    {relativeTime(item.publishedAt, newsAt.getTime())}
                  </p>
                </li>
              ))}
            </ul>
            <p className="t-caption border-t rule pt-3">
              Fuente:{" "}
              <a
                href="https://gnews.io/"
                target="_blank"
                rel="noopener noreferrer"
                className={link}
              >
                GNews
              </a>
              , filtradas por relevancia y sin repetidos. Actualizado{" "}
              {formatUpdated(newsAt)}.
            </p>
          </section>
        )}
      </div>
    </section>
  );
}
