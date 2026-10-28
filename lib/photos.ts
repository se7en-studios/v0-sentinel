import type { Lang } from "@/lib/i18n";

// Única fuente de las fotos de la landing. Para reemplazar por fotos propias,
// cambiar solo este archivo (src, tamaño real, alt, pie y crédito).
// Las fotos de incendios y las imágenes satelitales salen de Wikimedia Commons / NASA / Copernicus
// con licencias libres: el crédito y la licencia son OBLIGATORIOS y se muestran junto a cada foto.
export type Photo = {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Pie honesto: qué se ve y cuándo. */
  caption: string;
  /** Recorte recomendado con object-cover. */
  position?: string;
  /** Crédito legal (autor, licencia, página de origen). Ausente si la foto es propia. */
  credit?: { author: string; license: string; licenseUrl?: string; source: string };
};

/** Texto corto del crédito para el pie de foto: «Foto: autor · licencia». */
export function creditLine(p: Photo, lang: Lang = "es"): string {
  if (!p.credit) return "";
  const pd = p.credit.license === "Dominio público";
  if (lang === "en") return `${pd ? "Image" : "Photo"}: ${p.credit.author} · ${pd ? "Public domain" : p.credit.license}`;
  return `${pd ? "Imagen" : "Foto"}: ${p.credit.author} · ${p.credit.license}`;
}

// Textos en inglés (alt y pie) por src; el resto de cada foto no cambia.
const EN: Record<string, { alt: string; caption: string }> = {
  "/photos/hero-incendio-noche.webp": { alt: "Wildfire at night: a wall of smoke and orange flames behind a row of trees", caption: "Wildfire at night with a column of smoke over a grove of trees." },
  "/photos/foco-atardecer.webp": { alt: "Active fire hotspot with flames under a sunset sky in the Patagonian Andes", caption: "Active fire hotspot in Patagonia, January 2026." },
  "/photos/foco-llamas.webp": { alt: "Tall flames of a forest fire beside a road in the mountains", caption: "Flame front in a mountain wildfire, January 2026." },
  "/photos/brigadistas-llamas.webp": { alt: "Firefighters fighting a flame front with hoses on a road", caption: "Firefighters facing an active hotspot, January 2026." },
  "/photos/brigadistas-orilla.webp": { alt: "Two firefighters with a hose next to a hotspot among smoke and mountains", caption: "Firefighters with a hose next to a hotspot, January 2026." },
  "/photos/brigadista-manguera.webp": { alt: "Silhouette of a firefighter aiming a hose at the flames at night", caption: "Firefighter fighting the fire at night, February 2026." },
  "/photos/brigadista-humo.webp": { alt: "A firefighter standing on a ridge in dense smoke", caption: "Firefighter on a ridge in the smoke, January 2026." },
  "/photos/brigadista-mochila.webp": { alt: "A firefighter with water gear among burned trees and smoke", caption: "Firefighter with a water backpack in the burned forest, January 2026." },
  "/photos/epuyen-lago.webp": { alt: "Lake at sunset with the sky tinted by wildfire smoke, Epuyén", caption: "Sunset with smoke over a lake near Epuyén, January 2026." },
  "/photos/valle-humo.webp": { alt: "Mountain valley with a column of smoke and burned trees in the foreground", caption: "Column of smoke over a mountain valley, January 2026." },
  "/photos/restos-camino.webp": { alt: "Gravel road between burned trees with mountains in the background", caption: "Road through burned forest in the mountains, January 2026." },
  "/photos/monte-quemado.webp": { alt: "Person standing in a forest of charred trunks after a fire", caption: "Burned conifer forest, January 2026." },
  "/photos/alerces-columna.webp": { alt: "Large column of wildfire smoke over Los Alerces National Park", caption: "Smoke column in Los Alerces National Park, February 2024." },
  "/photos/color-incendio.webp": { alt: "Red sun through wildfire smoke over a wooded hillside", caption: "The sun through wildfire smoke, January 2026." },
  "/photos/sat-chubut.webp": { alt: "Sentinel-2 satellite image of the fires in Chubut with burn scars and smoke columns", caption: "Sentinel-2 image of the fires in Chubut, January 11, 2026." },
  "/photos/sat-alerces.webp": { alt: "Sentinel-2 satellite image of Los Alerces National Park with smoke and a burn scar", caption: "Sentinel-2 image of Los Alerces National Park, January 2024." },
  "/photos/sat-nasa-patagonia.webp": { alt: "NASA satellite image with a smoke column over Patagonia", caption: "NASA image of a wildfire smoke column in Patagonia, February 2025." },
  "/logros-tile-0.jpg": { alt: "The Sentinel team with the other Prendete finalist projects", caption: "Programa Prendete, CICE." },
  "/logros-tile-4.jpg": { alt: "Sentinel presenting on a stage, with the team connected by video call", caption: "Presentation at an entrepreneurship event." },
  "/logros-tile-3.jpg": { alt: "Room at the Premios Sadosky ceremony", caption: "Premios Sadosky." },
};

