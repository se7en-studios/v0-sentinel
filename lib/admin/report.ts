import { FIRMS_LABEL } from "../firms";
import type { EarlyView } from "./early";
import { translate, type Locale, type MsgKey } from "./i18n";
import { NUM_LOCALE } from "./i18n-shell";
import type { IncidentChange, IncidentStatus } from "./incident-meta";
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
  /** language of the printed page; Spanish when absent */
  locale?: Locale;
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

type Tr = (key: MsgKey, vars?: Record<string, string | number>) => string;
const trFor =
  (locale: Locale): Tr =>
  (key, vars) =>
    translate(locale, key, vars);

/** "21/10/2026, 12:04 (hora de Argentina)" (Spanish unless `locale` says otherwise) */
export const fmtArgentina = (d: Date, locale: Locale = "es"): string =>
  `${new Intl.DateTimeFormat(NUM_LOCALE[locale], { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "short", timeStyle: "short", hourCycle: "h23" }).format(d)} ${trFor(locale)("rep.artSuffix")}`;

export function evidenceHtml(ev: Evidence | null, generatedAt: Date, locale: Locale = "es"): string {
  const t = trFor(locale);
  const when = (d: Date | null) => (d ? esc(fmtArgentina(d, locale)) : t("rep.noDetections"));
  const days = ev?.perDay.length
    ? `<table><tr><th>${t("rep.th.dayUtc")}</th><th>${t("rep.th.detections")}</th></tr>${ev.perDay.map((r) => `<tr><td>${esc(r.day)}</td><td>${r.count}</td></tr>`).join("")}</table>`
    : "";
  return `<h2>${t("rep.evidence")}</h2>
<ul><li>${t("rep.firstDet", { t: when(ev?.first ?? null) })}</li><li>${t("rep.newestDet", { t: when(ev?.newest ?? null) })}</li><li>${t("rep.sourceLine", { label: esc(FIRMS_LABEL) })}</li><li>${t("rep.reportGen", { t: esc(fmtArgentina(generatedAt, locale)) })}</li></ul>${days}
<p><small>${t("rep.disclaimer")}</small></p>`;
}

/** Opens a print-ready page; the user saves it as PDF from the print dialog. */
export function printReport(d: ReportData) {
  const w = window.open("", "_blank");
  if (!w) return false;
  const locale = d.locale ?? "es";
  const t = trFor(locale);
  const rows = d.zones
    .map(
      (z) =>
        `<tr><td>${esc(z.name)}</td><td>${esc(z.area)}</td><td>${esc(String(z.recent))}</td><td>${esc(String(z.total))}</td></tr>`,
    )
    .join("");
  const cl = d.clusters
    .map((c) => `<li>${esc(t("rep.cluster", { text: c.text, n: String(c.count), mw: String(c.frp) }))}</li>`)
    .join("");
  const generatedAt = d.generatedAt ?? new Date();
  const evidence = evidenceHtml(d.fires ? summarizeEvidence(d.fires.points, d.fires.days) : null, generatedAt, locale);
  w.document
    .write(`<!doctype html><html lang="${t("rep.lang")}"><head><meta charset="utf-8"><title>${t("rep.title")}</title>
<style>${REPORT_CSS}</style></head><body>
<button onclick="print()" style="float:right;padding:8px 14px">${t("rep.print")}</button>
<h1>${esc(t("rep.h1", { org: d.org }))}</h1><small>${esc(t("rep.generated", { t: fmtArgentina(generatedAt, locale) }))}</small>
${d.mapImage && /^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(d.mapImage) ? `<img src="${d.mapImage}" alt="${t("rep.mapAlt")}" style="width:100%;border-radius:8px;margin-top:14px">` : ""}
<h2>${t("rep.summary")}</h2>
<div class="k"><div><b>${esc(String(d.stats.last24))}</b>${t("rep.k.24")}</div><div><b>${esc(String(d.stats.total))}</b>${t("rep.k.10")}</div><div><b>${esc(String(d.stats.frp))} MW</b>${t("rep.k.power")}</div><div><b>${esc(String(d.stats.hectares))} ha</b>${t("rep.k.area")}</div></div>
<h2>${t("rep.zones")}</h2>${rows ? `<table><tr><th>${t("rep.th.zone")}</th><th>${t("rep.th.area")}</th><th>${t("rep.th.f48")}</th><th>${t("rep.th.f10")}</th></tr>${rows}</table>` : `<p>${t("rep.noZones")}</p>`}
${d.exposure ? `<h2>${t("rep.exposure")}</h2><p>${esc(d.exposure)}</p>` : ""}
<h2>${t("gen.clusters")}</h2><ul>${cl || `<li>${t("rep.noClusters")}</li>`}</ul>
${evidence}
<p><small>${t("rep.sources", { label: esc(FIRMS_LABEL) })}</small></p>
</body></html>`);
  w.document.close();
  return true;
}

