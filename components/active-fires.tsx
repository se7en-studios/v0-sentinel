import { FireMapLazy } from "@/components/ui/fire-map-lazy";
import { FIRMS_LABEL, fetchFirmsCsv } from "@/lib/firms";
import {
  isInArgentina,
  isReliable,
  parseFirmsCsv,
  topByFrp,
  withinHours,
  type FirePoint,
} from "@/lib/landing-data/firms";
import {
  DataUnavailable,
  FAINT,
  GREEN_TEXT,
  INK,
  MUTED,
  RED_TEXT,
  SectionShell,
  Updated,
} from "@/components/data/data-section";

// Licensing note (team decision, not made here): NASA FIRMS data is open but
// asks for acknowledgement (done below). Keep the source link visible.

// ponytail: Latin America bounding box (west,south,east,north) — Mexico's
// northern border down to Cape Horn, wide enough to cover every country in
// data/latam-countries.json.
const LATAM_BBOX = "-118,-56,-34,33";
// FIRMS day_range=1 is only the current UTC day. Ask for 2 days and keep the
// real rolling 24 h window ourselves.
const DAY_RANGE = 2;
const WINDOW_HOURS = 24;
const MAP_ARGENTINA = 150; // map shows the strongest N in Argentina...
const MAP_REST = 100; // ...plus the strongest N elsewhere in the region
const LIST_ROWS = 10;
const ID = "focos-activos-title";

interface FiresResult {
  inArgentina: FirePoint[];
  elsewhere: FirePoint[];
  at: Date;
}

async function fetchActiveFires(): Promise<FiresResult | null> {
  const key = process.env.NASA_FIRMS_KEY;
  if (!key) return null;

  const csv = await fetchFirmsCsv(
    (source) =>
      `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${source}/${LATAM_BBOX}/${DAY_RANGE}`,
    { next: { revalidate: 3600 } },
  );
  if (csv === null) return null;

  const at = new Date();
  const recent = withinHours(
    parseFirmsCsv(csv).filter(isReliable),
    WINDOW_HOURS,
    at.getTime(),
  );
  return {
    inArgentina: recent.filter((p) => isInArgentina(p.lat, p.lng)),
    elsewhere: recent.filter((p) => !isInArgentina(p.lat, p.lng)),
    at,
  };
}

const utcTime = (p: FirePoint) => {
  const t = p.acqTime.padStart(4, "0");
  return `${p.acqDate} ${t.slice(0, 2)}:${t.slice(2)} UTC`;
};

export async function ActiveFires() {
  const data = await fetchActiveFires();

  if (data === null) {
    return (
      <DataUnavailable
        id={ID}
        title="Focos de calor, últimas 24 horas."
        what="La detección satelital de NASA FIRMS"
        minHeight={420}
      />
    );
  }

  const { inArgentina, elsewhere, at } = data;
  const mapPoints = [
    ...topByFrp(inArgentina, MAP_ARGENTINA),
    ...topByFrp(elsewhere, MAP_REST),
  ];
  const listed = topByFrp(inArgentina, LIST_ROWS);

  return (
    <SectionShell labelledBy={ID} minHeight={420}>
      <div className="flex items-center gap-2 mb-4">
        <span
          aria-hidden="true"
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "#b83a3a", boxShadow: "0 0 8px #b83a3a" }}
        />
        <span
          className="text-xs"
          style={{ fontFamily: "var(--font-sans)", color: FAINT }}
        >
          Satélite, ventana móvil de {WINDOW_HOURS} horas ·{" "}
          <Updated at={at} />
        </span>
      </div>
      <h2
        id={ID}
        className="text-4xl sm:text-5xl lg:text-6xl mb-4"
        style={{
          fontFamily: "var(--font-heading)",
          fontWeight: 800,
          color: INK,
          lineHeight: 1,
        }}
      >
        {inArgentina.length > 0 ? (
          <>
            {inArgentina.length.toLocaleString("es-AR")} focos{" "}
            <span style={{ color: RED_TEXT }}>de calor</span> en Argentina.
          </>
        ) : (
          <>
            Sin focos <span style={{ color: GREEN_TEXT }}>de calor</span>{" "}
            detectados en Argentina.
          </>
        )}
      </h2>
      <p
        className="text-sm mb-10 max-w-xl"
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: 400,
          color: MUTED,
        }}
      >
        Detecciones satelitales VIIRS de las últimas {WINDOW_HOURS} horas
        (confianza media o alta), más {elsewhere.length.toLocaleString("es-AR")}{" "}
        en el resto de Latinoamérica. El mapa muestra los de mayor intensidad
        de Argentina y de la región. Son focos de calor, no necesariamente
        incendios forestales. Es la misma clase de dato que un sistema como el
        nuestro procesa y verifica; los satélites reportan con una demora de
        horas.
      </p>

      <div
        role="group"
        aria-label="Mapa de focos de calor en Latinoamérica"
        aria-describedby={`${ID}-desc`}
        className="rounded-lg p-4"
        style={{ border: "0.5px solid rgba(26,24,18,0.12)" }}
      >
        <p id={`${ID}-desc`} className="sr-only">
          Mapa interactivo con los focos de mayor intensidad de las últimas{" "}
          {WINDOW_HOURS} horas. Los puntos del mapa no son operables con
          teclado; la tabla debajo del mapa contiene el mismo dato en texto.
        </p>
        <FireMapLazy points={mapPoints} />
      </div>

      {listed.length > 0 && (
        <details className="mt-4 text-sm" style={{ color: MUTED }}>
          <summary
            className="cursor-pointer font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b6b44]"
            style={{ fontFamily: "var(--font-sans)", color: INK }}
          >
            Ver los {listed.length} focos más intensos de Argentina (tabla)
          </summary>
          <div className="overflow-x-auto mt-3">
            <table
              className="w-full text-left text-xs"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              <caption className="sr-only">
                Focos de calor más intensos en Argentina, últimas{" "}
                {WINDOW_HOURS} horas
              </caption>
              <thead>
                <tr style={{ color: INK }}>
                  <th scope="col" className="py-1.5 pr-4">Detección</th>
                  <th scope="col" className="py-1.5 pr-4">Latitud</th>
                  <th scope="col" className="py-1.5 pr-4">Longitud</th>
                  <th scope="col" className="py-1.5">Potencia (MW)</th>
                </tr>
              </thead>
              <tbody>
                {listed.map((p, i) => (
                  <tr
                    key={i}
                    style={{ borderTop: "0.5px solid rgba(26,24,18,0.12)" }}
                  >
                    <td className="py-1.5 pr-4 tabular-nums">{utcTime(p)}</td>
                    <td className="py-1.5 pr-4 tabular-nums">
                      {p.lat.toFixed(2)}
                    </td>
                    <td className="py-1.5 pr-4 tabular-nums">
                      {p.lng.toFixed(2)}
                    </td>
                    <td className="py-1.5 tabular-nums">{p.frp.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      <p
        className="text-xs mt-4"
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
        ({FIRMS_LABEL}). Datos preliminares, no verificados en campo. El
        recuento de Argentina usa un contorno simplificado del país: puede
        errar cerca de la frontera.
      </p>
    </SectionShell>
  );
}
