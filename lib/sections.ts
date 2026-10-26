// Única fuente de las secciones de la home: navbar y SectionDots la comparten.
// `nav: true` = también aparece en la barra superior (los dots muestran todas).
// El orden es el del relato en app/page.tsx.
export const SECTIONS = [
  { id: "inicio", label: "Inicio", nav: false },
  { id: "recorrido", label: "Recorrido", nav: false },
  { id: "plataforma", label: "Plataforma", nav: true },
  { id: "en-vivo", label: "En vivo", nav: true },
  { id: "para-quien", label: "Para quién", nav: true },
  { id: "equipo", label: "Equipo", nav: true },
  { id: "faq", label: "FAQ", nav: false },
  { id: "contacto", label: "Contacto", nav: true },
] as const;
