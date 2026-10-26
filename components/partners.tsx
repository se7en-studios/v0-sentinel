import Image from "next/image";
import { Chapter, Eyebrow } from "@/components/ui/chapter";

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
    <div>
      <h3 className="t-h3 mb-2">
        Programas y entidades en las que participamos
      </h3>
      <p className="t-small mb-6 max-w-2xl opacity-80">
        Universidades de origen, organizadores de competencias y programas de
        los que Sentinel formó parte. No implica convenio ni respaldo comercial.
      </p>
      <ul className="flex flex-wrap items-center gap-x-8 gap-y-5">
        {logos.map((l) => (
          <li key={l.id} className="flex h-10 items-center">
            <Image
              src={l.image}
              alt={l.description}
              width={100}
              height={36}
              loading="lazy"
              className="max-h-9 w-auto max-w-[100px] object-contain opacity-70"
              style={{ filter: "grayscale(100%) brightness(0)" }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

// Compatibilidad: el capítulo completo vive en Proof.
export function Partners() {
  return (
    <Chapter>
      <Eyebrow>Entidades</Eyebrow>
      <PartnersBlock />
    </Chapter>
  );
}
