import { FIRMS_LABEL } from "../firms";
import type { EarlyView } from "./early";
import { INCIDENT_STATUS_LABEL, type IncidentChange, type IncidentStatus } from "./incident-meta";
import type { FirePoint } from "./types";

export const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ] as string,
  );

function download(name: string, mime: string, body: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([body], { type: mime }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

export function downloadDataUrl(name: string, dataUrl: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = name;
  a.click();
}

export function downloadFiresCsv(points: FirePoint[], days: string[]) {
  const rows = points.map((p) => {
    const hh = String(p[5]).padStart(4, "0");
    return [
      days[p[4]],
      `${hh.slice(0, 2)}:${hh.slice(2)}`,
      p[0],
      p[1],
      p[2],
      ["baja", "nominal", "alta"][p[3]],
      p[6] ? "noche" : "dia",
    ].join(",");
  });
  const csv = [
    "fecha_utc,hora_utc,lat,lng,frp_mw,confianza,momento",
    ...rows,
  ].join("\n");
  download(
    `sentinel-focos-${new Date().toISOString().slice(0, 10)}.csv`,
    "text/csv;charset=utf-8",
    csv,
  );
}

const REPORT_CSS = `body{font:14px/1.5 Inter,system-ui,sans-serif;color:#1a1812;max-width:760px;margin:32px auto;padding:0 20px}
h1{font-size:22px;margin:0}h2{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#0f7a4f;margin:26px 0 8px}
.k{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.k div{border:1px solid #ddd;border-radius:8px;padding:10px}
.k b{display:block;font-size:20px}table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #e5e0d3;padding:6px 4px;text-align:left}
small{color:#777}@media print{button{display:none}}`;

export interface ReportData {
  org: string;
  stats: { total: number; last24: number; frp: number; hectares: number };
  zones: { name: string; area: string; recent: number; total: number }[];
  clusters: { text: string; count: number; frp: number }[];
  exposure: string | null;
  mapImage?: string | null;
  /** Optional: enables the "Evidencia" section (detections of the 10-day window). */
  fires?: { points: FirePoint[]; days: string[] };
  /** Optional override for the generation time (tests). */
  generatedAt?: Date;
}

export interface Evidence {
  first: Date | null;
  newest: Date | null;
  perDay: { day: string; count: number }[];
}

/** FirePoint day index + hhmm (UTC) -> instant. */
const detectionTime = (p: FirePoint, days: string[]): Date | null => {
  const hh = String(p[5]).padStart(4, "0");
  const t = Date.parse(`${days[p[4]]}T${hh.slice(0, 2)}:${hh.slice(2)}:00Z`);
  return Number.isFinite(t) ? new Date(t) : null;
};

/** First / newest detection and per-day counts. Points with an unknown day are ignored. */
export function summarizeEvidence(points: FirePoint[], days: string[]): Evidence {
  const counts = new Map<string, number>();
  let first: Date | null = null;
  let newest: Date | null = null;
  for (const p of points) {
    const t = detectionTime(p, days);
    if (!t) continue;
    counts.set(days[p[4]], (counts.get(days[p[4]]) ?? 0) + 1);
    if (!first || t < first) first = t;
    if (!newest || t > newest) newest = t;
  }
  const perDay = [...counts].map(([day, count]) => ({ day, count })).sort((a, b) => a.day.localeCompare(b.day));
  return { first, newest, perDay };
}

/** "21/10/2026, 12:04 (hora de Argentina)" */
export const fmtArgentina = (d: Date): string =>
  `${new Intl.DateTimeFormat("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "short", timeStyle: "short", hourCycle: "h23" }).format(d)} (hora de Argentina)`;

export function evidenceHtml(ev: Evidence | null, generatedAt: Date): string {
  const when = (d: Date | null) => (d ? esc(fmtArgentina(d)) : "sin detecciones");
  const days = ev?.perDay.length
    ? `<table><tr><th>Día (UTC)</th><th>Detecciones</th></tr>${ev.perDay.map((r) => `<tr><td>${esc(r.day)}</td><td>${r.count}</td></tr>`).join("")}</table>`
    : "";
  return `<h2>Evidencia</h2>
<ul><li>Primera detección: ${when(ev?.first ?? null)}</li><li>Detección más reciente: ${when(ev?.newest ?? null)}</li><li>Fuente: NASA FIRMS (${esc(FIRMS_LABEL)})</li><li>Informe generado: ${esc(fmtArgentina(generatedAt))}</li></ul>${days}
<p><small>Descargo: las detecciones satelitales son indicios térmicos, no confirmación de incendio; pueden incluir calor industrial o falsos positivos y tienen demora respecto del paso del satélite. La hora de cada detección es la del paso satelital (UTC), convertida a hora de Argentina. Verificar en terreno antes de actuar.</small></p>`;
}

/** Opens a print-ready page; the user saves it as PDF from the print dialog. */
export function printReport(d: ReportData) {
  const w = window.open("", "_blank");
  if (!w) return false;
  const rows = d.zones
    .map(
      (z) =>
        `<tr><td>${esc(z.name)}</td><td>${esc(z.area)}</td><td>${esc(String(z.recent))}</td><td>${esc(String(z.total))}</td></tr>`,
    )
    .join("");
  const cl = d.clusters
    .map((c) => `<li>${esc(c.text)} · ${esc(String(c.count))} focos · ${esc(String(c.frp))} MW</li>`)
    .join("");
  const generatedAt = d.generatedAt ?? new Date();
  const evidence = evidenceHtml(d.fires ? summarizeEvidence(d.fires.points, d.fires.days) : null, generatedAt);
  w.document
    .write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Reporte Sentinel</title>
<style>${REPORT_CSS}</style></head><body>
<button onclick="print()" style="float:right;padding:8px 14px">Imprimir / guardar PDF</button>
<h1>Reporte de monitoreo · ${esc(d.org)}</h1><small>Generado ${esc(fmtArgentina(generatedAt))} · Sentinel Cloud</small>
${d.mapImage && /^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(d.mapImage) ? `<img src="${d.mapImage}" alt="Mapa" style="width:100%;border-radius:8px;margin-top:14px">` : ""}
<h2>Resumen satelital (Argentina, 10 días)</h2>
<div class="k"><div><b>${esc(String(d.stats.last24))}</b>focos 24 h</div><div><b>${esc(String(d.stats.total))}</b>focos 10 días</div><div><b>${esc(String(d.stats.frp))} MW</b>potencia total</div><div><b>${esc(String(d.stats.hectares))} ha</b>superficie est. (cota sup.)</div></div>
<h2>Zonas monitoreadas</h2>${rows ? `<table><tr><th>Zona</th><th>Superficie</th><th>Focos 48 h</th><th>Focos 10 d</th></tr>${rows}</table>` : "<p>Sin zonas definidas.</p>"}
${d.exposure ? `<h2>Exposición</h2><p>${esc(d.exposure)}</p>` : ""}
<h2>Concentraciones principales</h2><ul>${cl || "<li>Sin concentraciones relevantes.</li>"}</ul>
${evidence}
<p><small>Fuentes: NASA FIRMS (${esc(FIRMS_LABEL)} NRT), Open-Meteo, Esri/Sentinel-2 como base. La superficie estimada es una cota superior (≈14 ha por detección). Las predicciones de propagación son demostrativas.</small></p>
</body></html>`);
  w.document.close();
  return true;
}

/** Pre-filled WhatsApp / email links for an alert (no backend needed). */
export function alertLinks(text: string, whatsapp: string, email: string) {
  const digits = whatsapp.replace(/\D/g, "");
  return {
    whatsapp: `https://wa.me/${digits}?text=${encodeURIComponent(text)}`,
    email: `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("Alerta Sentinel")}&body=${encodeURIComponent(text)}`,
  };
}

export const mapsLink = (lng: number, lat: number) =>
  `https://www.google.com/maps?q=${lat.toFixed(5)},${lng.toFixed(5)}`;

// ---- incident report ----

export interface IncidentReportData {
  org: string;
  place: string;
  lat: number;
  lng: number;
  count: number;
  frp: number;
  area: string;
  daysActive: number;
  status: IncidentStatus | null;
  assignee: string;
  /** one-line terrain/fuel summary, null when it could not be read */
  terrain: string | null;
  /** early detections near the incident */
  early: EarlyView[];
  history: IncidentChange[];
  generatedAt?: Date;
}

const KM_LAT = 111.32;
/** early detections within this distance of the incident centre are treated as the same event */
export const EARLY_NEAR_KM = 8;

/** Early detections (GOES-19) within `radiusKm` of a point; noise (industrial heat) is left out. */
export function earlyNearby(early: EarlyView[], lat: number, lng: number, radiusKm = EARLY_NEAR_KM): EarlyView[] {
  return early.filter((e) => {
    if (e.status === "noise") return false;
    const dy = (e.lat - lat) * KM_LAT;
    const dx = (e.lng - lng) * KM_LAT * Math.cos((lat * Math.PI) / 180);
    return Math.hypot(dx, dy) <= radiusKm;
  });
}

/** Minutes GOES-19 saw it before the polar satellite confirmed it; only when it was confirmed after the first scan. */
export function leadMinutes(e: Pick<EarlyView, "firstAt" | "confirmedAt">): number | null {
  if (e.confirmedAt === undefined || e.confirmedAt <= e.firstAt) return null;
  return Math.round((e.confirmedAt - e.firstAt) / 60_000);
}

const fmtMin = (m: number) => (m < 120 ? `${m} min` : `${(m / 60).toFixed(1).replace(".", ",")} h`);

/** "Terreno", "Alerta temprana" and "Línea de tiempo" sections; the caller escapes nothing, this does. */
export function incidentExtrasHtml(d: Pick<IncidentReportData, "terrain" | "early" | "history">): string {
  const terrain = `<h2>Terreno y combustible</h2><p>${d.terrain ? esc(d.terrain) : "No se pudo consultar el terreno."}</p>`;
  const rows = d.early
    .map((e) => {
      const lead = leadMinutes(e);
      const state = e.status === "confirmed" ? "confirmada por satélite polar" : "sin confirmar";
      const gain = lead === null ? "—" : `${esc(fmtMin(lead))} antes`;
      return `<tr><td>${esc(fmtArgentina(new Date(e.firstAt)))}</td><td>${esc(state)}</td><td>${gain}</td></tr>`;
    })
    .join("");
  const early = d.early.length
    ? `<h2>Alerta temprana (GOES-19)</h2><table><tr><th>Primer escaneo</th><th>Estado</th><th>Ventaja sobre el satélite polar</th></tr>${rows}</table>`
    : "";
  const line = d.history
    .map(
      (h) =>
        `<li>${esc(fmtArgentina(new Date(h.t)))}: ${esc(INCIDENT_STATUS_LABEL[h.status])}${h.assignee ? ` · a cargo: ${esc(h.assignee)}` : ""} (${esc(h.by || "Operador")})</li>`,
    )
    .join("");
  const timeline = `<h2>Línea de tiempo</h2>${line ? `<ul>${line}</ul>` : "<p>Sin cambios de estado registrados.</p>"}`;
  return terrain + early + timeline;
}

/** Opens a print-ready page for one incident; the user saves it as PDF. */
export function printIncidentReport(d: IncidentReportData) {
  const w = window.open("", "_blank");
  if (!w) return false;
  const at = d.generatedAt ?? new Date();
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Informe de incidente</title>
<style>${REPORT_CSS}</style></head><body>
<button onclick="print()" style="float:right;padding:8px 14px">Imprimir / guardar PDF</button>
<h1>Informe de incidente · ${esc(d.place)}</h1><small>${esc(d.org)} · generado ${esc(fmtArgentina(at))} · Sentinel Cloud</small>
<h2>Resumen</h2>
<div class="k"><div><b>${esc(d.area)}</b>superficie est.</div><div><b>${esc(String(d.count))}</b>focos</div><div><b>${esc(String(d.frp))} MW</b>potencia</div><div><b>${esc(String(d.daysActive))}</b>días activo</div></div>
<p>Estado: <b>${d.status ? esc(INCIDENT_STATUS_LABEL[d.status]) : "sin seguimiento"}</b>${d.assignee ? ` · a cargo: ${esc(d.assignee)}` : ""} · <a href="${mapsLink(d.lng, d.lat)}">${d.lat.toFixed(4)}, ${d.lng.toFixed(4)}</a></p>
${incidentExtrasHtml(d)}
<p><small>Descargo: estimación satelital (VIIRS, píxel de 375 m) y GOES-19 (píxeles de 2 a 4 km); no reemplaza el parte oficial. Verificar en terreno antes de actuar.</small></p>
</body></html>`);
  w.document.close();
  return true;
}
