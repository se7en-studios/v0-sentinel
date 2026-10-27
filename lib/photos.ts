// Única fuente de las fotos de la landing. Para reemplazar por fotos propias,
// cambiar solo este archivo (src, tamaño real, alt y pie).
export type Photo = {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Pie honesto: qué se ve y de dónde sale. */
  caption: string;
  /** Recorte recomendado con object-cover. */
  position?: string;
};

export const PHOTOS = {
  heroLandscape: {
    src: "/hero-forest.avif",
    width: 1074,
    height: 806,
    alt: "Bosque de la Patagonia andina",
    caption: "Bosque andino patagónico.",
  },
  // Fuego real a sangre en el hero (la mejor foto disponible; cambiar solo acá).
  heroFire: {
    src: "/problem-a1.jpg",
    width: 900,
    height: 674,
    alt: "Incendio forestal de noche junto a un lago en la Patagonia",
    caption: "Incendio forestal en la Patagonia andina. Foto aérea de archivo.",
    position: "center 60%",
  },
  landscape: {
    src: "/hero-forest.avif",
    width: 1074,
    height: 806,
    alt: "Bosque de la Patagonia andina",
    caption: "Bosque andino patagónico.",
  },
  problemWide: {
    src: "/problem-a1.jpg",
    width: 900,
    height: 674,
    alt: "Incendio forestal de noche junto a un lago en la Patagonia",
    caption: "Incendio forestal en la Patagonia andina. Foto aérea de archivo.",
  },
  problemTall1: {
    src: "/problem-a2.jpg",
    width: 900,
    height: 1125,
    alt: "Frente de fuego en la ladera de un cerro frente a un lago, con el cielo rojo de humo",
    caption: "Frente de fuego sobre un lago patagónico. Foto de archivo.",
  },
  problemTall2: {
    src: "/problem-a3.jpg",
    width: 900,
    height: 1125,
    alt: "Ladera ardiendo de noche sobre un lago, con árboles en primer plano",
    caption: "Ladera en llamas sobre un lago patagónico. Foto de archivo.",
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
