// Única fuente de las cifras públicas de la landing. Todo lo que muestre
// tiempos o precisión lee de acá, para que nunca se contradigan entre secciones.
// Son OBJETIVOS de diseño, no resultados medidos en campo: mantener la palabra
// "objetivo" en la UI hasta tener evidencia (ver /metodologia).
export const CLAIMS = {
  detectionMinutes: 8,
  accuracyPct: 98,
  monitoringHours: 24,
  satellites: "VIIRS, MODIS y GOES-19",
  region: "Patagonia, Argentina",
} as const;
