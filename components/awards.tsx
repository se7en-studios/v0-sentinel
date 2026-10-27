import { ASection, AHeading } from "@/components/a-section";
import { pressMentions } from "@/lib/press-mentions";
import { PHOTOS } from "@/lib/photos";
import { AwardsPanels, type AwardEntry } from "@/components/awards-panels";

const noteFor = (outlet: string) =>
  pressMentions.find((m) => m.outlet === outlet)?.url;

// Cronológico. Solo entradas con año confirmado en el sitio; no inventamos fechas ni fotos:
// `image` es la foto real del evento (mapeo documentado en lib/press-mentions.ts); `bg` es una foto de ambiente
// que solo ilustra el tema y no representa el evento. Sin `image`, el panel es solo tipográfico.
const ENTRIES: AwardEntry[] = [
  // Sin año confirmado en el sitio: la tarjeta no muestra fecha.
  { year: "", name: "Programa Prendete, CICE", bg: "/photos/ambiente-bosque-lenga.webp", result: "Pitch Day", caption: "El equipo con los demás proyectos finalistas de Prendete (Mendoza).", image: PHOTOS.awardsGroup.src, alt: PHOTOS.awardsGroup.alt },
  { year: "2025", name: "Premios ILAN, innovación universitaria", bg: "/photos/ambiente-montana-atardecer.webp", result: "Ganamos", caption: "El equipo recibe el certificado del premio ILAN.", href: noteFor("UTN"), image: "/photos/premios-ilan-certificado.webp", portrait: true, alt: "Dos integrantes del equipo con el certificado del premio ILAN, frente a la pantalla del evento", extra: { image: "/photos/premios-ilan-equipo.webp", alt: "El equipo de Sentinel en el escenario del auditorio de ILAN" } },
  { year: "2025", name: "JIJE 20 años, UNL", bg: "/photos/ambiente-guanaco-roca.webp", result: "Ganamos", caption: "Presentamos a distancia.", image: "/logros-tile-4.jpg", alt: "Presentación de Sentinel en la JIJE 20 años, UNL" },
  { year: "2025", name: "Premios Sadosky", bg: "/photos/ambiente-bombera-humo.webp", result: "Ganamos", caption: "Ceremonia de los Premios Sadosky 2025.", href: noteFor("CESSI"), image: PHOTOS.awardsRoom.src, alt: PHOTOS.awardsRoom.alt },
  { year: "2026", name: "Premios Verdes", bg: "/photos/ambiente-bosque-quemado.webp", result: "Fuimos finalistas", caption: "Con el certificado de Sentinel y la bandera argentina en el escenario.", image: "/photos/premios-verdes-certificado.webp", portrait: true, alt: "Dos integrantes del equipo con el certificado de Sentinel, junto al logo de los Premios Verdes", extra: { image: "/photos/premios-verdes-bandera.webp", portrait: true, alt: "Dos integrantes del equipo con la bandera argentina frente al logo de los Premios Verdes" } },
  { year: "2026", name: "Impact Startup Competition, Perú", bg: "/photos/ambiente-brasas.webp", result: "Fuimos finalistas" },
];

export function AwardsBlock() {
  return <AwardsPanels entries={ENTRIES} />;
}

// Compatibilidad: el capítulo completo vive en Proof.
export function Awards() {
  return (
    <ASection id="noticias" tone="bone">
      <AHeading eyebrow="Logros" title="Lo que ya pasó, con fuente" />
      <div className="mt-12">
        <AwardsBlock />
      </div>
    </ASection>
  );
}