/** Pre-filled WhatsApp / email links for an alert (no backend needed). */
export function alertLinks(text: string, whatsapp: string, email: string, subject = "Alerta Sentinel") {
  const digits = whatsapp.replace(/\D/g, "");
  return {
    whatsapp: `https://wa.me/${digits}?text=${encodeURIComponent(text)}`,
    email: `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`,
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
  /** language of the printed page; Spanish when absent */
  locale?: Locale;
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

const fmtMin = (m: number, locale: Locale) => {
  if (m < 120) return `${m} min`;
  const h = (m / 60).toFixed(1);
  return `${locale === "en" ? h : h.replace(".", ",")} h`;
};

const statusLabel = (t: Tr, s: IncidentStatus) => t(`rep.st.${s}` as MsgKey);

/** "Terreno", "Alerta temprana" and "Línea de tiempo" sections; the caller escapes nothing, this does. */
export function incidentExtrasHtml(
  d: Pick<IncidentReportData, "terrain" | "early" | "history">,
  locale: Locale = "es",
): string {
  const t = trFor(locale);
  const terrain = `<h2>${t("terr.title")}</h2><p>${d.terrain ? esc(d.terrain) : t("rep.inc.noTerrain")}</p>`;
  const rows = d.early
    .map((e) => {
      const lead = leadMinutes(e);
      const state = e.status === "confirmed" ? t("rep.inc.confirmed") : t("rep.inc.unconfirmed");
      const gain = lead === null ? "—" : esc(t("rep.inc.before", { t: fmtMin(lead, locale) }));
      return `<tr><td>${esc(fmtArgentina(new Date(e.firstAt), locale))}</td><td>${esc(state)}</td><td>${gain}</td></tr>`;
    })
    .join("");
  const early = d.early.length
    ? `<h2>${t("pop.early.title")}</h2><table><tr><th>${t("rep.inc.th.scan")}</th><th>${t("rep.inc.th.state")}</th><th>${t("rep.inc.th.lead")}</th></tr>${rows}</table>`
    : "";
  const line = d.history
    .map(
      (h) =>
        `<li>${esc(fmtArgentina(new Date(h.t), locale))}: ${esc(statusLabel(t, h.status))}${h.assignee ? esc(t("rep.inc.assignee", { who: h.assignee })) : ""} (${esc(h.by || t("rep.operator"))})</li>`,
    )
    .join("");
  const timeline = `<h2>${t("tln.title")}</h2>${line ? `<ul>${line}</ul>` : `<p>${t("rep.inc.noHistory")}</p>`}`;
  return terrain + early + timeline;
}

/** Opens a print-ready page for one incident; the user saves it as PDF. */
export function printIncidentReport(d: IncidentReportData) {
  const w = window.open("", "_blank");
  if (!w) return false;
  const locale = d.locale ?? "es";
  const t = trFor(locale);
  const at = d.generatedAt ?? new Date();
  w.document.write(`<!doctype html><html lang="${t("rep.lang")}"><head><meta charset="utf-8"><title>${t("rep.inc.title")}</title>
<style>${REPORT_CSS}</style></head><body>
<button onclick="print()" style="float:right;padding:8px 14px">${t("rep.print")}</button>
<h1>${esc(t("rep.inc.h1", { place: d.place }))}</h1><small>${esc(t("rep.inc.gen", { org: d.org, t: fmtArgentina(at, locale) }))}</small>
<h2>${t("rep.inc.summary")}</h2>
<div class="k"><div><b>${esc(d.area)}</b>${t("rep.inc.k.area")}</div><div><b>${esc(String(d.count))}</b>${t("rep.inc.k.fires")}</div><div><b>${esc(String(d.frp))} MW</b>${t("rep.inc.k.power")}</div><div><b>${esc(String(d.daysActive))}</b>${t("rep.inc.k.days")}</div></div>
<p>${t("rep.inc.state")} <b>${d.status ? esc(statusLabel(t, d.status)) : t("rep.inc.noFollow")}</b>${d.assignee ? esc(t("rep.inc.assignee", { who: d.assignee })) : ""} · <a href="${mapsLink(d.lng, d.lat)}">${d.lat.toFixed(4)}, ${d.lng.toFixed(4)}</a></p>
${incidentExtrasHtml(d, locale)}
<p><small>${t("rep.inc.disclaimer")}</small></p>
</body></html>`);
  w.document.close();
  return true;
}
