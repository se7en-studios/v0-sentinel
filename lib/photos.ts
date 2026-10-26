// Reemplazar por fotos propias: cambiar solo este archivo.
// Cada slot es { src, alt, width, height, caption }. width/height = tamaño real del archivo.
// Las captions dicen qué muestra la foto; no atribuyen autoría ni lugar exacto.

export type Photo = {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption: string;
};

export const PHOTOS = {
  heroFire: {
    src: "/a3.jpg",
    alt: "Incendio forestal de noche sobre una ladera frente a un lago patagónico, con el humo teñido de rojo y una hilera de casas y árboles oscuros en primer plano.",
    width: 1080,
    height: 1350,
    caption: "Incendio forestal en un lago de la Patagonia, de noche.",
  },
  problemWide: {
    src: "/problem-a1.jpg",
    alt: "Vista aérea nocturna de un incendio que avanza por un bosque, con llamas y humo naranja y una laguna a la izquierda.",
    width: 900,
    height: 674,
    caption: "Vista aérea de un frente de fuego avanzando sobre el bosque.",
  },
  problemTall1: {
    src: "/problem-a2.jpg",
    alt: "Incendio forestal visto desde lejos, con columnas de humo y fuego sobre las montañas.",
    width: 900,
    height: 1125,
    caption:
      "Columnas de humo sobre las sierras durante un incendio patagónico.",
  },
  problemTall2: {
    src: "/problem-a3.jpg",
    alt: "Ladera de bosque en llamas bajo un cielo cubierto de humo.",
    width: 900,
    height: 1125,
    caption: "Ladera en llamas bajo un cielo cubierto de humo.",
  },
  problemStack: {
    src: "/problem-a4.jpg",
    alt: "Tres fotos de un mismo incendio de noche: un lago con fuego en la montaña, una línea de llamas en la ladera y humo sobre el agua.",
    width: 900,
    height: 1125,
    caption: "Tres momentos de un mismo incendio forestal, de noche.",
  },
  awardsGroup: {
    src: "/logros-tile-0.jpg",
    alt: "Equipo de Sentinel junto a otros emprendedores sosteniendo carteles de premio en un evento de aceleración.",
    width: 640,
    height: 400,
    caption: "Entrega de premios a proyectos emprendedores.",
  },
  awardsStage: {
    src: "/logros-tile-4.jpg",
    alt: "Presentación en un escenario con una pantalla donde un integrante de Sentinel participa por videollamada.",
    width: 640,
    height: 400,
    caption:
      "Presentación del proyecto en un escenario, con un integrante conectado a distancia.",
  },
  awardsRoom: {
    src: "/logros-tile-3.jpg",
    alt: "Sala llena durante una ceremonia de premios con una pantalla grande en el escenario.",
    width: 640,
    height: 400,
    caption: "Ceremonia de premios con la sala completa.",
  },
  awardsCeremony: {
    src: "/logros-tile-1.jpg",
    alt: "Dos integrantes del equipo recibiendo un certificado en un acto formal.",
    width: 640,
    height: 400,
    caption: "Recepción de un certificado en un acto.",
  },
  awardsStrip: {
    src: "/logros.jpg",
    alt: "Collage de fotos del equipo en eventos y premios: entrega de premios, escenario, sala y mesas de trabajo.",
    width: 1920,
    height: 800,
    caption: "El equipo en distintos eventos y premios.",
  },
  landscape: {
    src: "/hero-forest.avif",
    alt: "Río y bosque patagónico.",
    width: 1920,
    height: 1080,
    caption: "Río y bosque en la Patagonia.",
  },
} satisfies Record<string, Photo>;

export type PhotoSlot = keyof typeof PHOTOS;
