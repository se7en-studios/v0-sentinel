/** Quick guide texts. es is the source; en/pt must match keys and {placeholders}. */
export const esGuide = {
  "guide.title": "Guía rápida",
  "guide.desc": "Qué significa cada cosa del panel, en pocas líneas.",
  "guide.close": "Cerrar la guía",
  "guide.link": "Ver la guía",
  "guide.openFromKeys": "Abrir la guía rápida",
  "guide.map.title": "Qué ves en el mapa",
  "guide.map.fire":
    "Foco de satélite: un punto naranja a rojo. Cuanto más grande y más rojo, más potencia (FRP, en MW).",
  "guide.map.sat":
    "VIIRS es el foco de 375 m, el más preciso. MODIS es de 1 km, más grueso: solo se muestra si VIIRS no vio lo mismo.",
  "guide.map.early":
    "Anillo cian grueso: alerta temprana. Un satélite que mira todo el tiempo (GOES-19) vio calor y ningún otro satélite lo confirmó todavía.",
  "guide.map.early2":
    "Anillo gris fino: esa alerta ya la confirmó un satélite de órbita polar.",
  "guide.map.zone":
    "Zona (verde): un área que vigilás. El color muestra el riesgo y se pone roja si tiene una alerta.",
  "guide.map.sim":
    "Sensor (anillo turquesa) y dron (punto verde): son simulados.",
  "guide.map.industrial":
    "Calor industrial oculto: fábricas, refinerías y otras fuentes fijas dan calor sin ser incendios. El panel las saca del mapa y las cuenta aparte.",
  "guide.data.title": "De dónde salen los datos",
  "guide.data.intro":
    "Los focos son reales y vienen de satélites de la NASA (FIRMS). Cada fuente tiene su demora.",
  "guide.data.viirs":
    "VIIRS (NOAA-20 y NOAA-21): focos de 375 m, entre 2 y 3 pasadas por día cada uno. El panel los consulta cada 30 minutos.",
  "guide.data.modis":
    "MODIS (Terra y Aqua): focos de 1 km. Terra pasa unas horas antes que los VIIRS.",
  "guide.data.goes":
    "GOES-19: mira Argentina cada {scan} minutos con unos 20 minutos de demora, pero con píxeles de 2 a 4 km. Se consulta cada 5 minutos.",
  "guide.data.backup":
    "Si FIRMS falla, el panel usa INPE como respaldo; esa fuente no informa confianza ni día o noche.",
  "guide.data.terrain":
    "Combustible, elevación y pendiente de un punto (ESA WorldCover y Copernicus) se consultan al hacer clic en un foco.",
  "guide.early.title": "Alertas tempranas y confianza",
  "guide.early.what":
    "Una alerta temprana queda abierta hasta que un satélite polar la confirma cerca. Cuantos más escaneos seguidos de GOES-19 vean el calor, más probable es que sea real.",
  "guide.early.tiersIntro":
    "De cada 100 alertas de cada nivel, esta cantidad la confirmó después un satélite polar (medido en 28 días):",
  "guide.early.tier.low": "Menos de {a} escaneos: {p} %",
  "guide.early.tier.mid": "De {a} a {b} escaneos: {p} %",
  "guide.early.tier.high": "{a} o más escaneos: {p} %",
  "guide.early.caveat":
    "Es un dato histórico, no una promesa. Una alerta sin confirmar puede ser una falsa alarma, un fuego chico que el otro satélite no vio o una nube.",
  "guide.score.title": "Puntaje de un foco",
  "guide.score.fire":
    "El puntaje (0 a 100) dice qué tan probable es que sea un incendio de vegetación. Parte de la confianza del satélite y sube con la potencia y con la cantidad de focos vecinos.",
  "guide.score.industrial":
    "Si el foco está sobre una fuente industrial conocida, o repite en el mismo lugar durante días con poca potencia, el puntaje baja mucho y se marca como calor industrial.",
  "guide.score.fwi":
    "FWI (índice meteorológico de peligro de incendio): combina temperatura, humedad, viento y lluvia reciente. Da el riesgo del día, de Bajo a Extremo. No mide fuegos: mide qué tan fácil sería que uno se propague.",
  "guide.sim.title": "Qué es simulado y qué no hace el panel",
  "guide.sim.fake":
    "Los sensores y los drones del modo demo son simulados: se mueven y miden con datos inventados.",
  "guide.sim.real":
    "Son reales los focos, las alertas tempranas, el clima, el pronóstico y el terreno.",
  "guide.sim.not":
    "El panel no controla drones, no lee sensores reales y no avisa a bomberos. Los avisos por correo y WhatsApp todavía no funcionan con el panel cerrado.",
  "guide.store.title": "Dónde se guardan tus datos",
  "guide.store.device":
    "En este dispositivo: tus zonas, notas y ajustes, el idioma, el tema y qué partes de la guía ya viste.",
  "guide.store.cloud":
    "En la nube: solo si iniciaste sesión, tu espacio de trabajo se sincroniza con tu cuenta.",
  "guide.store.nosync":
    "Sin sesión, nada sale de este dispositivo. Los focos no se guardan para usar sin conexión.",
};

