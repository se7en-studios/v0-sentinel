import { pressMentions } from "@/lib/press-mentions";
import { ASection, AHeading } from "@/components/a-section";
import { PressTimeline } from "@/components/press-timeline";

// Solo texto: sin og:image de terceros ni dominios externos. Sobre fondo claro (.a-bone).
// Más nuevas primero; las ISO "YYYY-MM-DD" se ordenan bien como texto.
const SORTED = [...pressMentions].sort((a, b) => b.date.localeCompare(a.date));

export function PressBlock() {
  return <PressTimeline items={SORTED} />;
}

// Compatibilidad: el capítulo completo vive en Proof.
export function Press() {
  return (
    <ASection id="prensa">
      <AHeading eyebrow="Prensa" title="Dónde salimos en los medios" />
      <div className="mt-12">
        <PressBlock />
      </div>
    </ASection>
  );
}
