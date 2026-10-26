/** The text of an alert sent by email or WhatsApp. es is the source; en/pt must match keys and {placeholders}. */
export const esAlerts = {
  "msg.t.zone_fire": "Fuego cerca de tu zona",
  "msg.t.early_open": "Alerta temprana cerca de tu zona",
  "msg.t.risk": "Riesgo de incendio alto en los próximos días",
  "msg.t.fwi": "Condiciones muy propicias para incendios",
  "msg.t.growth": "Un incendio está creciendo",
  "msg.t.activity": "Mucha actividad de focos",
  "msg.what": "Qué pasó: {detail}.",
  "msg.when": "Cuándo: {when}.",
  "msg.where": "Zona del mapa: {region}.",
  "msg.do.zone_fire":
    "Qué hacer: abrí el panel, mirá la zona en el mapa y avisá a tu equipo en el campo.",
  "msg.do.early_open":
    "Qué hacer: abrí el panel y mirá la alerta. Todavía no la confirmó otro satélite: revisala antes de actuar.",
  "msg.do.risk":
    "Qué hacer: revisá el pronóstico de los próximos días y planificá la prevención.",
  "msg.do.fwi":
    "Qué hacer: revisá el pronóstico de los próximos días y planificá la prevención.",
  "msg.do.growth":
    "Qué hacer: abrí el incidente en el panel y mirá hacia dónde avanza.",
  "msg.do.activity":
    "Qué hacer: abrí la pestaña Incendios para ver dónde están los focos.",
  "msg.foot":
    "Mensaje automático de Sentinel. Podés cambiar o apagar estos avisos en Configuración.",
  "msg.sampleZone": "Lote Norte",
  "msg.sampleIncident": "Cerca de Bariloche",
  "dlv.title": "Avisos por correo y WhatsApp",
  "dlv.intro":
    "Cuando una de tus reglas de aviso se cumple, además de verla en pantalla te llega un mensaje. Sale mientras el panel está abierto en algún navegador.",
  "dlv.contact": "A dónde llegan",
  "dlv.contact.none":
    "Falta cargar un correo o un WhatsApp en “Avisos”, arriba.",
  "dlv.contact.email": "Correo: {v}",
  "dlv.contact.phone": "WhatsApp: {v}",
  "dlv.contact.bad": "Este dato no parece válido: {v}",
  "dlv.preview": "Así te va a llegar",
  "dlv.preview.hint":
    "Es el texto real, con un ejemplo. Elegí el tipo de aviso para verlo.",
  "dlv.preview.kind": "Tipo de aviso",
  "dlv.preview.email": "Correo",
  "dlv.preview.subject": "Asunto",
  "dlv.preview.whatsapp": "WhatsApp (una sola línea)",
  "dlv.limits": "Para no llenarte de mensajes",
  "dlv.interval": "Como mucho un mensaje por regla cada",
  "dlv.interval.15": "15 minutos",
  "dlv.interval.60": "1 hora",
  "dlv.interval.360": "6 horas",
  "dlv.interval.1440": "24 horas",
  "dlv.perDay": "Como mucho {n} mensajes por día, entre todas las reglas",
  "dlv.activate": "Mandar mis avisos por correo y WhatsApp",
  "dlv.activate.hint": "Empieza apagado. Podés apagarlo cuando quieras.",
  "dlv.needContact": "Cargá primero un correo o un WhatsApp válido.",
  "dlv.status": "Estado del envío",
  "dlv.status.check": "Revisar si está listo",
  "dlv.status.checking": "Revisando…",
  "dlv.status.ready": "Listo para enviar",
  "dlv.status.notConfigured": "Falta configurar el servidor",
  "dlv.status.skipped": "Tu dato no está en la lista permitida del servidor",
  "dlv.status.failed": "No se pudo revisar. Probá de nuevo en un rato.",
  "dlv.ch.email": "Correo",
  "dlv.ch.whatsapp": "WhatsApp",
  "dlv.load.title": "Qué hay que cargar en el servidor",
  "dlv.load.email":
    "Correo: RESEND_API_KEY, NOTIFY_EMAIL_FROM y tu correo en NOTIFY_EMAIL_TO.",
  "dlv.load.whatsapp":
    "WhatsApp: WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TEMPLATE_NAME y tu número en NOTIFY_WHATSAPP_TO.",
  "dlv.last": "Último mensaje: {age} ({channels})",
  "dlv.last.none": "Todavía no se mandó ninguno.",
  "dlv.sent": "Aviso enviado por {channels}",
  "dlv.failed": "No se pudo enviar el aviso por {channels}",
  "dlv.skip.interval":
    "Aviso no enviado: ya mandamos uno de esta regla hace poco.",
  "dlv.skip.daily": "Aviso no enviado: llegaste al máximo de mensajes de hoy.",
} as const;

