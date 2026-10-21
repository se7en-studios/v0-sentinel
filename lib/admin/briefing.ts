import type { FireCluster } from "./types";
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
  const tone: Briefing["tone"] =
    hitZones.length > 0 ? "alert" : highRisk || i.last24 > 0 ? "watch" : "calm";

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
      `Riesgo meteorológico hoy: ${i.today.label.toLowerCase()} (${i.today.score}/100), ${Math.round(i.today.tmax)} °C, ${Math.round(i.today.rhmin)} % de humedad mínima, viento hasta ${Math.round(i.today.wind)} km/h.`,
    );
  if (i.worst && i.worst.score >= 55)
    points.push(
      `Peor día de la semana: ${day(i.worst)} (${i.worst.label.toLowerCase()}, ${i.worst.score}/100).`,
    );

  const actions: string[] = [];
  for (const z of hitZones)
    actions.push(
      `Verificar ${z.name}: confirmar el foco con un dron o un recorrido.`,
    );
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
