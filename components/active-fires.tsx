import { FireMapLazy } from "@/components/ui/fire-map-lazy";
import { FIRMS_LABEL, fetchFirmsCsv } from "@/lib/firms";

// ponytail: Latin America bounding box (west,south,east,north) — Mexico's
// northern border down to Cape Horn, wide enough to cover every country in
// data/latam-countries.json.
const LATAM_BBOX = "-118,-56,-34,33";
const DAY_RANGE = 1;

interface FirePoint {
  lat: number;
  lng: number;
  confidence: string;
  acqDate: string;
  acqTime: string;
  frp: number;
}

function parseCsv(csv: string): FirePoint[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].split(",");
  const idx = (name: string) => header.indexOf(name);
  const latI = idx("latitude");
  const lngI = idx("longitude");
  const confI = idx("confidence");
  const dateI = idx("acq_date");
  const timeI = idx("acq_time");
  const frpI = idx("frp");
  if (latI === -1 || lngI === -1) return [];

  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    return {
      lat: parseFloat(cols[latI]),
      lng: parseFloat(cols[lngI]),
      confidence: confI !== -1 ? cols[confI] : "",
      acqDate: dateI !== -1 ? cols[dateI] : "",
      acqTime: timeI !== -1 ? cols[timeI] : "",
      frp: frpI !== -1 ? parseFloat(cols[frpI]) : 0,
    };
  });
}

async function fetchActiveFires(): Promise<FirePoint[] | null> {
  const key = process.env.NASA_FIRMS_KEY;
  if (!key) return null;

  const csv = await fetchFirmsCsv(
    (source) =>
      `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${source}/${LATAM_BBOX}/${DAY_RANGE}`,
    { next: { revalidate: 3600 } },
  );
  return csv === null ? null : parseCsv(csv);
}

export async function ActiveFires() {
  const fires = await fetchActiveFires();

  // ponytail: no key configured yet -> render nothing rather than a broken
  // section. Set NASA_FIRMS_KEY (from firms.modaps.eosdis.nasa.gov/api/map_key)
  // as an env var to turn this on.
  if (fires === null) return null;

  const highConfidence = fires.filter((f) => f.confidence !== "l");
  const sorted = [...highConfidence]
    .sort((a, b) => b.frp - a.frp)
    .slice(0, 200);

  return (
    <section
      className="relative py-20 lg:py-24 overflow-hidden"
      style={{ background: "#faf7f0" }}
    >
      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-10">
        <div className="flex items-center gap-2 mb-4">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#b83a3a", boxShadow: "0 0 8px #b83a3a" }}
          />
          <span
            className="text-[11px]"
            style={{
              fontFamily: "var(--font-sans)",
              color: "rgba(26,24,18,0.35)",
            }}
          >
            Satélite, últimas 24 horas
          </span>
        </div>
        <h2
          className="text-4xl sm:text-5xl lg:text-6xl mb-4"
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 800,
            color: "rgba(26,24,18,0.92)",
            lineHeight: 1,
          }}
        >
          {sorted.length > 0 ? (
            <>
              {sorted.length} focos{" "}
              <span style={{ color: "#b83a3a" }}>activos</span> hoy.
            </>
          ) : (
            <>
              Sin focos <span style={{ color: "#0f7a4f" }}>activos</span> hoy.
            </>
          )}
        </h2>
        <p
          className="text-[13px] mb-10 max-w-xl"
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 300,
            color: "rgba(26,24,18,0.4)",
          }}
        >
          Detecciones satelitales VIIRS de la NASA (FIRMS) en toda
          Latinoamérica, la misma clase de dato que un sistema como el nuestro
          procesa y verifica en minutos, no en horas. Tocá un foco para ver el
          detalle, o elegí un país para recorrer la región.
        </p>

        <div
          className="rounded-lg p-4"
          style={{ border: "0.5px solid rgba(26,24,18,0.07)" }}
        >
          <FireMapLazy
            points={sorted.map((f) => ({
              lat: f.lat,
              lng: f.lng,
              confidence: f.confidence,
              acqDate: f.acqDate,
              acqTime: f.acqTime,
              frp: f.frp,
            }))}
          />
        </div>

        <p
          className="text-[10px] mt-4"
          style={{
            fontFamily: "var(--font-sans)",
            color: "rgba(26,24,18,0.42)",
          }}
        >
          Fuente: NASA FIRMS ({FIRMS_LABEL}). Datos preliminares, no
          verificados en campo.
        </p>
      </div>
    </section>
  );
}