export const enAlerts: Record<keyof typeof esAlerts, string> = {
  "msg.t.zone_fire": "Fire near your zone",
  "msg.t.early_open": "Early alert near your zone",
  "msg.t.risk": "High fire risk in the coming days",
  "msg.t.fwi": "Conditions very favourable to fires",
  "msg.t.growth": "A fire is growing",
  "msg.t.activity": "A lot of fire activity",
  "msg.what": "What happened: {detail}.",
  "msg.when": "When: {when}.",
  "msg.where": "Map area: {region}.",
  "msg.do.zone_fire":
    "What to do: open the panel, look at the zone on the map and tell your field team.",
  "msg.do.early_open":
    "What to do: open the panel and look at the alert. No other satellite has confirmed it yet: check it before acting.",
  "msg.do.risk":
    "What to do: check the forecast for the coming days and plan your prevention.",
  "msg.do.fwi":
    "What to do: check the forecast for the coming days and plan your prevention.",
  "msg.do.growth":
    "What to do: open the incident in the panel and see where it is heading.",
  "msg.do.activity":
    "What to do: open the Fires tab to see where the detections are.",
  "msg.foot":
    "Automatic message from Sentinel. You can change or turn off these alerts in Settings.",
  "msg.sampleZone": "North plot",
  "msg.sampleIncident": "Near Bariloche",
  "dlv.title": "Alerts by email and WhatsApp",
  "dlv.intro":
    "When one of your alert rules is met, besides seeing it on screen you get a message. It goes out while the panel is open in some browser.",
  "dlv.contact": "Where they go",
  "dlv.contact.none":
    "Add an email or a WhatsApp number under “Alerts”, above.",
  "dlv.contact.email": "Email: {v}",
  "dlv.contact.phone": "WhatsApp: {v}",
  "dlv.contact.bad": "This does not look valid: {v}",
  "dlv.preview": "This is how it will reach you",
  "dlv.preview.hint":
    "This is the real text, with an example. Pick the type of alert to see it.",
  "dlv.preview.kind": "Type of alert",
  "dlv.preview.email": "Email",
  "dlv.preview.subject": "Subject",
  "dlv.preview.whatsapp": "WhatsApp (a single line)",
  "dlv.limits": "So you are not flooded",
  "dlv.interval": "At most one message per rule every",
  "dlv.interval.15": "15 minutes",
  "dlv.interval.60": "1 hour",
  "dlv.interval.360": "6 hours",
  "dlv.interval.1440": "24 hours",
  "dlv.perDay": "At most {n} messages a day, all rules together",
  "dlv.activate": "Send my alerts by email and WhatsApp",
  "dlv.activate.hint": "It starts off. You can turn it off whenever you want.",
  "dlv.needContact": "Add a valid email or WhatsApp number first.",
  "dlv.status": "Sending status",
  "dlv.status.check": "Check if it is ready",
  "dlv.status.checking": "Checking…",
  "dlv.status.ready": "Ready to send",
  "dlv.status.notConfigured": "The server is not set up yet",
  "dlv.status.skipped": "Your address is not on the server's allowed list",
  "dlv.status.failed": "It could not be checked. Try again in a while.",
  "dlv.ch.email": "Email",
  "dlv.ch.whatsapp": "WhatsApp",
  "dlv.load.title": "What has to be set on the server",
  "dlv.load.email":
    "Email: RESEND_API_KEY, NOTIFY_EMAIL_FROM and your address in NOTIFY_EMAIL_TO.",
  "dlv.load.whatsapp":
    "WhatsApp: WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TEMPLATE_NAME and your number in NOTIFY_WHATSAPP_TO.",
  "dlv.last": "Last message: {age} ({channels})",
  "dlv.last.none": "None has been sent yet.",
  "dlv.sent": "Alert sent by {channels}",
  "dlv.failed": "The alert could not be sent by {channels}",
  "dlv.skip.interval":
    "Alert not sent: we already sent one for this rule a moment ago.",
  "dlv.skip.daily": "Alert not sent: you reached today's maximum of messages.",
};

