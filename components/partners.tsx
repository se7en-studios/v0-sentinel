import Image from "next/image";
import { ASection } from "@/components/a-section";
import { MarqueeRow } from "@/components/ui/marquee-row";
import { t, type Copy } from "@/lib/i18n";

const COPY: Copy<{ title: string; note: string }> = {
  es: {
    title: "Programas y entidades en las que participamos",
    note: "Universidades de origen, organizadores de competencias y programas de los que Sentinel formó parte. No implica convenio ni respaldo comercial.",
  },
  en: {
    title: "Programs and organizations we have taken part in",
    note: "Home universities, competition organizers and programs Sentinel has been part of. It does not imply an agreement or commercial endorsement.",
  },
};

const logos = [
  { id: "uba", description: "UBA", image: "/uba-logo.png" },
  { id: "aiweken", description: "Aiweken", image: "/aiweken.png" },
  { id: "cice", description: "CICE", image: "/cice.png" },
  { id: "empretec", description: "Empretec", image: "/empretec.png" },
  { id: "endeavor", description: "Endeavor", image: "/endeavor.png" },
  {
    id: "fpn",
    description: "Fundación Patagonia Natural",
    image: "/FPN2.webp",
  },
  { id: "ilan", description: "ILAN", image: "/ilan.png" },
  { id: "movistar", description: "Movistar", image: "/movistar-3.svg" },
  { id: "sadosky", description: "Sadosky", image: "/sadosky.png" },
  { id: "scale", description: "Scale", image: "/scale.png" },
  { id: "ue", description: "UE", image: "/ue.png" },
  { id: "uncuyo", description: "UNCUYO", image: "/uncuyo.png" },
  { id: "unl", description: "UNL", image: "/unl.png" },
  { id: "utn", description: "UTN", image: "/utn.png" },
];

export function PartnersBlock() {
  const c = t(COPY);
  return (
    <div>
      <p className="a-rise text-[0.9375rem] font-medium uppercase tracking-[0.16em] text-[#4b5750]">
        {c.title}
      </p>
      <div className="a-rise mt-10">
        <MarqueeRow seconds={45}>
          {(hidden) =>
            [...logos, ...logos].map((l, i) => (
              <li key={`${l.id}-${i}`} className="flex h-16 w-40 shrink-0 items-center justify-center">
                <Image
                  src={l.image}
                  alt={hidden || i >= logos.length ? "" : l.description}
                  width={120}
                  height={44}
                  loading="lazy"
                  className="max-h-11 w-auto max-w-[130px] object-contain opacity-60 transition-opacity hover:opacity-100"
                  // Logos con fondo transparente: silueta negra, monocromo sobre fondo claro.
                  style={{ filter: "brightness(0)" }}
                />
              </li>
            ))
          }
        </MarqueeRow>
      </div>
      <p className="mt-8 max-w-xl text-[0.9375rem] leading-relaxed text-[#4b5750]">
        {c.note}
      </p>
    </div>
  );
}

// Compatibilidad: el capítulo completo vive en Proof.
export function Partners() {
  return (
    <ASection>
      <PartnersBlock />
    </ASection>
  );
}
