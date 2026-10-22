export interface CapAlert {
  id: string;
  sender: string;
  sent: Date;
  event: string;
  headline: string;
  description: string;
  instruction?: string;
  severity: "Extreme" | "Severe" | "Moderate" | "Minor" | "Unknown";
  urgency: "Immediate" | "Expected" | "Future" | "Past" | "Unknown";
  certainty: "Observed" | "Likely" | "Possible" | "Unlikely" | "Unknown";
  areaDesc: string;
  /** [lat, lon] pairs; the ring is closed automatically */
  polygon?: [number, number][];
}

const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ] as string,
  );

/** CAP wants "YYYY-MM-DDThh:mm:ss+hh:mm"; UTC is expressed as +00:00. */
const capDate = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "+00:00");

/** OASIS CAP 1.2 `<alert>` document. Every interpolated value is escaped. */
export function toCap(a: CapAlert): string {
  const pts = a.polygon && a.polygon.length >= 3 ? [...a.polygon] : null;
  if (pts) {
    const [f, l] = [pts[0], pts[pts.length - 1]];
    if (f[0] !== l[0] || f[1] !== l[1]) pts.push(f);
  }
  const area =
    `<area><areaDesc>${esc(a.areaDesc)}</areaDesc>` +
    (pts
      ? `<polygon>${pts.map((p) => `${p[0]},${p[1]}`).join(" ")}</polygon>`
      : "") +
    "</area>";
  return (
    `<?xml version="1.0" encoding="UTF-8"?><alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">` +
    `<identifier>${esc(a.id)}</identifier><sender>${esc(a.sender)}</sender><sent>${capDate(a.sent)}</sent>` +
    `<status>Actual</status><msgType>Alert</msgType><scope>Public</scope>` +
    `<info><language>es-AR</language><category>Fire</category><event>${esc(a.event)}</event>` +
    `<urgency>${a.urgency}</urgency><severity>${a.severity}</severity><certainty>${a.certainty}</certainty>` +
    `<headline>${esc(a.headline)}</headline><description>${esc(a.description)}</description>` +
    (a.instruction ? `<instruction>${esc(a.instruction)}</instruction>` : "") +
    `${area}</info></alert>`
  );
}
