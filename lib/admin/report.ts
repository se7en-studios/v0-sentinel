import type { FirePoint } from "./types";

const esc = (s: string) =>
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

export interface ReportData {
  org: string;
  stats: { total: number; last24: number; frp: number; hectares: number };
  zones: { name: string; area: string; recent: number; total: number }[];
  clusters: { text: string; count: number; frp: number }[];
  exposure: string | null;
  mapImage?: string | null;
}

/** Opens a print-ready page; the user saves it as PDF from the print dialog. */
export function printReport(d: ReportData) {
  const w = window.open("", "_blank");
  if (!w) return false;
  const rows = d.zones
    .map(
      (z) =>
        `<tr><td>${esc(z.name)}</td><td>${esc(z.area)}</td><td>${z.recent}</td><td>${z.total}</td></tr>`,
    )
    .join("");
  const cl = d.clusters
    .map((c) => `<li>${esc(c.text)} · ${c.count} focos · ${c.frp} MW</li>`)
    .join("");
  w.document
    .write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Reporte Sentinel</title>
<style>body{font:14px/1.5 Inter,system-ui,sans-serif;color:#1a1812;max-width:760px;margin:32px auto;padding:0 20px}
h1{font-size:22px;margin:0}h2{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#0f7a4f;margin:26px 0 8px}
.k{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.k div{border:1px solid #ddd;border-radius:8px;padding:10px}
.k b{display:block;font-size:20px}table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #e5e0d3;padding:6px 4px;text-align:left}
small{color:#777}@media print{button{display:none}}</style></head><body>
<button onclick="print()" style="float:right;padding:8px 14px">Imprimir / guardar PDF</button>
<h1>Reporte de monitoreo · ${esc(d.org)}</h1><small>Generado ${new Date().toLocaleString("es-AR")} · Sentinel Cloud</small>
${d.mapImage && /^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(d.mapImage) ? `<img src="${d.mapImage}" alt="Mapa" style="width:100%;border-radius:8px;margin-top:14px">` : ""}
<h2>Resumen satelital (Argentina, 10 días)</h2>
<div class="k"><div><b>${d.stats.last24}</b>focos 24 h</div><div><b>${d.stats.total}</b>focos 10 días</div><div><b>${d.stats.frp} MW</b>potencia total</div><div><b>${d.stats.hectares} ha</b>superficie est. (cota sup.)</div></div>
<h2>Zonas monitoreadas</h2>${rows ? `<table><tr><th>Zona</th><th>Superficie</th><th>Focos 48 h</th><th>Focos 10 d</th></tr>${rows}</table>` : "<p>Sin zonas definidas.</p>"}
${d.exposure ? `<h2>Exposición</h2><p>${esc(d.exposure)}</p>` : ""}
<h2>Concentraciones principales</h2><ul>${cl || "<li>Sin concentraciones relevantes.</li>"}</ul>
<p><small>Fuentes: NASA FIRMS (VIIRS NOAA-20 + NOAA-21 NRT), Open-Meteo, Esri/Sentinel-2 como base. La superficie estimada es una cota superior (≈14 ha por detección). Las predicciones de propagación son demostrativas.</small></p>
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