export const enGuide: typeof esGuide = {
  "guide.title": "Quick guide",
  "guide.desc": "What everything in the panel means, in a few lines.",
  "guide.close": "Close the guide",
  "guide.link": "View the guide",
  "guide.openFromKeys": "Open the quick guide",
  "guide.map.title": "What you see on the map",
  "guide.map.fire":
    "Satellite fire: an orange to red dot. The bigger and redder, the more power (FRP, in MW).",
  "guide.map.sat":
    "VIIRS is the 375 m fire, the most precise. MODIS is 1 km, coarser: it only shows when VIIRS did not see the same thing.",
  "guide.map.early":
    "Thick cyan ring: early warning. A satellite that watches all the time (GOES-19) saw heat and no other satellite has confirmed it yet.",
  "guide.map.early2":
    "Thin gray ring: a polar-orbit satellite has already confirmed that warning.",
  "guide.map.zone":
    "Zone (green): an area you watch. The color shows the risk and it turns red if it has an alert.",
  "guide.map.sim":
    "Sensor (teal ring) and drone (green dot): they are simulated.",
  "guide.map.industrial":
    "Industrial heat hidden: factories, refineries and other fixed sources give off heat without being fires. The panel takes them off the map and counts them separately.",
  "guide.data.title": "Where the data comes from",
  "guide.data.intro":
    "The fires are real and come from NASA satellites (FIRMS). Each source has its own delay.",
  "guide.data.viirs":
    "VIIRS (NOAA-20 and NOAA-21): 375 m fires, 2 to 3 passes a day each. The panel checks them every 30 minutes.",
  "guide.data.modis":
    "MODIS (Terra and Aqua): 1 km fires. Terra passes a few hours before the VIIRS ones.",
  "guide.data.goes":
    "GOES-19: looks at Argentina every {scan} minutes with about 20 minutes of delay, but with 2 to 4 km pixels. It is checked every 5 minutes.",
  "guide.data.backup":
    "If FIRMS fails, the panel falls back to INPE; that source gives no confidence or day or night.",
  "guide.data.terrain":
    "Fuel, elevation and slope of a point (ESA WorldCover and Copernicus) are looked up when you click a fire.",
  "guide.early.title": "Early warnings and confidence",
  "guide.early.what":
    "An early warning stays open until a polar satellite confirms it nearby. The more consecutive GOES-19 scans see the heat, the likelier it is real.",
  "guide.early.tiersIntro":
    "Out of every 100 warnings of each level, this many were later confirmed by a polar satellite (measured over 28 days):",
  "guide.early.tier.low": "Fewer than {a} scans: {p} %",
  "guide.early.tier.mid": "{a} to {b} scans: {p} %",
  "guide.early.tier.high": "{a} or more scans: {p} %",
  "guide.early.caveat":
    "This is a historical rate, not a promise. An unconfirmed warning can be a false alarm, a small fire the other satellite missed, or a cloud.",
  "guide.score.title": "A fire score",
  "guide.score.fire":
    "The score (0 to 100) says how likely it is a vegetation fire. It starts from the satellite confidence and rises with power and with the number of neighboring fires.",
  "guide.score.industrial":
    "If the fire sits on a known industrial source, or repeats in the same place for days with low power, the score drops a lot and it is marked as industrial heat.",
  "guide.score.fwi":
    "FWI (Fire Weather Index): combines temperature, humidity, wind and recent rain. It gives the day risk, from Low to Extreme. It does not measure fires: it measures how easily one would spread.",
  "guide.sim.title": "What is simulated and what the panel does not do",
  "guide.sim.fake":
    "The sensors and drones in demo mode are simulated: they move and measure with made-up data.",
  "guide.sim.real":
    "The fires, early warnings, weather, forecast and terrain are real.",
  "guide.sim.not":
    "The panel does not control drones, does not read real sensors and does not alert firefighters. Email and WhatsApp alerts do not work yet while the panel is closed.",
  "guide.store.title": "Where your data is kept",
  "guide.store.device":
    "On this device: your zones, notes and settings, the language, the theme and which parts of the guide you have seen.",
  "guide.store.cloud":
    "In the cloud: only if you signed in, your workspace syncs with your account.",
  "guide.store.nosync":
    "Without signing in, nothing leaves this device. Fires are not stored for offline use.",
};

