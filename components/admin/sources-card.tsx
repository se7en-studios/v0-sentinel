"use client";

import { Badge, Card } from "./ui";
import type { Ctx } from "./ctx";

const artTime = (ms: number) =>
  new Date(ms).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

const ageLabel = (ms: number, now: number) => {
  const min = Math.max(0, Math.round((now - ms) / 60_000));
  if (min < 90) return `${min} min`;
  const h = min / 60;
  return h < 48 ? `${h.toFixed(1).replace(".", ",")} h` : `${Math.round(h / 24)} d`;
};

/** What each feed contributed and how old its newest acquisition is: the point of having several satellites. */
const LICENSES: { name: string; text: string }[] = [
  {
    name: "NASA FIRMS · MODIS (Terra, Aqua) y VIIRS (NOAA-20, NOAA-21)",
    text: "Productos de incendios activos de NASA LANCE / EOSDIS en tiempo casi real. NASA y NOAA no avalan ni respaldan este producto.",
  },
  {
    name: "NOAA GOES-19 (ABI Fire/Hot Spot)",
    text: "Satélite geoestacionario de NOAA, accedido a través de NASA FIRMS y de INPE. NOAA no avala ni respalda este producto.",
  },
  {
    name: "INPE · Programa Queimadas",
    text: "Focos de calor de GOES-19 para Sudamérica publicados cada 10 minutos como datos abiertos. INPE no avala ni respalda este producto.",
  },
  {
    name: "Copernicus DEM GLO-30",
    text: "Modelo de elevación del programa Copernicus (UE/ESA), servido por AWS Open Data. Se usa para calcular elevación, pendiente y exposición; no se redistribuye. La UE y la ESA no avalan este producto.",
  },
  {
    name: "ESA WorldCover 10 m (2021)",
    text: "Cobertura del suelo de ESA bajo licencia CC BY 4.0, derivada de Sentinel-1 y Sentinel-2. Se consulta por punto para indicar el combustible; los resultados son datos procesados respecto de la fuente original.",
  },
  {
    name: "Open-Meteo",
    text: "Clima y pronóstico bajo CC BY 4.0 (open-meteo.com).",
  },
  {
    name: "Mapas base",
    text: "OpenFreeMap y © OpenStreetMap contributors (ODbL), Esri World Imagery y World Topo, Sentinel-2 sin nubes de EOX (© Copernicus, modificado), CARTO, NASA GIBS y relieve Terrarium sobre AWS Terrain Tiles.",
  },
];

export function SourcesCard({ ctx }: { ctx: Ctx }) {
  const { sources, now, earlyError, firesError } = ctx;
  const rows = [...sources].sort((a, b) => (b.newestAt ?? 0) - (a.newestAt ?? 0));
  const newestGoes = Math.max(0, ...sources.filter((s) => s.id.startsWith("goes")).map((s) => s.newestAt ?? 0));
  const newestPolar = Math.max(0, ...sources.filter((s) => !s.id.startsWith("goes")).map((s) => s.newestAt ?? 0));
  return (
    <Card title="Fuentes satelitales" right={<Badge tone="muted">{rows.length} fuentes</Badge>}>
      {newestGoes > 0 && newestPolar > 0 && (
        <p className="mb-3 text-[12px] leading-snug text-foreground/70">
          El dato más reciente de GOES-19 tiene{" "}
          <b>{ageLabel(newestGoes, now)}</b>; el de los satélites polares,{" "}
          <b>{ageLabel(newestPolar, now)}</b>. Por eso combinamos los dos.
        </p>
      )}
      {rows.length === 0 ? (
        <p className="text-[12px] text-foreground/55">
          {firesError ?? earlyError ?? "Todavía no hay datos de satélites."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[460px] text-left text-[12px]">
            <caption className="sr-only">Estado de cada fuente satelital</caption>
            <thead className="text-[10px] uppercase tracking-[0.08em] text-foreground/45">
              <tr>
                <th scope="col" className="py-1 pr-3 font-semibold">Fuente</th>
                <th scope="col" className="py-1 pr-3 font-semibold">Estado</th>
                <th scope="col" className="py-1 pr-3 text-right font-semibold">Focos</th>
                <th scope="col" className="py-1 pr-3 font-semibold">Último dato (ART)</th>
                <th scope="col" className="py-1 text-right font-semibold">Antigüedad</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-t border-[var(--hairline)]">
                  <th scope="row" className="py-1.5 pr-3 font-medium">{s.label}</th>
                  <td className="py-1.5 pr-3">
                    <Badge tone={s.ok ? "ok" : "fire"}>{s.ok ? "activa" : "sin respuesta"}</Badge>
                  </td>
                  <td className="num py-1.5 pr-3 text-right">{s.count.toLocaleString("es-AR")}</td>
                  <td className="num py-1.5 pr-3">{s.newestAt ? artTime(s.newestAt) : "—"}</td>
                  <td className="num py-1.5 text-right">{s.newestAt ? ageLabel(s.newestAt, now) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <details className="mt-3 text-[11.5px] text-foreground/65">
        <summary className="cursor-pointer font-medium text-foreground/80">
          Fuentes de datos y licencias
        </summary>
        <p className="mt-2 leading-snug">
          Sentinel usa datos satelitales y geoespaciales de fuentes públicas,
          los procesa para generar alertas y análisis propios, y los usa
          conforme a las condiciones de cada proveedor. Su uso no implica
          afiliación ni respaldo de los organismos que los producen.
        </p>
        <ul className="mt-2 space-y-1.5">
          {LICENSES.map((l) => (
            <li key={l.name}>
              <b className="text-foreground/80">{l.name}.</b> {l.text}
            </li>
          ))}
        </ul>
      </details>
    </Card>
  );
}
