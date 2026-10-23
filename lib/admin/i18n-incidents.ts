/**
 * Texts of the backup-source notice (and room for the incident lane's future strings).
 * Spanish is the source; English and Portuguese must have the same keys and {placeholders}.
 */
export const esIncidents = {
  "backup.title": "Mostrando focos de respaldo",
  "backup.body":
    "NASA FIRMS no respondió, así que los focos vienen del respaldo de INPE. El historial es de 48 h y estos datos no traen nivel de confianza ni si fue de día o de noche.",
  "backup.dismiss": "Entendido",
} as const;

export const enIncidents: Record<keyof typeof esIncidents, string> = {
  "backup.title": "Showing backup detections",
  "backup.body":
    "NASA FIRMS did not respond, so detections come from the INPE backup. History is 48 h and this data carries no confidence level and no day/night flag.",
  "backup.dismiss": "Got it",
};

export const ptIncidents: Record<keyof typeof esIncidents, string> = {
  "backup.title": "Mostrando focos de reserva",
  "backup.body":
    "A NASA FIRMS não respondeu, então os focos vêm da reserva do INPE. O histórico é de 48 h e esses dados não trazem nível de confiança nem se foi de dia ou de noite.",
  "backup.dismiss": "Entendi",
};
