import { Wind, Droplets, Thermometer } from "lucide-react";
import { PatagoniaRiskMapLazy } from "@/components/ui/patagonia-risk-map-lazy";
import {
  RISK_RANK,
  RISK_STYLE,
  riskLabel,
  type RiskLabel,
} from "@/lib/landing-data/risk";
import {
  DataUnavailable,
  FAINT,
  GREEN_TEXT,
  INK,
  MUTED,
  SectionShell,
} from "@/components/data/data-section";

// Licensing note (team decision, not made here): the free Open-Meteo API is
// for non-commercial use only; a commercial site needs their paid plan and
// CC BY 4.0 attribution (link kept in the footer note below).

// ponytail: kept in sync with RISK_EXPLAIN in patagonia-risk-map.tsx —
// duplicated rather than imported since that component is a client boundary
// and re-exporting plain constants across it doesn't resolve reliably here.
const RISK_EXPLAIN: Record<RiskLabel, string> = {
  Bajo: "Condiciones tranquilas, riesgo bajo de que un fuego se propague.",
  Moderado: "Vigilar: condiciones que podrían favorecer un incendio.",
  Alto: "Un incendio se propagaría rápido en estas condiciones.",
  Extremo: "Alerta: condiciones muy peligrosas para incendios forestales.",
};

export interface Location {
  name: string;
  province: string;
  lat: number;
  lon: number;
}

export const locations: Location[] = [
  { name: "Bariloche", province: "Río Negro", lat: -41.1335, lon: -71.3103 },
  { name: "El Bolsón", province: "Río Negro", lat: -41.9667, lon: -71.5333 },
  {
    name: "San Martín de los Andes",
    province: "Neuquén",
    lat: -40.1576,
    lon: -71.3468,
  },
  { name: "Esquel", province: "Chubut", lat: -42.9083, lon: -71.3197 },
];

export interface Reading {
  location: Location;
  temperature: number;
  humidity: number;
  windSpeed: number;
  time: string; // Open-Meteo local time of the reading, e.g. 2026-10-26T14:15
}

const ID = "riesgo-title";

