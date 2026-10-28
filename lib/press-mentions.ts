export type PressTag = "ILAN" | "Sadosky" | "JIJE" | "Premios Verdes" | "Perfil";

export interface PressMention {
  tag: PressTag;
  outlet: string;
  title: string;
  url: string;
  date: string; // ISO date, "" if unknown
  image: string; // og:image pulled from the live article, "" if none found
}

// ponytail: every entry here was verified by fetching the live article and
// confirming it's actually about this Sentinel (UTN San Rafael, ILAN/Sadosky
// drones-for-wildfires) before adding it — don't add a mention without doing
// the same, misattributing press coverage on your own site is worse than
// not having the section. `image` is the outlet's own og:image, hotlinked
// (not re-hosted) — standard practice for "as seen in" press sections.
export const pressMentions: PressMention[] = [
  {
    tag: "Premios Verdes",
    outlet: "Infobae",
    title: "El mapa de la sostenibilidad en América Latina: saberes ancestrales y nuevas tecnologías enfrentan a la crisis climática",
    url: "https://www.infobae.com/america/medio-ambiente/2026/10/21/el-mapa-de-la-sostenibilidad-en-america-latina-los-saberes-ancestrales-y-las-nuevas-tecnologias-que-enfrentan-a-la-crisis-climatica/",
    date: "2026-10-21",
    // ponytail: nombra a Sentinel como finalista argentino de Premios Verdes 2026 (drones, sensores, satélite e IA).
    // Su og:image lleva token de acceso: si deja de cargar, el badge cae a la inicial del medio.
    image: "https://www.infobae.com/resizer/v2/2LDQDFQDWNCLTCOUTR3IEO6V24.png?auth=86ecd856d943b682f751b869079cddd023c03106c77ccc5b7266a8bc917ffb97&smart=true&width=1024&height=512&quality=85",
  },
  {
    tag: "ILAN",
    outlet: "UTN",
    title: "Finalizó la competencia ILAN a la innovación Universitaria UTN",
    url: "https://www.utn.edu.ar/es/articulos-slider-principal/finalizo-la-competencia-ilan-a-la-innovacion-universitaria-utn",
    date: "2025-05-22",
    // ponytail: la nota no tiene og:image propio -> foto real del equipo
    // recibiendo el premio ILAN (no es la foto del medio, es nuestra).
    image: "/logros-tile-1.jpg",
  },
  {
    tag: "Sadosky",
    outlet: "CESSI",
    title: "Premios Sadosky | Conocé los ganadores 2025",
    url: "https://cessi.org.ar/2025/11/27/premios-sadosky-conoce-los-ganadores-2025/",
    date: "2025-11-27",
    // ponytail: sin og:image -> foto real de la ceremonia de Premios Sadosky.
    image: "/logros-tile-3.jpg",
  },
  {
    tag: "Sadosky",
    outlet: "Canal-AR",
    title: "¿Quiénes ganaron los Premios Sadosky 2025?",
    url: "https://www.canal-ar.com.ar/33894-Quienes-ganaron-los-Premios-Sadosky-2025.html",
    date: "2025-11-27",
    image: "https://www.canal-ar.com.ar/noticias/images/c_sadosky_271125_r.jpg",
  },
  {
    tag: "Perfil",
    outlet: "Diario San Rafael",
    title:
      "Sentinel: innovación sanrafaelina que usa drones e IA para detectar incendios forestales en sus primeros minutos",
    url: "https://diariosanrafael.com.ar/sentinel-innovacion-sanrafaelina-que-usa-drones-e-ia-para-detectar-incendios-forestales-en-sus-primeros-minutos/",
    date: "2025-12-03",
    image:
      "https://diariosanrafael.com.ar/wp-content/uploads/2025/12/584403991_18330180610215927_3274833551287552136_n-1.jpg",
  },
  {
    tag: "ILAN",
    outlet: "Diario San Rafael",
    title:
      "Alumnos de la UTN San Rafael ganaron el primer puesto en el Premio ILAN con drones para prevenir incendios",
    url: "https://diariosanrafael.com.ar/alumnos-de-la-utn-san-rafael-ganaron-el-primer-puesto-en-el-premio-ilan-con-drones-para-prevenir-incendios/",
    date: "2025-05-30",
    image:
      "https://diariosanrafael.com.ar/wp-content/uploads/2025/05/Angel-Quiles-premio-1.jpg",
  },
  {
    tag: "ILAN",
    outlet: "Diario San Rafael",
    title:
      'Estudiantes sanrafaelinos y un novedoso proyecto de drones para "detección temprana" de incendios forestales',
    url: "https://diariosanrafael.com.ar/estudiantes-sanrafaelinos-y-un-novedoso-proyecto-de-drones-para-deteccion-temprana-de-incendios-forestales/",
    date: "2025-05-28",
    image:
      "https://diariosanrafael.com.ar/wp-content/uploads/2025/05/500273926_991719906282947_1319131999786875425_n.jpg",
  },
  {
    tag: "ILAN",
    outlet: "Diario Río Negro",
    title:
      "El ingenioso invento de estudiantes universitarios para la detección temprana de incendios forestales",
    url: "https://www.rionegro.com.ar/sociedad/el-ingenioso-invento-de-estudiantes-universitarios-para-la-deteccion-temprana-de-incendios-forestales/",
    date: "2025-06-08",
    image:
      "https://www.rionegro.com.ar/wp-content/uploads/2025/06/4_15624d.jpg?w=1200&h=630&crop=1&resize=1200,630",
  },
  {
    tag: "Sadosky",
    outlet: "Mediamendoza",
    title:
      "Sentinel, el proyecto de estudiantes de la UTN ganó el Premio Sadosky a la Innovación Transformadora",
    url: "https://mediamendoza.com/san_rafael/243402-Sentinel-el-proyecto-de-estudiantes-de-la-UTN-gano-el-Premio-Sadosky-a-la-Innovacion-Transformadora",
    date: "2025-11-27",
    image:
      "https://mediamendoza.com/resizer.asp?archivo=2025/592213215_1453002143492098_4813461635530598040_n.jpg&width=640&height=480&formato=webp",
  },
  {
    tag: "ILAN",
    outlet: "Mediamendoza",
    title:
      "Alumnos de la UTN San Rafael crearon un dron con IA para prevenir incendios forestales",
    url: "https://mediamendoza.com/san_rafael/237887-Alumnos-de-la-UTN-San-Rafael-crearon-un-dron-con-IA-para-prevenir-incendios-forestales",
    date: "2025-06-18",
    image:
      "https://mediamendoza.com/resizer.asp?archivo=2025/WhatsApp Image 2025-06-17 at 15.49.09.jpeg&width=640&height=480&formato=webp",
  },
  {
    tag: "ILAN",
    outlet: "VientoSur Noticias",
    title:
      "Sentinel: el proyecto que detecta incendios con drones e inteligencia artificial",
    url: "https://vientosurnoticias.com.ar/sentinel-el-proyecto-que-detecta-incendios-con-drones-e-inteligencia-artificial/",
    date: "2025-05-27",
    image:
      "https://vientosurnoticias.com.ar/wp-content/uploads/2025/05/a01-scaled.jpg",
  },
  {
    tag: "Perfil",
    outlet: "Revista Divergente",
    title:
      "Sentinel, el innovador sistema creado por alumnos de Ingeniería de la UTN",
    url: "https://revistadivergente.com/notas/7423-sentinel-el-innovador-sistema-creado-por-alumnos-de-ingenieria-de-la-utn/",
    date: "2025-12-15",
    image:
      "https://www.revistadivergente.com/images/notas/id_7423_principal_6940073638194.webp",
  },
  {
    tag: "Premios Verdes",
    outlet: "Vistazo",
    title: "Premios Verdes 2026: 52 proyectos de innovación ambiental de 12 países llegan a Ecuador",
    url: "https://www.vistazo.com/sostenibilidad/2026-10-05-premios-verdes-52-proyectos-innovacion-ambiental-12-paises-llegan-ecuador-OE11261438",
    date: "2026-10-05",
    // ponytail: nombra a Sentinel entre los proyectos argentinos de la edición; no lo llama finalista, así que no lo afirmamos.
    image: "https://www.vistazo.com/binrepository/1148x601/103c1/600d600/none/12727/EGJO/premios-verdes-2026-2750564-2750564_2750564_20261005111239.jpg",
  },
  {
    tag: "Perfil",
    outlet: "Infonegocios",
    title: "Sentinel, la tecnología que puede llegar antes que los bomberos con drones e IA (espera salir al mercado en 2027)",
    url: "https://infonegocios.info/default/sentinel-la-tecnologia-que-puede-llegar-antes-que-los-bomberos-con-drones-e-ia-espera-salir-al-mercado-en-2027",
    date: "2025-12-12",
    image: "https://infonegocios.info/images/resize/602011-1200x675.webp",
  },
  {
    tag: "Perfil",
    outlet: "ITSitio",
    title: "Sentinel, la startup argentina que quiere anticiparse a los incendios forestales con drones autónomos e inteligencia artificial",
    url: "https://www.itsitio.com/ar/soluciones/sentinel-la-startup-argentina-que-quiere-anticiparse-a-los-incendios-forestales-con-drones-autonomos-e-inteligencia-artificial/",
    date: "2025-12-01",
    image: "",
  },
  {
    tag: "JIJE",
    outlet: "UNL",
    title: "Ganadores JIJE 2025: Sentinel, mejor modelo de negocios",
    url: "https://www.unl.edu.ar/jije/2025/10/24/ganadores-jije-2025/",
    date: "2025-10-24",
    image: "/logros-tile-4.jpg",
  },
  {
    tag: "ILAN",
    outlet: "Agencia NOVA",
    title: "Crearon un dron que detecta incendios forestales en 5 minutos y ganaron un premio internacional",
    url: "https://agencianova.com/nota.asp?id=153482&id_tiponota=11&n=2025_6_4",
    date: "2025-06-02",
    image: "https://www.agencianova.com/data/fotos2/bbx_671225741_654hdf6554yw.jpeg",
  },
  {
    tag: "ILAN",
    outlet: "InfoYa",
    title: "Estudiantes de la UTN San Rafael ganaron concurso nacional de innovación",
    url: "https://www.diarioinfoya.com.ar/san-rafael/estudiantes-de-la-utn-san-rafael-ganaron-concurso-nacional-de-innovacion/",
    date: "2025-05-27",
    image: "https://www.diarioinfoya.com.ar/files/image/54/54392/6835f064b137f_600_315!.jpg?s=285c8df8cf2c25f657c35f46ff3d81ac&d=1753217017",
  },
  {
    tag: "ILAN",
    outlet: "UTN",
    title: "Los diez proyectos finalistas que participaron de la final ILAN UTN 2025",
    url: "https://www.utn.edu.ar/es/articulos-slider-principal/los-diez-proyectos-finalistas-que-participaran-de-la-final-ilan-utn-2025",
    date: "2025-05-22",
    image: "/photos/premios-ilan-equipo.webp",
  },
];
