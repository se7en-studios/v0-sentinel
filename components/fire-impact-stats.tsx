import { Flame, MapPin, Satellite } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { FIRMS_LABEL, fetchFirmsCsv } from "@/lib/firms";
import {
  isInArgentina,
  isReliable,
  parseFirmsCsv,
} from "@/lib/landing-data/firms";
import {
  DataUnavailable,
  FAINT,
  INK,
  MUTED,
  RED_TEXT,
  SectionShell,
  Updated,
} from "@/components/data/data-section";

// ponytail: Argentina bounding box (west,south,east,north) used only to limit
// the request; every row is then checked against the country polygon.
const ARG_BBOX = "-73,-55,-53,-21";
const CHUNK_DAYS = 5;
const WINDOW_DAYS = 90;
const ID = "cifras-argentina-title";

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

// null = the chunk failed (not zero detections).
async function fetchChunkCount(
  key: string,
  startDate: string,
): Promise<number | null> {
  const csv = await fetchFirmsCsv(
    (source) =>
      `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${source}/${ARG_BBOX}/${CHUNK_DAYS}/${startDate}`,
    { next: { revalidate: 86400 } },
  );
  if (csv === null) return null;
  return parseFirmsCsv(csv).filter(
    (p) => isReliable(p) && isInArgentina(p.lat, p.lng),
  ).length;
}

export interface Impact {
  total: number;
  coveredDays: number;
  failedChunks: number;
  totalChunks: number;
  from: string;
  to: string;
  at: Date;
}

export async function fetchImpact(): Promise<Impact | null> {
  const key = process.env.NASA_FIRMS_KEY;
  if (!key) return null;

  const today = new Date();
  const starts: Date[] = [];
  for (let offset = WINDOW_DAYS; offset > 0; offset -= CHUNK_DAYS) {
    const d = new Date(today);
    d.setDate(d.getDate() - offset);
    starts.push(d);
  }
  const counts = await Promise.all(
    starts.map((d) => fetchChunkCount(key, isoDate(d))),
  );
  const ok = counts.filter((n): n is number => n !== null);
  if (ok.length === 0) return null;

  const end = new Date(starts[starts.length - 1]);
  end.setDate(end.getDate() + CHUNK_DAYS - 1);
  return {
    total: ok.reduce((s, n) => s + n, 0),
    coveredDays: ok.length * CHUNK_DAYS,
    failedChunks: counts.length - ok.length,
    totalChunks: counts.length,
    from: isoDate(starts[0]),
    to: isoDate(end),
    at: new Date(),
  };
}

export async function FireImpactStats() {
  const impact = await fetchImpact();

  if (impact === null) {
    return (
      <DataUnavailable
        id={ID}
        title="Detecciones de calor en Argentina, últimos 90 días."
        what="La serie histórica de NASA FIRMS"
        minHeight={360}
        max="max-w-5xl"
      />
    );
  }

  const isPartial = impact.failedChunks > 0;
  const stats = [
    {
      icon: Flame,
      value: impact.total,
      label: `Detecciones satelitales de calor dentro de Argentina (${impact.from} a ${impact.to})${isPartial ? ", dato parcial" : ""}`,
    },
    {
      icon: MapPin,
      value: Math.round(impact.total / impact.coveredDays),
      label: "Promedio de detecciones por día en ese período",
    },
  ];

  return (
    <SectionShell labelledBy={ID} minHeight={360} max="max-w-5xl">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(184,58,58,0.08) 0%, transparent 60%)",
        }}
      />
      <div className="flex items-center gap-2 mb-4">
        <Satellite
          aria-hidden="true"
          className="w-3.5 h-3.5"
          style={{ color: RED_TEXT }}
        />
        <span
          className="text-xs"
          style={{ fontFamily: "var(--font-sans)", color: FAINT }}
        >
          Datos satelitales NASA FIRMS · <Updated at={impact.at} />
        </span>
      </div>
      <h2
        id={ID}
        className="text-3xl sm:text-4xl lg:text-5xl mb-10 max-w-2xl"
        style={{
          fontFamily: "var(--font-heading)",
          fontWeight: 800,
          color: INK,
          lineHeight: 1.1,
        }}
      >
        Detecciones de calor en Argentina, últimos {WINDOW_DAYS} días.
      </h2>

      {isPartial && (
        <p
          role="status"
          className="text-sm mb-6 max-w-xl"
          style={{ fontFamily: "var(--font-sans)", color: RED_TEXT }}
        >
          Dato parcial: {impact.failedChunks} de {impact.totalChunks} períodos
          de {CHUNK_DAYS} días no respondieron. La cifra es un mínimo; el
          promedio diario usa solo los períodos disponibles.
        </p>
      )}

      <div
        className="grid sm:grid-cols-2 gap-px"
        style={{ background: "rgba(26,24,18,0.08)" }}
      >
        {stats.map((stat, i) => (
          <div
            key={i}
            className="flex flex-col items-start p-8"
            style={{ background: "#faf7f0", minHeight: 220 }}
          >
            <div
              aria-hidden="true"
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-5"
              style={{
                background: "rgba(184,58,58,0.1)",
                border: "0.5px solid rgba(184,58,58,0.3)",
              }}
            >
              <stat.icon className="w-5 h-5" style={{ color: RED_TEXT }} />
            </div>
            <div
              className="text-4xl sm:text-5xl font-extrabold mb-2 tabular-nums"
              style={{ fontFamily: "var(--font-heading)", color: RED_TEXT }}
            >
              {isPartial && "≥ "}
              <AnimatedNumber value={stat.value} />
            </div>
            <p
              className="text-sm leading-snug max-w-[300px]"
              style={{ fontFamily: "var(--font-sans)", color: MUTED }}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <p
        className="text-xs mt-6"
        style={{ fontFamily: "var(--font-sans)", color: FAINT }}
      >
        Fuente:{" "}
        <a
          href="https://firms.modaps.eosdis.nasa.gov/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          NASA FIRMS
        </a>{" "}
        ({FIRMS_LABEL}), detecciones de confianza media o alta dentro del
        contorno de Argentina (simplificado: puede errar cerca de la
        frontera). Datos preliminares, no verificados en campo; no distinguen
        incendios forestales de otras fuentes de calor (quemas agrícolas,
        etc.).
      </p>
    </SectionShell>
  );
}
