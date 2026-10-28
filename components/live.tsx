import { LiveCountUp } from "@/components/live-count-up";
import { LiveExplorerLazy } from "@/components/live-explorer-lazy";
import { localityStats } from "@/components/locality-stats";
import { formatUpdated as formatUpdatedEs } from "@/components/data/data-section";
import { getLang, t, type Copy, type Lang } from "@/lib/i18n";
import { FIRMS_LABEL } from "@/lib/firms";
import { RISK_RANK, RISK_WORD, riskLabel, type RiskLabel } from "@/lib/landing-data/risk";
import { topByFrp } from "@/lib/landing-data/firms";
import { fetchActiveFires } from "@/components/active-fires";
import { fetchImpact } from "@/components/fire-impact-stats";
import {
  fetchReading,
  locations,
  type Reading,
} from "@/components/fire-risk-index";

const MAP_ARGENTINA = 150;
const LOCALE: Record<Lang, string> = { es: "es-AR", en: "en-US" };
const nf = (n: number) => n.toLocaleString(LOCALE[getLang()]);

// El español usa el helper compartido; el inglés formatea igual pero en inglés.
const formatUpdated = (d: Date) =>
  getLang() === "es"
    ? formatUpdatedEs(d)
    : `${new Intl.DateTimeFormat("en-GB", {
        timeZone: "America/Argentina/Buenos_Aires",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(d)} (Argentina time)`;

const Updated = ({ at }: { at: Date }) => (
  <time dateTime={at.toISOString()}>
    {t(COPY).updated} {formatUpdated(at)}
  </time>
);

const COPY: Copy<{
  updated: string;
  eyebrow: string;
  hotspotsIn: string;
  last24: string;
  noHotspots: string;
  seenToday: string;
  firmsDown: string;
  unconfirmed: string;
  mapDown: string;
  riskTitle: string;
  patagonia: string;
  colPlace: string;
  colWeather: string;
  colRisk: string;
  readingDown: string;
  in24h: string;
  in90d: string;
  prelim: string;
  newTab: string;
  confidence: string;
  partial: (failed: number, total: number) => string;
  border: string;
  reading: (time: string) => string;
  index: string;
}> = {
  es: {
    updated: "Actualizado",
    eyebrow: "En vivo · NASA FIRMS",
    hotspotsIn: "focos de calor en Argentina",
    last24: "en las últimas 24 horas",
    noHotspots: "Hoy los satélites no reportan focos de calor en Argentina",
    seenToday: "Lo que ven hoy los satélites sobre Argentina",
    firmsDown: "No pudimos conectar con NASA FIRMS en este momento.",
    unconfirmed: "Un foco de calor no es un incendio confirmado.",
    mapDown:
      "El mapa de focos de NASA FIRMS no está disponible en este momento. Se reintenta automáticamente; volvé a visitar la página en unos minutos.",
    riskTitle: "Riesgo por localidad",
    patagonia: "Patagonia",
    colPlace: "Localidad",
    colWeather: "Temperatura, humedad y viento",
    colRisk: "Riesgo",
    readingDown: "La lectura de Open-Meteo no está disponible en este momento.",
    in24h: "focos en 24 h",
    in90d: "en 90 días",
    prelim:
      "Los focos de calor son datos satelitales preliminares, sin verificar en campo, y llegan con una demora de horas. Fuente:",
    newTab: " (se abre en una pestaña nueva)",
    confidence: ", confianza media o alta. ",
    partial: (f, n) =>
      `Cifra de 90 días parcial: ${f} de ${n} períodos no respondieron, es un mínimo. `,
    border:
      "El contorno de Argentina está simplificado y puede errar cerca de la frontera.",
    reading: (t) => `Riesgo: lectura ${t} (hora local). `,
    index:
      "Índice ilustrativo propio (temperatura, humedad y viento), no es el FWI oficial. Datos meteorológicos:",
  },
  en: {
    updated: "Updated",
    eyebrow: "Live · NASA FIRMS",
    hotspotsIn: "fire hotspots in Argentina",
    last24: "in the last 24 hours",
    noHotspots: "Today satellites report no fire hotspots in Argentina",
    seenToday: "What satellites see over Argentina today",
    firmsDown: "We couldn't connect to NASA FIRMS right now.",
    unconfirmed: "A fire hotspot is not a confirmed wildfire.",
    mapDown:
      "The NASA FIRMS hotspot map is not available right now. It retries automatically; check back in a few minutes.",
    riskTitle: "Risk by town",
    patagonia: "Patagonia",
    colPlace: "Town",
    colWeather: "Temperature, humidity and wind",
    colRisk: "Risk",
    readingDown: "The Open-Meteo reading is not available right now.",
    in24h: "hotspots in 24 h",
    in90d: "in 90 days",
    prelim:
      "Fire hotspots are preliminary satellite data, not verified on the ground, and arrive with a delay of hours. Source:",
    newTab: " (opens in a new tab)",
    confidence: ", medium or high confidence. ",
    partial: (f, n) =>
      `Partial 90-day figure: ${f} of ${n} periods did not respond, so this is a minimum. `,
    border:
      "The outline of Argentina is simplified and may be off near the border.",
    reading: (t) => `Risk: reading ${t} (local time). `,
    index:
      "Our own illustrative index (temperature, humidity and wind), not the official FWI. Weather data:",
  },
};

// Brighter than RISK_STYLE.text, which is tuned for the light background.
const RISK_ON_DARK: Record<RiskLabel, string> = {
  Bajo: "#5fe3a1",
  Moderado: "#f1e06b",
  Alto: "#f1b46b",
  Extremo: "#ff8f85",
};

const link =
  "underline underline-offset-2 hover:text-[#e3f6dc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-a-accent";

