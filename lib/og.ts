// Imagen Open Graph única del sitio (1200×630, en /public). Se usa como ruta relativa: metadataBase la vuelve absoluta.
export const OG_IMAGE = {
  url: "/og-image-v3.jpg",
  width: 1200,
  height: 630,
  alt: "Sentinel: el fuego no espera, nosotros tampoco. Detección temprana de incendios forestales.",
} as const;

export const OG_TITLE = "Sentinel Cloud | Detección temprana de incendios forestales";
export const OG_DESCRIPTION =
  "Detectamos focos de incendio con datos satelitales e IA y avisamos en minutos a municipios, brigadas y productores de la Patagonia. Sensores y drones se suman de forma progresiva.";
export const TWITTER_DESCRIPTION = "Datos satelitales e IA para detectar incendios forestales de forma temprana en la Patagonia.";
