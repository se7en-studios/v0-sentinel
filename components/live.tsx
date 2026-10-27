import { ArrowUpRight } from "lucide-react";
import { LiveCountUp } from "@/components/live-count-up";
import { LiveExplorerLazy } from "@/components/live-explorer-lazy";
import { localityStats } from "@/components/locality-stats";
import { Updated, formatUpdated } from "@/components/data/data-section";
import { FIRMS_LABEL } from "@/lib/firms";
import { RISK_RANK, riskLabel, type RiskLabel } from "@/lib/landing-data/risk";
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

// Brighter than RISK_STYLE.text, which is tuned for the light background.
const RISK_ON_DARK: Record<RiskLabel, string> = {
  Bajo: "#5fe3a1",
  Moderado: "#f1e06b",
  Alto: "#f1b46b",
  Extremo: "#ff8f85",
};

// Entrada escalonada por scroll (CSS): cada elemento arranca un poco después.
const rise = (i: number) => ({
  animationRange: `entry ${4 + i * 7}% entry ${48 + i * 7}%`,
});

const link =
  "underline underline-offset-2 hover:text-[#e3f6dc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-a-accent";

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

  const count = fires?.inArgentina.length ?? 0;

  return (
    <section
      id="en-vivo"
      aria-labelledby="live-title"
      className="a-root scroll-mt-16 px-4 py-24 sm:px-6 md:py-36"
    >
      <div className="mx-auto max-w-[1100px]">
        <p className="a-eyebrow a-load text-center">En vivo</p>
        <h2
          id="live-title"
          className="a-title a-rise mx-auto mt-4 max-w-3xl text-center"
        >
          {count > 0 ? (
            <>
              <span className="a-display-m mb-3 block tabular-nums" style={{ fontSize: "clamp(4.5rem, 15vw, 9rem)", lineHeight: 0.9 }}>
                <LiveCountUp value={count} />
              </span>
              focos de calor en Argentina en las últimas 24 horas
            </>
          ) : fires ? (
            "Hoy los satélites no reportan focos de calor en Argentina"
          ) : (
            "Lo que ven hoy los satélites sobre Argentina"
          )}
        </h2>
        <p className="a-sub a-rise mx-auto mt-6 max-w-2xl text-center">
          {fires ? (
            <>
              Fuente: NASA FIRMS ({FIRMS_LABEL}). <Updated at={fires.at} />
              .{" "}
            </>
          ) : (
            <>No pudimos conectar con NASA FIRMS en este momento. </>
          )}
          Un foco de calor no es un incendio confirmado: es la misma clase de
          dato satelital que procesamos y verificamos, y llega con una demora de
          horas.
        </p>

        <div className="mt-14 grid grid-cols-1 gap-5 md:mt-20 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          {fires ? (
            <LiveExplorerLazy
              fires={mapFires}
              places={places}
              readingTime={readingTime}
              sourceLabel={FIRMS_LABEL}
              stats={localityStats(fires.inArgentina)}
              totalFires={fires.inArgentina.length}
              firesAt={formatUpdated(fires.at)}
            />
          ) : (
            <div
              role="status"
              className="a-card flex min-h-80 items-center justify-center p-8 text-center lg:min-h-[480px]"
            >
              <p className="a-sub max-w-sm">
                El mapa de focos de NASA FIRMS no está disponible en este
                momento. Se reintenta automáticamente; volvé a visitar la página
                en unos minutos.
              </p>
            </div>
          )}

          <div className="flex min-w-0 flex-col gap-5">
            <section
              aria-labelledby="live-riesgo"
              className="a-card a-rise min-w-0 p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <h3
                  id="live-riesgo"
                  className="text-lg font-semibold tracking-tight text-[#e3f6dc]"
                >
                  Riesgo por localidad
                </h3>
                {overall && (
                  <span
                    className="text-sm font-medium"
                    style={{ color: RISK_ON_DARK[overall] }}
                  >
                    Patagonia: {overall}
                  </span>
                )}
              </div>
              {rows.length > 0 ? (
                <table className="mt-4 w-full border-collapse text-left">
                  <thead className="sr-only">
                    <tr>
                      <th scope="col">Localidad</th>
                      <th scope="col">Riesgo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ r, label }, i) => (
                      <tr
                        key={r.location.name}
                        className="a-rise border-t border-a-line"
                        style={rise(i)}
                      >
                        <th
                          scope="row"
                          className="py-3 pr-3 text-left font-normal"
                        >
                          <span className="block font-medium text-[#e3f6dc]">
                            {r.location.name}
                          </span>
                          <span className="block text-sm tabular-nums text-a-mute">
                            {Math.round(r.temperature)} °C ·{" "}
                            {Math.round(r.humidity)}% ·{" "}
                            {Math.round(r.windSpeed)} km/h
                          </span>
                        </th>
                        <td
                          className="py-3 text-right text-sm font-medium"
                          style={{ color: RISK_ON_DARK[label] }}
                        >
                          {label}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p role="status" className="mt-3 text-sm text-a-mute">
                  La lectura de Open-Meteo no está disponible en este momento.
                </p>
              )}
              <p className="mt-4 text-xs leading-relaxed text-a-mute">
                {readingTime && `Lectura ${readingTime} (hora local). `}
                Índice ilustrativo propio (temperatura, humedad y viento), no es
                el FWI oficial. Fuente:{" "}
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

            <section
              aria-labelledby="live-cifras"
              className="a-card a-rise min-w-0 p-5 sm:p-6"
            >
              <h3
                id="live-cifras"
                className="text-lg font-semibold tracking-tight text-[#e3f6dc]"
              >
                Cifras de focos en Argentina
              </h3>
              <dl className="mt-4 grid grid-cols-2 gap-5">
                <div className="flex flex-col-reverse gap-1">
                  <dt className="text-sm text-a-mute">últimas 24 h</dt>
                  <dd className="text-4xl font-semibold leading-none tracking-tight tabular-nums sm:text-5xl text-[#e3f6dc]">
                    {fires ? nf(count) : "—"}
                  </dd>
                </div>
                <div className="flex flex-col-reverse gap-1">
                  <dt className="text-sm text-a-mute">últimos 90 días</dt>
                  <dd className="text-4xl font-semibold leading-none tracking-tight tabular-nums sm:text-5xl text-[#e3f6dc]">
                    {impact
                      ? `${impact.failedChunks > 0 ? "≥ " : ""}${nf(impact.total)}`
                      : "—"}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-xs leading-relaxed text-a-mute">
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
                {impact && (
                  <>
                    {" "}
                    <Updated at={impact.at} />.
                  </>
                )}{" "}
                El contorno de Argentina está simplificado: puede errar cerca de
                la frontera.
              </p>
            </section>
          </div>
        </div>

        {news.length > 0 && (
          <section aria-labelledby="live-noticias" className="mt-16 border-t border-a-line pt-10 md:mt-20">
            <h3
              id="live-noticias"
              className="text-lg font-semibold tracking-tight text-[#e3f6dc]"
            >
              Noticias recientes
            </h3>
            <ul className="mt-4 grid list-none grid-cols-1 gap-5 p-0 md:grid-cols-3">
              {news.map((item, i) => (
                <li
                  key={item.link}
                  className="a-rise min-w-0"
                  style={rise(i)}
                >
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="a-card a-lift group flex h-full flex-col justify-between gap-8 p-5 hover:bg-a-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-a-accent sm:p-6"
                  >
                    <span className="line-clamp-4 text-lg font-semibold leading-snug tracking-tight text-[#e3f6dc]">
                      {item.title}
                    </span>
                    <span className="flex items-center justify-between gap-2 text-sm text-a-mute">
                      <span>
                        {item.source} ·{" "}
                        {relativeTime(item.publishedAt, newsAt.getTime())}
                        <span className="sr-only">
                          {" "}
                          (se abre en una pestaña nueva)
                        </span>
                      </span>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="size-4 shrink-0 group-hover:text-a-accent"
                      />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-a-mute">
              Fuente:{" "}
              <a
                href="https://gnews.io/"
                target="_blank"
                rel="noopener noreferrer"
                className={link}
              >
                GNews
              </a>
              , filtradas por relevancia y sin repetidos.{" "}
              <Updated at={newsAt} />.
            </p>
          </section>
        )}
      </div>
    </section>
  );
}
