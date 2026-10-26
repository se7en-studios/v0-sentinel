export interface WeatherInput {
  temperature: number;
  humidity: number;
  windSpeed: number;
}

export type RiskLabel = "Bajo" | "Moderado" | "Alto" | "Extremo";

// `color` feeds the map (bright, decorative); `text` is a darker shade that
// meets WCAG AA (>= 4.5:1) as text on #faf7f0.
export const RISK_STYLE: Record<RiskLabel, { color: string; text: string }> = {
  Bajo: { color: "#0f7a4f", text: "#0b6b44" },
  Moderado: { color: "#f1e06b", text: "#7a5f00" },
  Alto: { color: "#f1b46b", text: "#9a4a00" },
  Extremo: { color: "#b83a3a", text: "#a32f2f" },
};

export const RISK_RANK: Record<RiskLabel, number> = {
  Bajo: 0,
  Moderado: 1,
  Alto: 2,
  Extremo: 3,
};

// ponytail: illustrative heuristic (temp+humidity+wind), not an official index
// such as the Canadian FWI; the UI labels it "estimado".
export function riskLabel(r: WeatherInput): RiskLabel {
  let score = 0;
  if (r.temperature > 30) score += 3;
  else if (r.temperature > 25) score += 2;
  else if (r.temperature > 18) score += 1;
  if (r.humidity < 20) score += 3;
  else if (r.humidity < 35) score += 2;
  else if (r.humidity < 50) score += 1;
  if (r.windSpeed > 40) score += 3;
  else if (r.windSpeed > 25) score += 2;
  else if (r.windSpeed > 15) score += 1;
  if (score >= 8) return "Extremo";
  if (score >= 6) return "Alto";
  if (score >= 3) return "Moderado";
  return "Bajo";
}
