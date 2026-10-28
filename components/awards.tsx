import { ASection, AHeading } from "@/components/a-section";
import { pressMentions } from "@/lib/press-mentions";
import { PHOTOS, localizePhoto } from "@/lib/photos";
import { getLang, t, type Copy, type Lang } from "@/lib/i18n";
import { AwardsPanels, type AwardEntry, type Moment } from "@/components/awards-panels";

const noteFor = (outlet: string) =>
  pressMentions.find((m) => m.outlet === outlet)?.url;

// Cronológico. Solo entradas con año confirmado en el sitio; no inventamos fechas ni fotos:
// `image` es la foto real del evento (mapeo documentado en lib/press-mentions.ts); `bg` es una foto de ambiente
// que solo ilustra el tema y no representa el evento. Sin `image`, el panel es solo tipográfico.
type EntryText = { name: string; result: string; caption?: string; alt?: string; extraAlt?: string };

// Parte fija de cada entrada (misma en ambos idiomas); los textos están en COPY, en el mismo orden.
const BASE: Omit<AwardEntry, "name" | "result" | "caption" | "alt" | "extra">[] = [
  // Sin año confirmado en el sitio: la tarjeta no muestra fecha.
  { year: "2025", bg: "/photos/ambiente-bosque-lenga.webp", image: PHOTOS.awardsGroup.src },
  { year: "2025", bg: "/photos/ambiente-montana-atardecer.webp", won: true, image: "/photos/premios-ilan-certificado.webp", portrait: true },
  { year: "2025", bg: "/photos/ambiente-guanaco-roca.webp", won: true, image: "/logros-tile-4.jpg" },
  { year: "2025", bg: "/photos/ambiente-bombera-humo.webp", won: true, image: PHOTOS.awardsRoom.src },
  { year: "2026", bg: "/photos/ambiente-bosque-quemado.webp", image: "/photos/premios-verdes-certificado.webp", portrait: true },
  { year: "2026", bg: "/photos/ambiente-brasas.webp" },
];
const NOTES = [undefined, "UTN", undefined, "CESSI", "Infobae", undefined];
const EXTRA = [
  undefined,
  { image: "/photos/premios-ilan-equipo.webp" },
  undefined,
  undefined,
  { image: "/photos/premios-verdes-bandera.webp", portrait: true },
  undefined,
];

const COPY: Copy<EntryText[]> = {
  es: [
    { name: "Programa Prendete, CICE", result: "Pitch Day", caption: "El equipo con los demás proyectos finalistas de Prendete (Mendoza).", alt: PHOTOS.awardsGroup.alt },
    { name: "Premios ILAN, innovación universitaria", result: "Ganamos", caption: "El equipo recibe el certificado del premio ILAN.", alt: "Dos integrantes del equipo con el certificado del premio ILAN, frente a la pantalla del evento", extraAlt: "El equipo de Sentinel en el escenario del auditorio de ILAN" },
    { name: "JIJE 20 años, UNL", result: "Ganamos", caption: "Presentamos a distancia.", alt: "Presentación de Sentinel en la JIJE 20 años, UNL" },
    { name: "Premios Sadosky", result: "Ganamos", caption: "Ceremonia de los Premios Sadosky 2025.", alt: PHOTOS.awardsRoom.alt },
    { name: "Premios Verdes", result: "Fuimos finalistas", caption: "Con el certificado de Sentinel y la bandera argentina en el escenario.", alt: "Dos integrantes del equipo con el certificado de Sentinel, junto al logo de los Premios Verdes", extraAlt: "Dos integrantes del equipo con la bandera argentina frente al logo de los Premios Verdes" },
    { name: "Impact Startup Competition, Perú", result: "Fuimos finalistas" },
  ],
  en: [
    { name: "Programa Prendete, CICE", result: "Pitch Day", caption: "The team with the other Prendete finalist projects (Mendoza).", alt: localizePhoto(PHOTOS.awardsGroup, "en").alt },
    { name: "Premios ILAN, university innovation", result: "We won", caption: "The team receives the ILAN award certificate.", alt: "Two team members with the ILAN award certificate, in front of the event screen", extraAlt: "The Sentinel team on stage at the ILAN auditorium" },
    { name: "JIJE 20 años, UNL", result: "We won", caption: "We presented remotely.", alt: "Sentinel presenting at JIJE 20 años, UNL" },
    { name: "Premios Sadosky", result: "We won", caption: "Premios Sadosky 2025 ceremony.", alt: localizePhoto(PHOTOS.awardsRoom, "en").alt },
    { name: "Premios Verdes", result: "We were finalists", caption: "With the Sentinel certificate and the Argentine flag on stage.", alt: "Two team members with the Sentinel certificate, next to the Premios Verdes logo", extraAlt: "Two team members with the Argentine flag in front of the Premios Verdes logo" },
    { name: "Impact Startup Competition, Peru", result: "We were finalists" },
  ],
};

