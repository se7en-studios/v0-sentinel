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

  const hasFires = Boolean(fires && fires.inArgentina.length > 0);

  return (
    <Chapter id="en-vivo" tone="dark" className="isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 85% 10%, rgba(232,115,42,0.14), transparent 70%), radial-gradient(50% 40% at 5% 60%, rgba(95,227,161,0.07), transparent 70%)",
        }}
      />
      <div className="bg-noise pointer-events-none absolute inset-0 -z-10 opacity-[0.05]" aria-hidden="true" />

      <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <Eyebrow tone="dark">En vivo</Eyebrow>
          <h2 className="max-w-3xl">
            {hasFires && fires ? (
              <>
                <span className="t-display block text-ember">
                  {nf(fires.inArgentina.length)}
                </span>
                <span className="t-h3 mt-3 block text-[#f4efe2]">
                  focos de calor en Argentina · últimas 24 horas
                </span>
              </>
            ) : (
              <span className="t-h2">
                Lo que ven hoy los satélites sobre Argentina.
              </span>
            )}
          </h2>
          <p className="t-body mt-5 max-w-2xl text-[#f4efe2]/80">
            Son focos de calor, no necesariamente incendios forestales: la
            misma clase de dato satelital que Sentinel procesa y verifica. Los
            satélites reportan con una demora de horas.
          </p>
        </div>

        <div className="glass rounded-xl px-5 py-4 lg:min-w-64">
          <p className="t-label flex items-center gap-2.5 text-[#f4efe2]">
            <span aria-hidden="true" className="relative flex size-2.5">
              <span
                className={`absolute inline-flex size-full rounded-full motion-safe:animate-ping ${fires ? "bg-leaf-bright/60" : "bg-ember/60"}`}
              />
              <span
                className={`relative inline-flex size-2.5 rounded-full ${fires ? "bg-leaf-bright" : "bg-ember"}`}
              />
            </span>
            Estado del sistema
          </p>
          <p className="t-small mt-2 text-[#f4efe2]/85">
            {fires ? (
              <>
                <Updated at={fires.at} />
              </>
            ) : (
              "Sin conexión con NASA FIRMS"
            )}
          </p>
          <p className="t-small mt-0.5 text-[#f4efe2]/70">
            Fuente: NASA FIRMS · {FIRMS_LABEL}
          </p>
        </div>
      </div>

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
            className="glass flex min-h-80 items-center justify-center rounded-[20px] p-8 text-center lg:min-h-[480px]"
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
            className="glass rounded-[20px] p-6"
          >
            <h3 id="live-riesgo" className="t-label text-[#f4efe2]/85">
              Riesgo por localidad
            </h3>
            {overall && (
              <p
                className="t-h3 mt-2"
                style={{ color: RISK_ON_DARK[overall] }}
              >
                Patagonia: {overall}
              </p>
            )}
            {rows.length > 0 ? (
              <ul className="mt-4 list-none divide-y divide-white/10 p-0">
                {rows.map(({ r, label }) => (
                  <li
                    key={r.location.name}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold">
                        {r.location.name}
                      </span>
                      <span className="t-small block tabular-nums text-[#f4efe2]/70">
                        {Math.round(r.temperature)} °C ·{" "}
                        {Math.round(r.humidity)}% · {Math.round(r.windSpeed)}{" "}
                        km/h
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1.5">
                      <span
                        className="t-label"
                        style={{ color: RISK_ON_DARK[label] }}
                      >
                        {label}
                      </span>
                      <RiskMeter rank={RISK_RANK[label]} color={RISK_ON_DARK[label]} />
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p role="status" className="t-small mt-3 text-[#f4efe2]/80">
                La lectura de Open-Meteo no está disponible en este momento.
              </p>
            )}
            <p className="t-small mt-4 text-[#f4efe2]/70">
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
            className="glass rounded-[20px] p-6"
          >
            <h3 id="live-cifras" className="t-label text-[#f4efe2]/85">
              Cifras de focos en Argentina
            </h3>
            <dl className="mt-4 grid grid-cols-2 gap-5">
              <div className="flex flex-col-reverse gap-1">
                <dt className="t-small text-[#f4efe2]/80">últimas 24 h</dt>
                <dd className="t-h2 tabular-nums text-ember">
                  {fires ? nf(fires.inArgentina.length) : "—"}
                </dd>
              </div>
              <div className="flex flex-col-reverse gap-1">
                <dt className="t-small text-[#f4efe2]/80">últimos 90 días</dt>
                <dd className="t-h2 tabular-nums text-ember">
                  {impact
                    ? `${impact.failedChunks > 0 ? "≥ " : ""}${nf(impact.total)}`
                    : "—"}
                </dd>
              </div>
            </dl>
            <p className="t-small mt-4 text-[#f4efe2]/70">
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
        <section aria-labelledby="live-noticias" className="mt-14">
          <h3 id="live-noticias" className="t-label text-[#f4efe2]/85">
            Noticias recientes
          </h3>
          <ul className="mt-4 flex list-none flex-col gap-4 p-0 md:flex-row">
            {news.map((item, i) => (
              <li
                key={item.link}
                className={`min-w-0 ${i === 0 ? "md:flex-[1.4]" : "md:flex-1"}`}
              >
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass group flex h-full flex-col justify-between gap-6 rounded-[20px] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#5fe3a1]/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5fe3a1]"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="t-label rounded-full border border-white/15 px-2.5 py-1 text-[#f4efe2]/85">
                      {item.source}
                    </span>
                    <span className="t-label tabular-nums text-[#f4efe2]/60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </span>
                  <span
                    className={`line-clamp-4 font-heading font-semibold leading-snug tracking-tight ${i === 0 ? "text-xl md:text-2xl" : "text-lg"}`}
                  >
                    {item.title}
                  </span>
                  <span className="t-small flex items-center justify-between gap-2 text-[#f4efe2]/70">
                    <span>
                      {relativeTime(item.publishedAt, newsAt.getTime())}
                      <span className="sr-only">
                        {" "}
                        (se abre en una pestaña nueva)
                      </span>
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#5fe3a1]"
                    />
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <p className="t-small mt-4 text-[#f4efe2]/70">
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

function RiskMeter({ rank, color }: { rank: number; color: string }) {
  return (
    <span aria-hidden="true" className="flex gap-1">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="h-1.5 w-5 rounded-full"
          style={{ background: i <= rank ? color : "rgba(244,239,226,0.14)" }}
        />
      ))}
    </span>
  );
}
