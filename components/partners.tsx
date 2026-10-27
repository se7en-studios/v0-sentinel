import Image from "next/image";
import { ASection } from "@/components/a-section";

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
  return (
    <div className="text-center">
      <p className="a-eyebrow a-rise">Programas y entidades en las que participamos</p>
      <ul className="a-rise mx-auto mt-8 flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-6">
        {logos.map((l) => (
          <li key={l.id} className="flex h-10 items-center">
            <Image
              src={l.image}
              alt={l.description}
              width={100}
              height={36}
              loading="lazy"
              className="max-h-9 w-auto max-w-[100px] object-contain opacity-60 transition-opacity duration-300 hover:opacity-100"
              // Todos los logos tienen fondo transparente: silueta blanca sobre el fondo oscuro.
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </li>
        ))}
      </ul>
      <p className="mx-auto mt-8 max-w-xl text-xs leading-relaxed text-a-faint">
        Universidades de origen, organizadores de competencias y programas de los
        que Sentinel formó parte. No implica convenio ni respaldo comercial.
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