/** Copia de la foto con alt y pie en el idioma pedido (src, recorte y crédito quedan igual). */
export function localizePhoto(photo: Photo, lang: Lang): Photo {
  const en = lang === "en" ? EN[photo.src] : undefined;
  return en ? { ...photo, ...en } : photo;
}

export const PHOTOS = {
  heroFire: {
    src: "/photos/hero-incendio-noche.webp",
    width: 2000,
    height: 1125,
    alt: "Incendio de noche: una cortina de humo y llamas naranjas detrás de una hilera de árboles",
    caption: "Incendio de noche con una columna de humo sobre una arboleda.",
    position: "center 85%",
    // TODO(dueño): sin autor, fecha ni lugar confirmados. Si no es una foto propia, agregar `credit`
    // (autor, licencia, fuente): el crédito se muestra solo en el hero.
  },
  problemWide: {
    src: "/photos/foco-atardecer.webp",
    width: 2560,
    height: 1707,
    alt: "Foco de incendio activo con llamas bajo un cielo de atardecer en la cordillera patagónica",
    caption: "Foco de incendio activo en la Patagonia, enero de 2026.",
    position: "center 50%",
    credit: {
      author: "CatrielGB",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source: "https://commons.wikimedia.org/wiki/File:Foco_de_incendio_1.jpg",
    },
  },
  problemFlames: {
    src: "/photos/foco-llamas.webp",
    width: 2560,
    height: 1707,
    alt: "Llamas altas de un incendio forestal junto a un camino en la cordillera",
    caption: "Frente de llamas en un incendio de la cordillera, enero de 2026.",
    position: "center",
    credit: {
      author: "CatrielGB",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source: "https://commons.wikimedia.org/wiki/File:Foco_de_incendio_2.jpg",
    },
  },
  problemBrigade: {
    src: "/photos/brigadistas-llamas.webp",
    width: 1920,
    height: 1280,
    alt: "Brigadistas combatiendo un frente de llamas con mangueras sobre un camino",
    caption: "Brigadistas frente a un foco activo, enero de 2026.",
    position: "center",
    credit: {
      author: "CatrielGB",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source: "https://commons.wikimedia.org/wiki/File:Brigadistas_1.jpg",
    },
  },
  problemShore: {
    src: "/photos/brigadistas-orilla.webp",
    width: 1920,
    height: 1280,
    alt: "Dos brigadistas con una manguera junto a un foco entre humo y montañas",
    caption: "Brigadistas con manguera junto a un foco, enero de 2026.",
    position: "center",
    credit: {
      author: "CatrielGB",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source: "https://commons.wikimedia.org/wiki/File:Brigadistas_2.jpg",
    },
  },
  problemHose: {
    src: "/photos/brigadista-manguera.webp",
    width: 1920,
    height: 1280,
    alt: "Silueta de un brigadista apuntando una manguera a las llamas de noche",
    caption: "Brigadista combatiendo el fuego de noche, febrero de 2026.",
    position: "center",
    credit: {
      author: "Nicolás Palacios",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source: "https://commons.wikimedia.org/wiki/File:Incendio_forestal_Patagonia_Argentina_cambio_clim%C3%A1tico-_sequias_extremas.jpg",
    },
  },
  brigadeSmoke: {
    src: "/photos/brigadista-humo.webp",
    width: 1920,
    height: 1280,
    alt: "Un brigadista de pie en una cresta entre humo denso",
    caption: "Brigadista en una cresta entre humo, enero de 2026.",
    position: "68% center",
    credit: {
      author: "CatrielGB",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source: "https://commons.wikimedia.org/wiki/File:Brigadista_1.jpg",
    },
  },
  brigadePack: {
    src: "/photos/brigadista-mochila.webp",
    width: 1920,
    height: 1280,
    alt: "Un brigadista con equipo de agua entre árboles quemados y humo",
    caption: "Brigadista con mochila de agua en el bosque quemado, enero de 2026.",
    position: "center",
    credit: {
      author: "CatrielGB",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source: "https://commons.wikimedia.org/wiki/File:Brigadista_con_mochila_para_incendios.jpg",
    },
  },
  landscape: {
    src: "/photos/epuyen-lago.webp",
    width: 2560,
    height: 1707,
    alt: "Lago al atardecer con el cielo teñido por el humo de un incendio, Epuyén",
    caption: "Atardecer con humo sobre un lago cerca de Epuyén, enero de 2026.",
    position: "center 60%",
    credit: {
      author: "CatrielGB",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source: "https://commons.wikimedia.org/wiki/File:Incendio_en_el_Cerro_Epuyen.jpg",
    },
  },
  valleySmoke: {
    src: "/photos/valle-humo.webp",
    width: 1920,
    height: 1280,
    alt: "Valle de montaña con una columna de humo y árboles quemados en primer plano",
    caption: "Columna de humo sobre un valle cordillerano, enero de 2026.",
    position: "center",
    credit: {
      author: "CatrielGB",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source: "https://commons.wikimedia.org/wiki/File:Incendios_que_no_paran.jpg",
    },
  },
  aftermathRoad: {
    src: "/photos/restos-camino.webp",
    width: 1920,
    height: 1280,
    alt: "Camino de ripio entre árboles quemados con montañas al fondo",
    caption: "Camino entre bosque quemado en la cordillera, enero de 2026.",
    position: "center",
    credit: {
      author: "CatrielGB",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source: "https://commons.wikimedia.org/wiki/File:Restos_de_Incendios.jpg",
    },
  },
  burnedForest: {
    src: "/photos/monte-quemado.webp",
    width: 1920,
    height: 1280,
    alt: "Persona de pie en un bosque de troncos carbonizados tras un incendio",
    caption: "Bosque de coníferas quemado, enero de 2026.",
    position: "center",
    credit: {
      author: "CatrielGB",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source: "https://commons.wikimedia.org/wiki/File:Monte_quemado.jpg",
    },
  },
  smokeColumn: {
    src: "/photos/alerces-columna.webp",
    width: 1920,
    height: 1277,
    alt: "Gran columna de humo de un incendio sobre el Parque Nacional Los Alerces",
    caption: "Columna de humo en el Parque Nacional Los Alerces, febrero de 2024.",
    position: "center",
    credit: {
      author: "Nicolás Palacios",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source: "https://commons.wikimedia.org/wiki/File:Incendio_en_Parque_Nacional_Los_Alerces_01.jpg",
    },
  },
  sunSmoke: {
    src: "/photos/color-incendio.webp",
    width: 1920,
    height: 1280,
    alt: "Sol rojo entre el humo de un incendio sobre una ladera boscosa",
    caption: "El sol entre el humo de un incendio, enero de 2026.",
    position: "center",
    credit: {
      author: "CatrielGB",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source: "https://commons.wikimedia.org/wiki/File:El_color_del_incendio.jpg",
    },
  },
  satChubut: {
    src: "/photos/sat-chubut.webp",
    width: 2560,
    height: 1810,
    alt: "Imagen satelital Sentinel-2 de los incendios en Chubut con cicatrices de quema y columnas de humo",
    caption: "Imagen Sentinel-2 de los incendios en Chubut, 11 de enero de 2026.",
    position: "center",
    credit: {
      author: "Unión Europea, datos Copernicus Sentinel-2",
      license: "Copernicus (atribución)",
      licenseUrl: "",
      source: "https://commons.wikimedia.org/wiki/File:Fires_in_the_Province_of_Chubut,_Argentina_(Copernicus_2026-01-18).png",
    },
  },
  satAlerces: {
    src: "/photos/sat-alerces.webp",
    width: 1920,
    height: 1358,
    alt: "Imagen satelital Sentinel-2 del Parque Nacional Los Alerces con humo y cicatriz de quema",
    caption: "Imagen Sentinel-2 del Parque Nacional Los Alerces, enero de 2024.",
    position: "center",
    credit: {
      author: "Unión Europea, datos Copernicus Sentinel-2",
      license: "Copernicus (atribución)",
      licenseUrl: "",
      source: "https://commons.wikimedia.org/wiki/File:Wildfires_rage_in_Argentina%E2%80%99s_Los_Alerces_National_Park_(Copernicus_2024-02-01).jpg",
    },
  },
  satNasa: {
    src: "/photos/sat-nasa-patagonia.webp",
    width: 1920,
    height: 1280,
    alt: "Imagen satelital de la NASA con una columna de humo sobre la Patagonia",
    caption: "Imagen de la NASA con la columna de humo de un incendio en la Patagonia, febrero de 2025.",
    position: "center",
    credit: {
      author: "NASA Earth Observatory",
      license: "Dominio público",
      licenseUrl: "",
      source: "https://commons.wikimedia.org/wiki/File:Fires_Rage_in_Patagonia_(153929_-_firespatagonia_amo_20250209_lrg).jpg",
    },
  },
  // Los tres reconocimientos son recortes de un collage: la franja inferior
  // (~7 %) trae un borde ajeno, por eso conviene object-top y proporción 16:9.
  awardsGroup: {
    src: "/logros-tile-0.jpg",
    width: 640,
    height: 375,
    alt: "El equipo de Sentinel con los demás proyectos finalistas de Prendete",
    caption: "Programa Prendete, CICE.",
    position: "top",
  },
  awardsStage: {
    src: "/logros-tile-4.jpg",
    width: 640,
    height: 375,
    alt: "Presentación de Sentinel en un escenario, con el equipo conectado por videollamada",
    caption: "Presentación en un evento de emprendedores.",
    position: "top",
  },
  awardsRoom: {
    src: "/logros-tile-3.jpg",
    width: 640,
    height: 375,
    alt: "Sala de los Premios Sadosky",
    caption: "Premios Sadosky.",
    position: "top",
  },
} as const satisfies Record<string, Photo>;
