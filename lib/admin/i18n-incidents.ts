/**
 * Texts of the backup-source notice (and room for the incident lane's future strings).
 * Spanish is the source; English and Portuguese must have the same keys and {placeholders}.
 */
export const esIncidents = {
  "backup.title": "Mostrando focos de respaldo",
  "backup.body":
    "NASA FIRMS no respondió, así que los focos vienen del respaldo de INPE. El historial es de 48 h y estos datos no traen nivel de confianza ni si fue de día o de noche.",
  "backup.dismiss": "Entendido",
  "inc.empty.title": "Sin incidentes por ahora",
  "inc.empty.what": "Un incidente es un grupo de 5 o más focos cercanos, casi siempre un mismo incendio.",
  "inc.empty.region": "Ahora no hay ninguno a menos de {km} km de la región que estás mirando.",
  "inc.empty.ar": "Ahora no hay ningún grupo así en todo el país.",
  "inc.empty.goAr": "Ver {n} en Argentina",
};

export const enIncidents: Record<keyof typeof esIncidents, string> = {
  "backup.title": "Showing backup detections",
  "backup.body":
    "NASA FIRMS did not respond, so detections come from the INPE backup. History is 48 h and this data carries no confidence level and no day/night flag.",
  "backup.dismiss": "Got it",
  "inc.empty.title": "No incidents for now",
  "inc.empty.what": "An incident is a group of 5 or more nearby detections, almost always a single fire.",
  "inc.empty.region": "There are none within {km} km of the region you are looking at right now.",
  "inc.empty.ar": "There is no such group anywhere in the country right now.",
  "inc.empty.goAr": "See {n} in Argentina",
};

export const ptIncidents: Record<keyof typeof esIncidents, string> = {
  "backup.title": "Mostrando focos de reserva",
  "backup.body":
    "A NASA FIRMS não respondeu, então os focos vêm da reserva do INPE. O histórico é de 48 h e esses dados não trazem nível de confiança nem se foi de dia ou de noite.",
  "backup.dismiss": "Entendi",
  "inc.empty.title": "Sem incidentes por enquanto",
  "inc.empty.what": "Um incidente é um grupo de 5 ou mais focos próximos, quase sempre um mesmo incêndio.",
  "inc.empty.region": "Agora não há nenhum a menos de {km} km da região que você está vendo.",
  "inc.empty.ar": "Agora não há nenhum grupo assim em todo o país.",
  "inc.empty.goAr": "Ver {n} na Argentina",
};
