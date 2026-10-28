// Ids de las secciones de la home (los usan el scroll activo y los enlaces del pie).
export const SECTIONS = [
  { id: "inicio", label: "Inicio", nav: false },
  { id: "problema", label: "El problema", nav: false },
  { id: "plataforma", label: "Cómo funciona", nav: true },
  { id: "en-vivo", label: "En vivo", nav: true },
  { id: "para-quien", label: "Para quién", nav: true },
  { id: "equipo", label: "Quiénes somos", nav: true },
  { id: "contacto", label: "Contacto", nav: false },
] as const;

// Etiquetas en inglés por id de sección (la versión en español está en SECTIONS).
export const SECTION_LABELS_EN: Record<(typeof SECTIONS)[number]["id"], string> = {
  inicio: "Home",
  problema: "The problem",
  plataforma: "How it works",
  "en-vivo": "Live",
  "para-quien": "Who it's for",
  equipo: "About us",
  contacto: "Contact",
};