const entriesFor = (lang: Lang): AwardEntry[] =>
  BASE.map((b, i) => {
    const x = COPY[lang][i];
    const outlet = NOTES[i];
    const ex = EXTRA[i];
    return {
      ...b,
      name: x.name,
      result: x.result,
      ...(x.caption ? { caption: x.caption } : {}),
      ...(outlet ? { href: noteFor(outlet) } : {}),
      ...(x.alt ? { alt: x.alt } : {}),
      ...(ex && x.extraAlt ? { extra: { ...ex, alt: x.extraAlt } } : {}),
    };
  });

// Fotos del equipo en distintos eventos. Los alt no atribuyen la foto a un evento salvo que se vea el logo/pantalla.
const MOMENT_SRCS = ["01", "09", "04", "11", "05", "06", "12", "07", "14", "13"].map((n) => `/photos/momentos-${n}.webp`);
const MOMENT_ALTS: Copy<string[]> = {
  es: [
    "El equipo y autoridades en el escenario del auditorio de ILAN",
    "El equipo en el escenario de los Premios Verdes",
    "Integrantes del equipo en el patio de un evento",
    "El equipo con la bandera argentina en los Premios Verdes",
    "Escenario bajo carpa durante un evento",
    "Integrantes del equipo junto a una persona con credencial",
    "El equipo en el escenario de los Premios Verdes, con luces verdes",
    "Sala de una ceremonia con proyecciones verdes",
    "El equipo frente al logo de los Premios Verdes",
    "Un ciervo que se acerca a la cámara en un camino rodeado de pinos",
  ],
  en: [
    "The team and officials on stage at the ILAN auditorium",
    "The team on stage at the Premios Verdes",
    "Team members in the courtyard of an event",
    "The team with the Argentine flag at the Premios Verdes",
    "A stage under a tent during an event",
    "Team members next to a person wearing a badge",
    "The team on stage at the Premios Verdes, under green lights",
    "Ceremony hall with green projections",
    "The team in front of the Premios Verdes logo",
    "A deer approaching the camera on a road lined with pines",
  ],
};
export const momentsFor = (lang: Lang): Moment[] =>
  MOMENT_SRCS.map((src, i) => ({ src, alt: MOMENT_ALTS[lang][i] }));
export const MOMENTS: Moment[] = momentsFor("es");

const HEAD: Copy<{ eyebrow: string; title: string }> = {
  es: { eyebrow: "Logros", title: "Lo que ya pasó, con fuente" },
  en: { eyebrow: "Achievements", title: "What has already happened, with sources" },
};

export function AwardsBlock() {
  return <AwardsPanels entries={entriesFor(getLang())} />;
}

// Compatibilidad: el capítulo completo vive en Proof.
export function Awards() {
  return (
    <ASection id="noticias" tone="bone">
      <AHeading eyebrow={t(HEAD).eyebrow} title={t(HEAD).title} />
      <div className="mt-12">
        <AwardsBlock />
      </div>
    </ASection>
  );
}
