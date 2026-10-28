import { LiveCountUp } from "@/components/live-count-up";
import { LiveExplorerLazy } from "@/components/live-explorer-lazy";
import { localityStats } from "@/components/locality-stats";
import { Updated, formatUpdated } from "@/components/data/data-section";
import { FIRMS_LABEL } from "@/lib/firms";
import { RISK_RANK, riskLabel, type RiskLabel } from "@/lib/landing-data/risk";
import { topByFrp } from "@/lib/landing-data/firms";
import { fetchActiveFires } from "@/components/active-fires";
import { fetchImpact } from "@/components/fire-impact-stats";
import {
  fetchReading,
  locations,
  type Reading,
} from "@/components/fire-risk-index";

const MAP_ARGENTINA = 150;
const nf = (n: number) => n.toLocaleString("es-AR");

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
                En vivo · NASA FIRMS
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
              focos de calor en Argentina{" "}
              <span className="a-em">en las últimas 24 horas</span>
            </>
          ) : fires ? (
            "Hoy los satélites no reportan focos de calor en Argentina"
          ) : (
            "Lo que ven hoy los satélites sobre Argentina"
          )}
        </h2>
        <p className="a-sub a-rise mx-auto mt-6 max-w-2xl text-center !text-[1rem] !text-a-mute">
          {fires ? (
            <>
              NASA FIRMS ({FIRMS_LABEL}). <Updated at={fires.at} />. Un foco de
              calor no es un incendio confirmado.
            </>
          ) : (
            <>No pudimos conectar con NASA FIRMS en este momento.</>
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
                El mapa de focos de NASA FIRMS no está disponible en este
                momento. Se reintenta automáticamente; volvé a visitar la página
                en unos minutos.
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
              Riesgo por localidad
            </h3>
            {overall && (
              <span
                className="text-[0.9375rem] font-medium"
                style={{ color: RISK_ON_DARK[overall] }}
              >
                Patagonia: {overall}
              </span>
            )}
          </div>
          {rows.length > 0 ? (
            <table className="mt-4 w-full border-collapse text-left text-[0.9375rem]">
              <thead className="sr-only">
                <tr>
                  <th scope="col">Localidad</th>
                  <th scope="col">Temperatura, humedad y viento</th>
                  <th scope="col">Riesgo</th>
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
                      {label}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p role="status" className="mt-3 text-[0.9375rem] text-a-mute">
              La lectura de Open-Meteo no está disponible en este momento.
            </p>
          )}

          <p className="mt-10 text-center tabular-nums text-[#e3f6dc]">
            <span className="font-[family-name:var(--font-display)] text-4xl">
              {fires ? nf(count) : "—"}
            </span>{" "}
            <span className="text-a-mute">focos en 24 h</span>
            <span aria-hidden className="mx-3 text-a-faint">
              ·
            </span>
            <span className="font-[family-name:var(--font-display)] text-4xl">
              {impact
                ? `${impact.failedChunks > 0 ? "≥ " : ""}${nf(impact.total)}`
                : "—"}
            </span>{" "}
            <span className="text-a-mute">en 90 días</span>
          </p>
        </section>

        <p className="mx-auto mt-12 max-w-3xl text-center text-[0.8125rem] leading-relaxed text-a-mute">
          Los focos de calor son datos satelitales preliminares, sin verificar
          en campo, y llegan con una demora de horas. Fuente:{" "}
          <a
            href="https://firms.modaps.eosdis.nasa.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className={link}
          >
            NASA FIRMS
            <span className="sr-only"> (se abre en una pestaña nueva)</span>
          </a>{" "}
          ({FIRMS_LABEL}), confianza media o alta.{" "}
          {impact?.failedChunks
            ? `Cifra de 90 días parcial: ${impact.failedChunks} de ${impact.totalChunks} períodos no respondieron, es un mínimo. `
            : ""}
          El contorno de Argentina está simplificado y puede errar cerca de la
          frontera.{" "}
          {readingTime && `Riesgo: lectura ${readingTime} (hora local). `}
          Índice ilustrativo propio (temperatura, humedad y viento), no es el
          FWI oficial. Datos meteorológicos:{" "}
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={link}
          >
            Open-Meteo
            <span className="sr-only"> (se abre en una pestaña nueva)</span>
          </a>{" "}
          (CC BY 4.0).
        </p>
      </div>
    </section>
  );
}