export async function fetchReading(location: Location): Promise<Reading | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=auto`;
    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      location,
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      time: String(data.current.time ?? ""),
    };
  } catch {
    return null;
  }
}

function Badge({ label }: { label: RiskLabel }) {
  const { color, text } = RISK_STYLE[label];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs uppercase font-semibold tracking-wider"
      style={{
        background: `${color}25`,
        border: `0.5px solid ${text}55`,
        color: text,
        fontFamily: "var(--font-sans)",
      }}
    >
      <span
        aria-hidden="true"
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

const METRICS = [
  { icon: Thermometer, name: "Temperatura", unit: "°C", key: "temperature" },
  { icon: Droplets, name: "Humedad", unit: "%", key: "humidity" },
  { icon: Wind, name: "Viento", unit: " km/h", key: "windSpeed" },
] as const;

export async function FireRiskIndex() {
  const readings = (await Promise.all(locations.map(fetchReading))).filter(
    (r): r is Reading => r !== null,
  );

  if (readings.length === 0) {
    return (
      <DataUnavailable
        id={ID}
        title="Riesgo de incendio en la Patagonia."
        what="La lectura meteorológica de Open-Meteo"
        minHeight={520}
        max="max-w-7xl"
      />
    );
  }

  const missing = locations.length - readings.length;
  const rows = readings.map((r) => ({ r, label: riskLabel(r) }));
  const points = rows.map(({ r, label }) => ({
    name: r.location.name,
    province: r.location.province,
    lat: r.location.lat,
    lon: r.location.lon,
    color: RISK_STYLE[label].color,
    label,
    temperature: r.temperature,
    humidity: r.humidity,
    windSpeed: r.windSpeed,
  }));
  const overall = rows.reduce((w, x) =>
    RISK_RANK[x.label] > RISK_RANK[w.label] ? x : w,
  ).label;
  const readingTime = readings[0].time.replace("T", " ").slice(0, 16);

  return (
    <SectionShell labelledBy={ID} minHeight={520} max="max-w-7xl">
      <div className="flex items-center gap-2 mb-5">
        <span
          aria-hidden="true"
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "#0f7a4f", boxShadow: "0 0 8px #0f7a4f" }}
        />
        <p
          className="text-xs tracking-[0.2em] uppercase"
          style={{ fontFamily: "var(--font-sans)", color: FAINT }}
        >
          Lectura de {readingTime} (hora local)
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <h2
          id={ID}
          className="text-4xl sm:text-5xl lg:text-6xl"
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 800,
            color: INK,
            lineHeight: 1,
          }}
        >
          Riesgo de incendio, <span style={{ color: GREEN_TEXT }}>ahora.</span>
        </h2>
        <div className="mb-1 inline-flex items-center gap-2">
          <span
            className="text-xs"
            style={{ fontFamily: "var(--font-sans)", color: MUTED }}
          >
            Patagonia:
          </span>
          <Badge label={overall} />
        </div>
      </div>
      <p
        className="text-sm mb-10 max-w-xl"
        style={{ fontFamily: "var(--font-sans)", color: MUTED }}
      >
        Índice estimado a partir de temperatura, humedad y viento de la última
        lectura, la misma clase de variables que alimenta nuestros modelos de
        detección.{" "}
        <strong style={{ color: INK, fontWeight: 500 }}>
          {RISK_EXPLAIN[overall]}
        </strong>{" "}
        Tocá un punto del mapa para ver el detalle de cada localidad.
        {missing > 0 &&
          ` Sin datos de ${missing} de ${locations.length} localidades en este momento.`}
      </p>

      <div
        role="group"
        aria-label="Mapa de riesgo estimado por localidad de la Patagonia"
        aria-describedby={`${ID}-desc`}
        className="max-w-xl mx-auto mb-10 rounded-lg p-4"
        style={{ border: "0.5px solid rgba(26,24,18,0.12)" }}
      >
        <p id={`${ID}-desc`} className="sr-only">
          Mapa con las localidades monitoreadas. Los puntos del mapa no son
          operables con teclado; la tabla o las tarjetas de abajo tienen el
          mismo dato en texto.
        </p>
        <PatagoniaRiskMapLazy points={points} />
      </div>

      {/* Mobile: one compact table (~230 px) instead of four stacked cards. */}
      <div className="sm:hidden overflow-x-auto">
        <table
          className="w-full text-left text-sm"
          style={{ fontFamily: "var(--font-sans)", color: INK }}
        >
          <caption className="sr-only">
            Riesgo estimado, temperatura, humedad y viento por localidad
          </caption>
          <thead>
            <tr style={{ color: MUTED }} className="text-xs">
              <th scope="col" className="py-2 pr-3 font-medium">
                Localidad
              </th>
              <th scope="col" className="py-2 pr-3 font-medium">
                Riesgo
              </th>
              <th scope="col" className="py-2 pr-3 font-medium">
                Temp.
              </th>
              <th scope="col" className="py-2 pr-3 font-medium">
                Hum.
              </th>
              <th scope="col" className="py-2 font-medium">
                Viento
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ r, label }) => (
              <tr
                key={r.location.name}
                style={{ borderTop: "0.5px solid rgba(26,24,18,0.14)" }}
              >
                <th scope="row" className="py-2.5 pr-3 font-semibold">
                  {r.location.name}
                  <span
                    className="block text-xs font-normal"
                    style={{ color: FAINT }}
                  >
                    {r.location.province}
                  </span>
                </th>
                <td className="py-2.5 pr-3">
                  <Badge label={label} />
                </td>
                <td className="py-2.5 pr-3 tabular-nums">
                  {Math.round(r.temperature)}°C
                </td>
                <td className="py-2.5 pr-3 tabular-nums">
                  {Math.round(r.humidity)}%
                </td>
                <td className="py-2.5 tabular-nums">
                  {Math.round(r.windSpeed)} km/h
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {rows.map(({ r, label }) => (
          <div
            key={r.location.name}
            className="relative overflow-hidden rounded-lg border-[0.5px] border-[rgba(26,24,18,0.14)] p-6"
            style={{ background: "rgba(26,24,18,0.02)" }}
          >
            <div
              aria-hidden="true"
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: RISK_STYLE[label].text, opacity: 0.6 }}
            />
            <div className="flex items-start justify-between gap-2 mb-4">
              <div>
                <p
                  className="text-[15px] mb-0.5 font-semibold"
                  style={{ fontFamily: "var(--font-heading)", color: INK }}
                >
                  {r.location.name}
                </p>
                <p
                  className="text-xs"
                  style={{ fontFamily: "var(--font-sans)", color: FAINT }}
                >
                  {r.location.province}
                </p>
              </div>
              <Badge label={label} />
            </div>

            <dl className="space-y-2.5 pt-3 border-t border-[rgba(26,24,18,0.1)]">
              {METRICS.map(({ icon: Icon, name, unit, key }) => (
                <div
                  key={key}
                  className="flex items-center justify-between text-xs"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  <dt
                    className="flex items-center gap-2"
                    style={{ color: MUTED }}
                  >
                    <Icon aria-hidden="true" className="w-3.5 h-3.5" />
                    {name}
                  </dt>
                  <dd
                    className="font-medium tabular-nums"
                    style={{ color: INK }}
                  >
                    {Math.round(r[key])}
                    {unit}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <p
        className="text-xs mt-6"
        style={{ fontFamily: "var(--font-sans)", color: FAINT }}
      >
        Fuente:{" "}
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Open-Meteo
        </a>{" "}
        (CC BY 4.0), lectura actual de cada localidad, actualizada cada 15
        minutos. Índice ilustrativo propio (no es el FWI oficial); no reemplaza
        el sistema de detección de Sentinel.
      </p>
    </SectionShell>
  );
}
