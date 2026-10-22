import type { FireCluster, SourceStatus } from "./types";
import type { DayForecast } from "./forecast";

export interface BriefingInput {
  org: string;
  now: Date;
  last24: number;
  total10d: number;
  frpMw: number;
  zones: { name: string; recent: number }[];
  clusters: FireCluster[];
  today?: DayForecast;
  best?: DayForecast;
  worst?: DayForecast;
  /** GOES early alerts still waiting for a polar pass to confirm them */
  earlyOpen?: number;
  /** labels of the feeds that failed or are behind (see delayedSources) */
  delayed?: string[];
}

const GOES_STALE_MS = 3600_000; // GOES scans every 10 min: an hour without news is a delay
const POLAR_STALE_MS = 12 * 3600_000; // polar satellites pass a few times a day

/** Feeds that answered with an error, or whose newest acquisition is older than their normal rhythm. */
export function delayedSources(sources: SourceStatus[], now: number): string[] {
  return sources
    .filter((s) => {
      if (!s.ok) return true;
      if (!s.newestAt) return false;
      const limit = s.id.startsWith("goes") ? GOES_STALE_MS : POLAR_STALE_MS;
      return now - s.newestAt > limit;
    })
    .map((s) => s.label);
}

export interface Briefing {
  /** Plain text, ready for WhatsApp / email. */
  text: string;
  tone: "alert" | "watch" | "calm";
  headline: string;
  points: string[];
  actions: string[];
}

const n = (v: number) => v.toLocaleString("es-AR");
const day = (d: DayForecast) =>
  new Date(`${d.date}T12:00:00`).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
  });

/** Rule-based daily summary from the data the panel already holds. No LLM, so it is instant and offline-safe. */
export function buildBriefing(i: BriefingInput): Briefing {
  const hitZones = i.zones.filter((z) => z.recent > 0);
  const highRisk = (i.today?.score ?? 0) >= 55;
  const early = i.earlyOpen ?? 0;
  const tone: Briefing["tone"] =
    hitZones.length > 0
      ? "alert"
      : highRisk || i.last24 > 0 || early > 0
        ? "watch"
        : "calm";

  const headline =
    tone === "alert"
      ? `Foco detectado cerca de ${hitZones.length === 1 ? "una zona vigilada" : `${hitZones.length} zonas vigiladas`}`
      : tone === "watch"
        ? highRisk
          ? "Peligro de incendio elevado hoy"
          : "Actividad térmica en el país, sin impacto en tus zonas"
        : "Sin novedades: actividad térmica baja";

  const points = [
    `${n(i.last24)} focos en Argentina en las últimas 24 h y ${n(i.total10d)} en 10 días (${n(Math.round(i.frpMw))} MW de potencia radiativa total).`,
  ];
  for (const z of hitZones)
    points.push(
      `${z.name}: ${z.recent} detecciones en 48 h dentro del radio de vigilancia.`,
    );
  const top = [...i.clusters].sort((a, b) => b.count - a.count)[0];
  if (top && top.count >= 3)
    points.push(
      `Mayor concentración: ${top.count} focos a ${top.km} km de ${top.near}.`,
    );
  if (i.today)
    points.push(
      `Riesgo meteorológico hoy: ${i.today.label.toLowerCase()} (${i.today.score}/100), ${Math.round(i.today.tmax)} °C, ${Math.round(i.today.rhmin)} % de humedad mínima, viento hasta ${Math.round(i.today.wind)} km/h${i.today.fwi === undefined ? "" : `; FWI ${Math.round(i.today.fwi)} (${i.today.fwiLabel?.toLowerCase()})`}.`,
    );
  if (early > 0)
    points.push(
      `${early} ${early === 1 ? "alerta temprana" : "alertas tempranas"} de GOES sin confirmar por un pase polar.`,
    );
  if (i.delayed?.length)
    points.push(`Fuentes con demora: ${i.delayed.join(", ")}.`);
  if (i.worst && i.worst.score >= 55)
    points.push(
      `Peor día de la semana: ${day(i.worst)} (${i.worst.label.toLowerCase()}, ${i.worst.score}/100).`,
    );

  const actions: string[] = [];
  for (const z of hitZones)
    actions.push(
      `Verificar ${z.name}: confirmar el foco con un dron o un recorrido.`,
    );
  if (early > 0)
    actions.push("Revisar las alertas tempranas: pueden ser focos nuevos.");
  if (highRisk)
    actions.push(
      "Evitar quemas y trabajos con chispa; reforzar la vigilancia.",
    );
  else if (i.best && i.best.score < 35)
    actions.push(
      `Mejor ventana para operar o quemas prescriptas: ${day(i.best)}.`,
    );
  if (actions.length === 0)
    actions.push("Sin acciones urgentes. Mantener el monitoreo.");

  const date = i.now.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const text = [
    `*Briefing Sentinel${i.org ? ` · ${i.org}` : ""}* — ${date}`,
    headline,
    "",
    ...points.map((p) => `• ${p}`),
    "",
    "*Acciones*",
    ...actions.map((a) => `→ ${a}`),
  ].join("\n");

  return { text, tone, headline, points, actions };
}
