import { ArrowUpRight } from "lucide-react";
import { Chapter, Eyebrow } from "@/components/ui/chapter";
import { FireMapLiveLazy } from "@/components/ui/fire-map-live-lazy";
import { Updated } from "@/components/data/data-section";
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

const link =
  "underline underline-offset-2 hover:text-[#f4efe2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5fe3a1]";

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

  return (
    <Chapter id="en-vivo" tone="dark">
      <Eyebrow tone="dark">En vivo</Eyebrow>
      <h2 className="t-h2 max-w-3xl">
        {fires && fires.inArgentina.length > 0 ? (
          <>
            {nf(fires.inArgentina.length)} focos de calor en Argentina,{" "}
            <span className="text-ember">últimas 24 horas.</span>
          </>
        ) : (
          "Lo que ven hoy los satélites sobre Argentina."
        )}
      </h2>
      <p className="t-body mt-4 max-w-2xl text-[#f4efe2]/80">
        Son focos de calor, no necesariamente incendios forestales: la misma
        clase de dato satelital que Sentinel procesa y verifica. Los satélites
        reportan con una demora de horas.
        {fires && (
          <>
            {" "}
            <Updated at={fires.at} />.
          </>
        )}
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        {fires ? (
          <FireMapLiveLazy
            fires={mapFires}
            places={places}
            readingTime={readingTime}
            sourceLabel={FIRMS_LABEL}
          />
        ) : (
          <div
            role="status"
            className="flex min-h-80 items-center justify-center rounded-2xl border border-white/10 bg-ash p-8 text-center lg:min-h-[480px]"
          >
            <p className="t-body max-w-sm text-[#f4efe2]/80">
              El mapa de focos de NASA FIRMS no está disponible en este momento.
              Se reintenta automáticamente; volvé a visitar la página en unos
              minutos.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-6">
          <section
            aria-labelledby="live-riesgo"
            className="rounded-2xl border border-white/10 bg-ash p-5"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 id="live-riesgo" className="t-label text-[#f4efe2]/80">
                Riesgo por localidad
              </h3>
              {overall && (
                <span
                  className="t-label"
                  style={{ color: RISK_ON_DARK[overall] }}
                >
                  Patagonia: {overall}
                </span>
              )}
            </div>
            {rows.length > 0 ? (
              <ul className="mt-3 list-none divide-y divide-white/10 p-0">
                {rows.map(({ r, label }) => (
                  <li
                    key={r.location.name}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium">
                        {r.location.name}
                      </span>
                      <span className="t-small block tabular-nums text-[#f4efe2]/70">
                        {Math.round(r.temperature)} °C ·{" "}
                        {Math.round(r.humidity)}% · {Math.round(r.windSpeed)}{" "}
                        km/h
                      </span>
                    </span>
                    <span
                      className="t-label shrink-0"
                      style={{ color: RISK_ON_DARK[label] }}
                    >
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p role="status" className="t-small mt-3 text-[#f4efe2]/80">
                La lectura de Open-Meteo no está disponible en este momento.
              </p>
            )}
            <p className="t-small mt-3 text-[#f4efe2]/70">
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
            className="rounded-2xl border border-white/10 bg-ash p-5"
          >
            <h3 id="live-cifras" className="t-label text-[#f4efe2]/80">
              Cifras de focos en Argentina
            </h3>
            <dl className="mt-3 grid grid-cols-2 gap-4">
              <div className="flex flex-col-reverse"><dt className="t-small text-[#f4efe2]/75">últimas 24 h</dt><dd className="t-h3 tabular-nums text-ember">
                  {fires ? nf(fires.inArgentina.length) : "—"}
                </dd></div>
              <div className="flex flex-col-reverse"><dt className="t-small text-[#f4efe2]/75">últimos 90 días</dt><dd className="t-h3 tabular-nums text-ember">
                  {impact
                    ? `${impact.failedChunks > 0 ? "≥ " : ""}${nf(impact.total)}`
                    : "—"}
                </dd></div>
            </dl>
            <p className="t-small mt-3 text-[#f4efe2]/70">
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
        <section aria-labelledby="live-noticias" className="mt-10">
          <h3 id="live-noticias" className="t-label text-[#f4efe2]/80">
            Noticias recientes
          </h3>
          <ul className="mt-3 flex list-none flex-col gap-3 p-0 md:flex-row">
            {news.map((item) => (
              <li key={item.link} className="min-w-0 md:flex-1">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-ash p-5 transition-colors hover:border-[#5fe3a1]/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5fe3a1]"
                >
                  <span className="line-clamp-3 font-medium leading-snug">
                    {item.title}
                  </span>
                  <span className="t-small flex items-center justify-between gap-2 text-[#f4efe2]/70">
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
                      className="size-4 shrink-0 group-hover:text-[#5fe3a1]"
                    />
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <p className="t-small mt-3 text-[#f4efe2]/70">
            Fuente:{" "}
            <a
              href="https://gnews.io/"
              target="_blank"
              rel="noopener noreferrer"
              className={link}
            >
              GNews
            </a>
            , filtradas por relevancia y sin repetidos. <Updated at={newsAt} />.
          </p>
        </section>
      )}
    </Chapter>
  );
}
