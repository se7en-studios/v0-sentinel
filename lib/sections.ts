// Única fuente de las secciones de la home: navbar y SectionDots la comparten.
// `nav: true` = también aparece en la barra superior (los dots muestran todas).
export const SECTIONS = [
  { id: "inicio", label: "Inicio", nav: true },
  { id: "recorrido", label: "Recorrido", nav: false },
  { id: "nosotros", label: "Solución", nav: true },
  { id: "capacidades", label: "Capacidades", nav: false },
  { id: "servicios", label: "Servicios", nav: true },
  { id: "equipo", label: "Equipo", nav: true },
  { id: "noticias", label: "Logros", nav: true },
  { id: "prensa", label: "Prensa", nav: false },
  { id: "faq", label: "FAQ", nav: false },
  { id: "contacto", label: "Contacto", nav: true },
] as const;