export const ptGuide: typeof esGuide = {
  "guide.title": "Guia rápido",
  "guide.desc": "O que significa cada coisa do painel, em poucas linhas.",
  "guide.close": "Fechar o guia",
  "guide.link": "Ver o guia",
  "guide.openFromKeys": "Abrir o guia rápido",
  "guide.map.title": "O que você vê no mapa",
  "guide.map.fire":
    "Foco de satélite: um ponto laranja a vermelho. Quanto maior e mais vermelho, mais potência (FRP, em MW).",
  "guide.map.sat":
    "VIIRS é o foco de 375 m, o mais preciso. MODIS é de 1 km, mais grosso: só aparece se o VIIRS não viu o mesmo.",
  "guide.map.early":
    "Anel ciano grosso: alerta precoce. Um satélite que observa o tempo todo (GOES-19) viu calor e nenhum outro satélite confirmou ainda.",
  "guide.map.early2":
    "Anel cinza fino: esse alerta já foi confirmado por um satélite de órbita polar.",
  "guide.map.zone":
    "Zona (verde): uma área que você vigia. A cor mostra o risco e fica vermelha se tiver um alerta.",
  "guide.map.sim":
    "Sensor (anel turquesa) e drone (ponto verde): são simulados.",
  "guide.map.industrial":
    "Calor industrial oculto: fábricas, refinarias e outras fontes fixas emitem calor sem ser incêndios. O painel as tira do mapa e as conta à parte.",
  "guide.data.title": "De onde vêm os dados",
  "guide.data.intro":
    "Os focos são reais e vêm de satélites da NASA (FIRMS). Cada fonte tem seu atraso.",
  "guide.data.viirs":
    "VIIRS (NOAA-20 e NOAA-21): focos de 375 m, de 2 a 3 passagens por dia cada um. O painel os consulta a cada 30 minutos.",
  "guide.data.modis":
    "MODIS (Terra e Aqua): focos de 1 km. O Terra passa algumas horas antes dos VIIRS.",
  "guide.data.goes":
    "GOES-19: observa a Argentina a cada {scan} minutos com cerca de 20 minutos de atraso, mas com pixels de 2 a 4 km. É consultado a cada 5 minutos.",
  "guide.data.backup":
    "Se o FIRMS falhar, o painel usa o INPE como reserva; essa fonte não informa confiança nem dia ou noite.",
  "guide.data.terrain":
    "Combustível, elevação e declive de um ponto (ESA WorldCover e Copernicus) são consultados ao clicar em um foco.",
  "guide.early.title": "Alertas precoces e confiança",
  "guide.early.what":
    "Um alerta precoce fica aberto até que um satélite polar o confirme por perto. Quanto mais varreduras seguidas do GOES-19 virem o calor, mais provável é que seja real.",
  "guide.early.tiersIntro":
    "De cada 100 alertas de cada nível, esta quantidade foi confirmada depois por um satélite polar (medido em 28 dias):",
  "guide.early.tier.low": "Menos de {a} varreduras: {p} %",
  "guide.early.tier.mid": "De {a} a {b} varreduras: {p} %",
  "guide.early.tier.high": "{a} ou mais varreduras: {p} %",
  "guide.early.caveat":
    "É um dado histórico, não uma promessa. Um alerta sem confirmação pode ser alarme falso, um fogo pequeno que o outro satélite não viu ou uma nuvem.",
  "guide.score.title": "Pontuação de um foco",
  "guide.score.fire":
    "A pontuação (0 a 100) diz o quão provável é que seja um incêndio de vegetação. Parte da confiança do satélite e sobe com a potência e com a quantidade de focos vizinhos.",
  "guide.score.industrial":
    "Se o foco está sobre uma fonte industrial conhecida, ou se repete no mesmo lugar por dias com pouca potência, a pontuação cai muito e ele é marcado como calor industrial.",
  "guide.score.fwi":
    "FWI (índice meteorológico de perigo de incêndio): combina temperatura, umidade, vento e chuva recente. Dá o risco do dia, de Baixo a Extremo. Não mede fogos: mede o quão fácil seria um se propagar.",
  "guide.sim.title": "O que é simulado e o que o painel não faz",
  "guide.sim.fake":
    "Os sensores e os drones do modo demo são simulados: se movem e medem com dados inventados.",
  "guide.sim.real":
    "São reais os focos, os alertas precoces, o clima, a previsão e o terreno.",
  "guide.sim.not":
    "O painel não controla drones, não lê sensores reais e não avisa os bombeiros. Os avisos por e-mail e WhatsApp ainda não funcionam com o painel fechado.",
  "guide.store.title": "Onde ficam seus dados",
  "guide.store.device":
    "Neste dispositivo: suas zonas, notas e ajustes, o idioma, o tema e quais partes do guia você já viu.",
  "guide.store.cloud":
    "Na nuvem: só se você entrou na conta, seu espaço de trabalho é sincronizado com ela.",
  "guide.store.nosync":
    "Sem entrar, nada sai deste dispositivo. Os focos não são guardados para uso sem conexão.",
};
