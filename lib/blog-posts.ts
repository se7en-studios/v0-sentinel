export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  publishedAt: string; // ISO date
  keywords: string[];
  relatedLink: { href: string; label: string };
  pullQuote: string;
  body: {
    heading?: string;
    paragraphs: string[];
  }[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "deteccion-temprana-incendios-forestales",
    title: "El tiempo de detección lo es todo en un incendio forestal",
    excerpt:
      "Un incendio detectado en los primeros minutos se controla. Uno detectado horas después, arrasa. Así funciona la ventana de tiempo que decide todo.",
    coverImage: "/problem-a2.jpg",
    publishedAt: "2026-04-01",
    keywords: [
      "detección temprana de incendios forestales",
      "tiempo de respuesta ante incendios",
      "detección automatizada de incendios",
      "monitoreo forestal Patagonia",
    ],
    relatedLink: {
      href: "/#servicios",
      label: "Cómo funciona el sistema de detección de Sentinel",
    },
    pullQuote:
      "La diferencia entre esos tres escenarios no es la cantidad de recursos disponibles: es cuánto tiempo pasó entre que el fuego empezó y alguien se enteró.",
    body: [
      {
        paragraphs: [
          "Un incendio forestal no crece de forma lineal. En sus primeros minutos es un foco puntual que un solo brigadista puede sofocar con herramientas manuales. Treinta minutos después, con viento y vegetación seca de por medio, ya es un frente de varios metros que necesita una dotación completa. Dos horas después puede ser incontrolable. La diferencia entre esos tres escenarios no es la cantidad de recursos disponibles: es cuánto tiempo pasó entre que el fuego empezó y alguien se enteró.",
          "El método de detección más extendido en Argentina sigue siendo el mismo desde hace décadas: alguien lo ve (un puestero, un turista, un guardaparque) y lo reporta por teléfono o radio. Ese reporte depende de que haya alguien cerca, de que tenga señal, y de que la información llegue a la persona correcta. En la Patagonia, con distancias enormes y baja densidad poblacional, ese proceso puede tardar horas: el tiempo exacto que el fuego necesita para dejar de ser manejable.",
        ],
      },
      {
        heading: "Qué cambia con la detección automatizada",
        paragraphs: [
          "Un sistema de monitoreo automatizado no depende de que alguien esté mirando en el momento justo. Procesa datos de forma continua (hoy satelitales y geoespaciales; a futuro también sensores y drones), busca focos de calor incipientes y descarta falsos positivos (reflejos solares, superficies calientes no combustibles, actividad agrícola normal). Cuando confirma un foco, genera una alerta geolocalizada con el objetivo de que llegue en minutos, no en horas.",
          "Nuestra meta de diseño es que la detección ocurra en minutos desde que aparece el foco, sin intervención humana en el circuito de detección (todavía debemos validarlo en pilotos). Frente a las horas de un reporte tradicional, esa diferencia es, en términos prácticos, la que hay entre apagar un fuego con una mochila de agua y evacuar una zona.",
        ],
      },
      {
        heading: "Por qué esto importa más en la Patagonia",
        paragraphs: [
          "La combinación de bosques nativos de crecimiento lento (algunas especies como el ciprés o la araucaria tardan siglos en alcanzar su tamaño adulto), viento sostenido y territorios de difícil acceso hace que cualquier demora en la detección se multiplique en daño. No es solo el área quemada: es biodiversidad que no vuelve en una generación, y economías locales (turismo, ganadería, forestales) que dependen de ese territorio intacto.",
          "Por eso el foco de Sentinel no está solamente en '¿podemos ver el fuego?' sino en '¿en cuántos minutos lo vemos?'. Es la pregunta que determina si un incendio se convierte en una anécdota o en una tragedia.",
        ],
      },
    ],
  },
  {
    slug: "monitoreo-continuo-campos-y-forestales",
    title: "De reaccionar a predecir: monitoreo forestal continuo",
    excerpt:
      "Tus campos, tu monte, tu hacienda llevan años de inversión. La diferencia entre perderlo todo y protegerlo está en cuándo sabés lo que está pasando.",
    coverImage: "/problem-a1.jpg",
    publishedAt: "2026-04-01",
    keywords: [
      "monitoreo forestal continuo",
      "protección de campos y hacienda",
      "inteligencia territorial",
      "gestión de riesgo forestal Argentina",
    ],
    relatedLink: {
      href: "/#nosotros",
      label: "Conocé la plataforma de Sentinel",
    },
    pullQuote:
      "Pasar de reaccionar a predecir no es una frase de marketing: es literalmente la diferencia entre gestionar el riesgo y sufrirlo.",
    body: [
      {
        paragraphs: [
          "Un campo productivo, un monte forestal o un establecimiento ganadero representan años, a veces generaciones, de inversión y trabajo acumulado. Un incendio puede destruir esa inversión en horas. Lo que separa a los productores que logran proteger su patrimonio de los que lo pierden no es la suerte: es cuánto tiempo antes se enteraron de que algo estaba pasando en su territorio.",
          "La gestión tradicional de este riesgo es reactiva por diseño: se actúa después de que el fuego ya es visible, ya sea porque alguien lo reportó o porque el humo se ve desde la ruta. Para cuando el productor se entera, ya perdió la ventana en la que una intervención rápida hubiera cambiado el resultado.",
        ],
      },
      {
        heading:
          "El modelo de cuatro pasos: monitorear, detectar, contextualizar, alertar",
        paragraphs: [
          "Sentinel reemplaza ese modelo reactivo por un ciclo continuo de cuatro etapas. Primero, monitoreo autónomo: datos satelitales y geoespaciales cubren el territorio de forma programada, con sensores y drones sumándose de forma progresiva, sin que nadie tenga que pedirlo. Segundo, detección y verificación: los modelos de IA identifican anomalías térmicas y descartan falsos positivos antes de escalar nada. Tercero, contextualización: cada alerta se cruza con datos satelitales de macro-riesgo (humedad, viento, historial de la zona) para entender qué tan urgente es. Cuarto, alerta: la información llega a quien tiene que actuar, con coordenadas exactas, en minutos.",
          "Este ciclo corre solo, de forma continua, sin que el productor tenga que estar revisando cámaras o esperando un llamado. Es la diferencia entre tener un vigía ocasional y tener un sistema que nunca deja de mirar.",
        ],
      },
      {
        heading: "Datos precisos por hectárea, sin infraestructura compleja",
        paragraphs: [
          "Uno de los obstáculos históricos para este tipo de monitoreo en el sector agropecuario y forestal era la infraestructura: torres de vigilancia, personal dedicado, conectividad satelital costosa. Sentinel funciona como una plataforma cloud que no requiere que el productor instale nada complejo en el campo. El sistema aporta la cobertura aérea y el análisis, y el productor recibe alertas accionables en su dispositivo.",
          "El resultado no es solo prevención de incendios: es un registro histórico de datos ambientales por hectárea (focos de calor, patrones estacionales, zonas de mayor riesgo) que permite planificar, no solo reaccionar. Pasar de reaccionar a predecir no es una frase de marketing: es literalmente la diferencia entre gestionar el riesgo y sufrirlo.",
        ],
      },
    ],
  },
  {
    slug: "prevencion-vs-reaccion-incendios-forestales",
    title: "Lo que el fuego no perdona: prevención vs. reacción",
    excerpt:
      "El fuego no da segundas oportunidades. Lo que ya pasó, lo que no se ve, y lo que todavía se puede salvar si se actúa a tiempo.",
    coverImage: "/problem-a4.jpg",
    publishedAt: "2026-06-04",
    keywords: [
      "prevención de incendios forestales Argentina",
      "inteligencia territorial",
      "ecosistemas patagónicos",
      "detección temprana vs reacción",
    ],
    relatedLink: {
      href: "/#equipo",
      label: "Conocé al equipo detrás de Sentinel",
    },
    pullQuote:
      "Un incendio de dos hectáreas se apaga con una cuadrilla. Un incendio de dos mil hectáreas necesita aviones hidrantes, semanas de trabajo, y aun así puede no ser suficiente.",
    body: [
      {
        paragraphs: [
          "Cada temporada de incendios en Argentina deja la misma imagen: bosques milenarios reducidos a cenizas, comunidades evacuadas, brigadistas exponiéndose con recursos limitados frente a un frente de fuego que ya es demasiado grande para controlar. Es la consecuencia visible de llegar tarde. Pero antes de esa imagen hubo una amenaza silenciosa que nadie vio a tiempo: un foco de calor incipiente, en un lugar de difícil acceso, que nadie estaba mirando en ese momento exacto.",
          "La pregunta que define el resultado no es '¿tenemos los recursos para combatir el incendio?' sino '¿lo vimos a tiempo para que esos recursos alcancen?'. Un incendio de dos hectáreas se apaga con una cuadrilla. Un incendio de dos mil hectáreas necesita aviones hidrantes, semanas de trabajo, y aun así puede no ser suficiente.",
        ],
      },
      {
        heading: "La amenaza que no se ve es la que se puede prevenir",
        paragraphs: [
          "La inteligencia territorial (el uso de datos satelitales, información geoespacial y modelos de IA para vigilar el territorio de forma continua, con sensores y drones como expansión progresiva) existe exactamente para atacar esa amenaza invisible. No reemplaza a los brigadistas ni a los organismos de respuesta: les da la información que necesitan minutos después de que el riesgo aparece, en lugar de horas después de que el daño ya es irreversible.",
          "Esto cambia la naturaleza del trabajo de prevención. En lugar de esperar reportes ciudadanos o depender de guardaparques cubriendo territorios enormes, un sistema de monitoreo continuo identifica anomalías térmicas y picos de riesgo antes de que se conviertan en un incendio activo, permitiendo intervenir cuando todavía es una intervención simple.",
        ],
      },
      {
        heading: "Lo que se salva cuando la prevención funciona",
        paragraphs: [
          "Los bosques nativos de la Patagonia (cipreses, araucarias, lengas) tardan décadas o siglos en alcanzar el tamaño que el fuego destruye en horas. No es solo madera: es hábitat de fauna única, regulación hídrica de cuencas enteras, y la base económica de comunidades que dependen del turismo, la forestación y la ganadería. Ese es el costo real cuando la prevención llega tarde.",
          "En Sentinel, la misión no es apagar incendios: es evitar que existan como emergencias descontroladas. Usar innovación para salvar bosques significa, en la práctica, ganarle al fuego la única batalla que realmente importa: la del tiempo.",
        ],
      },
    ],
  },
  {
    slug: "drones-vs-camaras-fijas-deteccion-incendios",
    title: "Cámaras fijas y cobertura aérea: qué cambia en la detección",
    excerpt:
      "Las torres de cámaras fueron un salto respecto a la vigilancia humana. Pero tienen un techo estructural que la cobertura territorial, satelital o aérea, no tiene.",
    coverImage: "/ig-post-2.jpg",
    publishedAt: "2026-05-12",
    keywords: [
      "cámaras fijas vs cobertura territorial incendios",
      "tecnología de detección de incendios",
      "vigilancia forestal remota",
      "cámaras térmicas monitoreo forestal",
    ],
    relatedLink: {
      href: "/#capacidades",
      label: "Ver todas las capacidades de Sentinel",
    },
    pullQuote:
      "Una cámara fija vigila un punto. Un sistema de cobertura territorial vigila un área, y eso cambia por completo qué tan rápido se detecta un foco fuera de su campo de visión.",
    body: [
      {
        paragraphs: [
          "Nota: este artículo describe una etapa anterior de nuestro enfoque. Hoy Sentinel Cloud se apoya en datos satelitales y geoespaciales; los drones son una línea de expansión progresiva, no una flota operativa. Lo que sigue explica el concepto general.",
          "Durante años, la respuesta tecnológica al problema de la vigilancia forestal fueron las torres con cámaras fijas: mástiles altos, cámaras térmicas apuntando a un sector del territorio, y un operador humano (o un algoritmo simple) mirando el feed. Funcionan, pero tienen una limitación estructural que no se resuelve con más cámaras: cada torre solo ve lo que está dentro de su línea de visión directa.",
          "En terrenos montañosos o con cobertura boscosa densa, la norma en la Patagonia, eso significa zonas ciegas permanentes detrás de cada loma, cada bosque cerrado, cada quebrada. Cubrir un territorio grande con este modelo requiere multiplicar torres, cada una con su costo de instalación, mantenimiento y conectividad.",
        ],
      },
      {
        heading: "Qué resuelve la cobertura territorial que una torre no puede",
        paragraphs: [
          "Un medio aéreo, como un dron, no depende de una línea de visión fija: puede recorrer rutas programadas y redirigirse hacia una zona de interés. Es la línea que Sentinel contempla de forma progresiva; hoy la cobertura territorial de Sentinel Cloud se apoya en datos satelitales y geoespaciales, que tampoco tienen los puntos ciegos estructurales de la vigilancia fija.",
          "Esto no vuelve obsoletas a las cámaras fijas: en sitios de altísimo tránsito o riesgo constante, siguen teniendo sentido como complemento. Pero como estrategia principal de cobertura territorial extensa, el techo de las torres fijas es real: no importa cuántas cámaras agregues, seguís vigilando puntos, no territorio.",
        ],
      },
      {
        heading: "El otro factor: qué tan rápido se verifica una alerta",
        paragraphs: [
          "Una cámara fija que detecta humo genera una alerta que un humano tiene que revisar y confirmar: un cuello de botella que se agrava cuando hay múltiples cámaras y pocos operadores disponibles. El sistema de Sentinel usa visión computacional entrenada específicamente para descartar falsos positivos (neblina, polvo, reflejos) antes de que la alerta llegue a una persona, recortando el tiempo entre detección y confirmación de minutos u horas a segundos.",
          "La pregunta que importa no es solo '¿lo vimos?' sino '¿cuánto tardamos en confirmar que era real y avisar a quien tiene que actuar?'. Ahí es donde la combinación de cobertura dinámica más IA de verificación marca la diferencia frente a un modelo de cámaras fijas y revisión manual.",
        ],
      },
    ],
  },
  {
    slug: "costo-real-de-un-incendio-forestal",
    title:
      "El costo real de un incendio forestal (y por qué prevenir sale más barato)",
    excerpt:
      "Un incendio no solo cuesta lo que se quema. Cuesta la respuesta de emergencia, la pérdida productiva, y años de recuperación del ecosistema.",
    coverImage: "/a3.jpg",
    publishedAt: "2026-06-20",
    keywords: [
      "costo de incendios forestales",
      "impacto económico incendios Argentina",
      "prevención vs combate de incendios costo",
      "ROI monitoreo forestal",
    ],
    relatedLink: {
      href: "/#servicios",
      label: "Cómo funciona el sistema de detección de Sentinel",
    },
    pullQuote:
      "El costo de prevenir un incendio se mide en un abono de monitoreo. El costo de no prevenirlo se mide en aviones hidrantes, hectáreas perdidas y años de recuperación.",
    body: [
      {
        paragraphs: [
          "Cuando se habla del costo de un incendio forestal, la conversación suele quedarse en lo más visible: hectáreas quemadas. Pero esa cifra es solo la punta del iceberg. Está el costo de la respuesta de emergencia (aviones hidrantes, brigadas, combustible, horas de trabajo), el costo productivo (pasturas, forestación comercial, infraestructura rural destruida), y el costo ambiental de largo plazo, que no tiene una factura pero sí un impacto medible: pérdida de biodiversidad, erosión de suelo, alteración de cuencas hídricas que tardan años o décadas en recuperarse.",
          "Ese último punto es el que más se subestima. Un bosque nativo patagónico no se replanta como un cultivo: un ciprés o una araucaria pueden tardar entre 50 y 300 años en alcanzar su tamaño adulto. El 'costo' de esas hectáreas no se recupera en la próxima temporada. Se recupera, si acaso, en la próxima generación.",
        ],
      },
      {
        heading: "Por qué la prevención es matemáticamente más barata",
        paragraphs: [
          "La lógica económica de la prevención es simple pero se ignora seguido: cuanto antes se detecta un foco, menor es el recurso necesario para controlarlo, y esa relación no es lineal: crece de forma exponencial con el tiempo. Un foco de dos hectáreas se apaga con una cuadrilla y unas horas de trabajo. El mismo foco, ocho horas después, puede necesitar múltiples aviones hidrantes, semanas de operativo y una superficie cien veces mayor.",
          "Monitorear un territorio de forma continua con datos satelitales e IA tiene un costo previsible y recurrente: es, en esencia, un seguro operativo. Combatir un incendio que escaló por falta de detección temprana tiene un costo impredecible que puede multiplicar ese gasto muchas veces, sin garantía de que alcance para contener el daño.",
        ],
      },
      {
        heading:
          "Un modelo pensado para no exigir esa inversión por adelantado",
        paragraphs: [
          "Por eso Sentinel no pide una inversión de capital inicial para arrancar: el modelo es un piloto de 4 a 8 semanas, pensado para que municipios, brigadas forestales y grandes propietarios de tierra puedan validar el sistema en su propio territorio antes de comprometer presupuesto de largo plazo. La pregunta que buscamos que se hagan no es '¿podemos pagar la prevención?' sino '¿podemos pagar no tenerla?'.",
        ],
      },
    ],
  },
  {
    slug: "monitoreo-con-drones-para-incendios-forestales",
    title:
      "Monitoreo aéreo de incendios forestales: cómo se arma un sistema",
    excerpt:
      "Un dron con cámara volando al azar no es un sistema. Estas son las piezas de un monitoreo de incendios con rutas programadas, IA de verificación y alertas automáticas (los drones son una línea progresiva de Sentinel, no una flota operativa).",
    coverImage: "/problem-a3.jpg",
    publishedAt: "2026-07-31",
    keywords: [
      "monitoreo aéreo de incendios",
      "monitoreo de incendios",
      "drones para incendios forestales",
      "monitoreo aéreo forestal",
    ],
    relatedLink: {
      href: "/#servicios",
      label: "Ver cómo funciona el monitoreo de Sentinel paso a paso",
    },
    pullQuote:
      "El dron es el sensor. El sistema de monitoreo de incendios es todo lo que pasa después de que ese sensor capta una imagen.",
    body: [
      {
        paragraphs: [
          "Nota: este artículo describe una etapa anterior de nuestro enfoque. Hoy Sentinel Cloud se apoya en datos satelitales y geoespaciales; los drones son una línea de expansión progresiva, no una flota operativa. Lo que sigue explica el concepto general.",
          "Cuando alguien escucha 'monitoreo con drones' suele imaginarse un equipo pilotando un dron manualmente sobre el monte, mirando una pantalla. Esa imagen está desactualizada. El monitoreo de incendios forestales que realmente funciona a escala no depende de un piloto mirando una pantalla. Depende de una operación programada, repetible y verificada por IA, con intervención humana solo cuando hay algo real que decidir.",
          "Vale la pena desarmar el proceso paso a paso, porque ahí es donde se nota la diferencia entre un dron como juguete caro y un sistema de monitoreo como infraestructura de prevención.",
        ],
      },
      {
        heading: "Paso 1: rutas de vuelo programadas, no vuelos manuales",
        paragraphs: [
          "El territorio a cubrir se divide en zonas de riesgo, priorizadas según vegetación, historial de focos y accesibilidad para brigadas. Los drones vuelan esas rutas en horarios programados: no depende de que alguien decida 'hoy toca sobrevolar tal sector'. Esa regularidad es lo que convierte un sobrevuelo puntual en monitoreo continuo.",
        ],
      },
      {
        heading: "Paso 2: cámaras térmicas, no cámaras de video comunes",
        paragraphs: [
          "Un foco de calor incipiente muchas veces no es visible a simple vista todavía: puede estar bajo cobertura vegetal o recién empezando. Las cámaras térmicas detectan la firma de temperatura, no la imagen visible, lo que permite identificar un principio de incendio antes de que produzca humo visible desde el aire o desde tierra.",
        ],
      },
      {
        heading:
          "Paso 3: IA que filtra falsos positivos antes de alertar a un humano",
        paragraphs: [
          "Esta es la parte que más diferencia a un sistema de monitoreo de incendios serio de uno amateur. No toda fuente de calor es un incendio: rocas calentadas por el sol, maquinaria agrícola, quemas controladas autorizadas. Un modelo de IA entrenado con miles de casos reales descarta automáticamente esos falsos positivos, para que la alerta que llega a un humano sea, con altísima probabilidad, un foco real.",
          "Sin ese filtro, un sistema de monitoreo con drones satura de alertas falsas a quien tiene que decidir, y termina generando el mismo problema que quería resolver: gente ignorando avisos.",
        ],
      },
      {
        heading: "Paso 4: alerta geolocalizada a quien puede actuar",
        paragraphs: [
          "Confirmado el foco, el sistema genera una alerta con coordenadas exactas que llega directo a bomberos, brigadas o al equipo de gestión del territorio, no a una bandeja de entrada que alguien revisa cada tanto. En Sentinel, la meta de diseño es que ese circuito completo (captura, detección, verificación, alerta) tarde pocos minutos desde que aparece el foco; todavía debemos validarlo en pilotos.",
        ],
      },
    ],
  },
  {
    slug: "la-solucion-a-incendios-forestales",
    title:
      "La solución a incendios forestales: qué tiene que tener un sistema real",
    excerpt:
      '"Solución a incendios forestales" se usa mucho y se define poco. Estos son los cuatro componentes que separan una solución real de un parche.',
    coverImage: "/features-d.jpg",
    publishedAt: "2026-07-31",
    keywords: [
      "solución a incendios forestales",
      "soluciones a incendios",
      "sistema de monitoreo de incendios",
      "prevención de incendios forestales Argentina",
    ],
    relatedLink: {
      href: "/#nosotros",
      label: "Conocé la solución de Sentinel de punta a punta",
    },
    pullQuote:
      "Una solución a incendios forestales no es un producto: es un circuito completo: detectar, verificar, alertar y aprender de cada temporada.",
    body: [
      {
        paragraphs: [
          "\"Solución a incendios forestales\" es una frase que se usa para casi cualquier cosa: una app, un dron, una cámara, un número de teléfono de emergencia. El problema es que ninguna de esas cosas por separado resuelve el problema real, que no es 'ver el fuego' sino 'actuar antes de que sea demasiado tarde'. Después de trabajar en detección temprana en la Patagonia, en Sentinel identificamos cuatro componentes que tiene que tener cualquier solución que se tome en serio, y sin los cuales es, en el mejor de los casos, un parche.",
        ],
      },
      {
        heading: "1. Cobertura continua, no puntual",
        paragraphs: [
          "Un sobrevuelo ocasional o una cámara fija en un solo punto alto cubre una fracción del territorio y deja el resto a ciegas. La cobertura tiene que ser sistemática y repetida, priorizando las zonas de mayor riesgo según vegetación y clima, no solo las de mejor acceso.",
        ],
      },
      {
        heading: "2. Detección automatizada con verificación por IA",
        paragraphs: [
          "Como desarrollamos en la nota sobre monitoreo aéreo, el paso que más diferencia a un sistema real es el filtro de falsos positivos. Sin IA de verificación, cualquier sistema de monitoreo termina generando ruido en vez de señal, y el ruido se ignora.",
        ],
      },
      {
        heading: "3. Alertas que llegan a quien decide, en minutos",
        paragraphs: [
          "Detectar un foco y no avisar a tiempo a quien puede actuar es lo mismo que no detectarlo. La alerta tiene que ser automática, geolocalizada y llegar directo a bomberos, brigadas o al gestor del territorio, sin pasos manuales intermedios que agreguen minutos que no sobran.",
        ],
      },
      {
        heading: "4. Datos que se acumulan temporada a temporada",
        paragraphs: [
          "Una solución real no reinicia en cero cada verano. Cada foco detectado, cada falso positivo descartado y cada patrón de riesgo queda como dato histórico que mejora la precisión del sistema y permite anticipar zonas críticas antes de que empiece la temporada de incendios.",
          "Estos cuatro puntos son, en definitiva, la diferencia entre comprar un dron y tener una solución a incendios forestales. Es la distinción que buscamos que quede clara antes de que cualquier municipio, brigada o productor invierta en un sistema de monitoreo.",
        ],
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