// Las noticias salen de la home (quedaban flojas); components/wildfire-news.tsx sigue disponible.
export async function LiveChapter() {
  const c = t(COPY);
  const lang = getLang();
  const [fires, impact, rawReadings] = await Promise.all([
    fetchActiveFires(),
    fetchImpact(),
    Promise.all(locations.map(fetchReading)),
  ]);

  const readings = rawReadings.filter((r): r is Reading => r !== null);
  const rows = readings.map((r) => ({ r, label: riskLabel(r) }));
  const overall = rows.length
    ? rows.reduce((w, x) => (RISK_RANK[x.label] > RISK_RANK[w.label] ? x : w))
        .label
    : null;
  const readingTime = readings[0]?.time.replace("T", " ").slice(0, 16) ?? "";

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
      className="a-root a-glow scroll-mt-16 px-4 py-24 sm:px-6 md:py-32"
    >
      <div className="mx-auto max-w-[1280px]">
        <h2
          id="live-title"
          className="a-rise mx-auto max-w-3xl text-center font-[family-name:var(--font-display)] text-[clamp(1.5rem,3vw,2.25rem)] font-normal leading-[1.15] text-[#e3f6dc]"
        >
          {count > 0 ? (
            <>
              <span className="a-eyebrow mb-6 flex items-center justify-center gap-2.5 !font-[family-name:var(--font-geist)]">
                <span aria-hidden className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full rounded-full bg-[#ff8a4c] opacity-70 motion-safe:animate-ping" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-[#ff8a4c]" />
                </span>
                {c.eyebrow}
              </span>
              <span
                className="a-display-m mb-5 block bg-gradient-to-b from-white via-[#e9f7dc] to-[#ffb27a] bg-clip-text tabular-nums text-transparent [text-shadow:none]"
                style={{
                  fontSize: "clamp(6rem, 20vw, 13rem)",
                  lineHeight: 0.86,
                }}
              >
                <LiveCountUp value={count} />
              </span>
              {c.hotspotsIn} <span className="a-em">{c.last24}</span>
            </>
          ) : fires ? (
            c.noHotspots
          ) : (
            c.seenToday
          )}
        </h2>
        <p className="a-sub a-rise mx-auto mt-6 max-w-2xl text-center !text-[1rem] !text-a-mute">
          {fires ? (
            <>
              NASA FIRMS ({FIRMS_LABEL}). <Updated at={fires.at} />.{" "}
              {c.unconfirmed}
            </>
          ) : (
            <>{c.firmsDown}</>
          )}
        </p>

        <div className="mt-12 md:mt-16">
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
                {c.mapDown}
              </p>
            </div>
          )}
        </div>

        <section
          aria-labelledby="live-riesgo"
          className="mx-auto mt-20 max-w-3xl md:mt-28"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3
              id="live-riesgo"
              className="font-[family-name:var(--font-display)] text-[clamp(1.5rem,2.6vw,2rem)] text-[#e3f6dc]"
            >
              {c.riskTitle}
            </h3>
            {overall && (
              <span
                className="text-[0.9375rem] font-medium"
                style={{ color: RISK_ON_DARK[overall] }}
              >
                {c.patagonia}: {RISK_WORD[lang][overall]}
              </span>
            )}
          </div>
          {rows.length > 0 ? (
            <table className="mt-4 w-full border-collapse text-left text-[0.9375rem]">
              <thead className="sr-only">
                <tr>
                  <th scope="col">{c.colPlace}</th>
                  <th scope="col">{c.colWeather}</th>
                  <th scope="col">{c.colRisk}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ r, label }) => (
                  <tr key={r.location.name} className="border-t border-a-line">
                    <th
                      scope="row"
                      className="py-3 pr-3 text-left font-medium text-[#e3f6dc]"
                    >
                      {r.location.name}
                    </th>
                    <td className="hidden py-3 pr-3 tabular-nums text-a-mute sm:table-cell">
                      {Math.round(r.temperature)} °C · {Math.round(r.humidity)}%
                      · {Math.round(r.windSpeed)} km/h
                    </td>
                    <td
                      className="py-3 text-right font-medium"
                      style={{ color: RISK_ON_DARK[label] }}
                    >
                      {RISK_WORD[lang][label]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p role="status" className="mt-3 text-[0.9375rem] text-a-mute">
              {c.readingDown}
            </p>
          )}

          <p className="mt-10 text-center tabular-nums text-[#e3f6dc]">
            <span className="font-[family-name:var(--font-display)] text-4xl">
              {fires ? nf(count) : "—"}
            </span>{" "}
            <span className="text-a-mute">{c.in24h}</span>
            <span aria-hidden className="mx-3 text-a-faint">
              ·
            </span>
            <span className="font-[family-name:var(--font-display)] text-4xl">
              {impact
                ? `${impact.failedChunks > 0 ? "≥ " : ""}${nf(impact.total)}`
                : "—"}
            </span>{" "}
            <span className="text-a-mute">{c.in90d}</span>
          </p>
        </section>

        <p className="mx-auto mt-12 max-w-3xl text-center text-[0.8125rem] leading-relaxed text-a-mute">
          {c.prelim}{" "}
          <a
            href="https://firms.modaps.eosdis.nasa.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className={link}
          >
            NASA FIRMS
            <span className="sr-only">{c.newTab}</span>
          </a>{" "}
          ({FIRMS_LABEL}){c.confidence}
          {impact?.failedChunks
            ? c.partial(impact.failedChunks, impact.totalChunks)
            : ""}
          {c.border}{" "}
          {readingTime && c.reading(readingTime)}
          {c.index}{" "}
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={link}
          >
            Open-Meteo
            <span className="sr-only">{c.newTab}</span>
          </a>{" "}
(CC BY 4.0).
        </p>
      </div>
    </section>
  );
}