export const ptAlerts: Record<keyof typeof esAlerts, string> = {
  "msg.t.zone_fire": "Fogo perto da sua zona",
  "msg.t.early_open": "Alerta precoce perto da sua zona",
  "msg.t.risk": "Risco alto de incêndio nos próximos dias",
  "msg.t.fwi": "Condições muito propícias a incêndios",
  "msg.t.growth": "Um incêndio está crescendo",
  "msg.t.activity": "Muita atividade de focos",
  "msg.what": "O que aconteceu: {detail}.",
  "msg.when": "Quando: {when}.",
  "msg.where": "Área do mapa: {region}.",
  "msg.do.zone_fire":
    "O que fazer: abra o painel, veja a zona no mapa e avise sua equipe no campo.",
  "msg.do.early_open":
    "O que fazer: abra o painel e veja o alerta. Nenhum outro satélite o confirmou ainda: confira antes de agir.",
  "msg.do.risk":
    "O que fazer: veja a previsão dos próximos dias e planeje a prevenção.",
  "msg.do.fwi":
    "O que fazer: veja a previsão dos próximos dias e planeje a prevenção.",
  "msg.do.growth":
    "O que fazer: abra o incidente no painel e veja para onde ele avança.",
  "msg.do.activity":
    "O que fazer: abra a aba Incêndios para ver onde estão os focos.",
  "msg.foot":
    "Mensagem automática do Sentinel. Você pode mudar ou desligar estes avisos em Configurações.",
  "msg.sampleZone": "Lote Norte",
  "msg.sampleIncident": "Perto de Bariloche",
  "dlv.title": "Avisos por e-mail e WhatsApp",
  "dlv.intro":
    "Quando uma das suas regras de aviso é atendida, além de vê-la na tela você recebe uma mensagem. Ela sai enquanto o painel estiver aberto em algum navegador.",
  "dlv.contact": "Para onde vão",
  "dlv.contact.none": "Cadastre um e-mail ou um WhatsApp em “Avisos”, acima.",
  "dlv.contact.email": "E-mail: {v}",
  "dlv.contact.phone": "WhatsApp: {v}",
  "dlv.contact.bad": "Este dado não parece válido: {v}",
  "dlv.preview": "Assim vai chegar até você",
  "dlv.preview.hint":
    "É o texto real, com um exemplo. Escolha o tipo de aviso para vê-lo.",
  "dlv.preview.kind": "Tipo de aviso",
  "dlv.preview.email": "E-mail",
  "dlv.preview.subject": "Assunto",
  "dlv.preview.whatsapp": "WhatsApp (uma única linha)",
  "dlv.limits": "Para não encher você de mensagens",
  "dlv.interval": "No máximo uma mensagem por regra a cada",
  "dlv.interval.15": "15 minutos",
  "dlv.interval.60": "1 hora",
  "dlv.interval.360": "6 horas",
  "dlv.interval.1440": "24 horas",
  "dlv.perDay": "No máximo {n} mensagens por dia, somando todas as regras",
  "dlv.activate": "Enviar meus avisos por e-mail e WhatsApp",
  "dlv.activate.hint": "Começa desligado. Você pode desligar quando quiser.",
  "dlv.needContact": "Cadastre primeiro um e-mail ou um WhatsApp válido.",
  "dlv.status": "Estado do envio",
  "dlv.status.check": "Ver se está pronto",
  "dlv.status.checking": "Verificando…",
  "dlv.status.ready": "Pronto para enviar",
  "dlv.status.notConfigured": "O servidor ainda não está configurado",
  "dlv.status.skipped": "Seu dado não está na lista permitida do servidor",
  "dlv.status.failed":
    "Não foi possível verificar. Tente de novo daqui a pouco.",
  "dlv.ch.email": "E-mail",
  "dlv.ch.whatsapp": "WhatsApp",
  "dlv.load.title": "O que precisa ser configurado no servidor",
  "dlv.load.email":
    "E-mail: RESEND_API_KEY, NOTIFY_EMAIL_FROM e o seu e-mail em NOTIFY_EMAIL_TO.",
  "dlv.load.whatsapp":
    "WhatsApp: WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TEMPLATE_NAME e o seu número em NOTIFY_WHATSAPP_TO.",
  "dlv.last": "Última mensagem: {age} ({channels})",
  "dlv.last.none": "Nenhuma foi enviada ainda.",
  "dlv.sent": "Aviso enviado por {channels}",
  "dlv.failed": "Não foi possível enviar o aviso por {channels}",
  "dlv.skip.interval":
    "Aviso não enviado: já enviamos um desta regra há pouco.",
  "dlv.skip.daily":
    "Aviso não enviado: você atingiu o máximo de mensagens de hoje.",
};
