import Image from "next/image";
import { Chapter, Eyebrow } from "@/components/ui/chapter";
import { Spotlight } from "@/components/ui/spotlight";
import { Reveal } from "@/components/ui/reveal";

// mono: logo oscuro de origen, se queda blanco también al hover (sobre charcoal no se leería).
const logos = [
  { id: "uba", description: "UBA", image: "/uba-logo.png", mono: true },
  { id: "aiweken", description: "Aiweken", image: "/aiweken.png" },
  { id: "cice", description: "CICE", image: "/cice.png" },
  { id: "empretec", description: "Empretec", image: "/empretec.png" },
  { id: "endeavor", description: "Endeavor", image: "/endeavor.png" },
  {
    id: "fpn",
    description: "Fundación Patagonia Natural",
    image: "/FPN2.webp",
    mono: true,
  },
  { id: "ilan", description: "ILAN", image: "/ilan.png" },
  { id: "movistar", description: "Movistar", image: "/movistar-3.svg" },
  { id: "sadosky", description: "Sadosky", image: "/sadosky.png" },
  { id: "scale", description: "Scale", image: "/scale.png" },
  { id: "ue", description: "UE", image: "/ue.png" },
  { id: "uncuyo", description: "UNCUYO", image: "/uncuyo.png" },
  { id: "unl", description: "UNL", image: "/unl.png" },
  { id: "utn", description: "UTN", image: "/utn.png", mono: true },
];

function LogoItem({ l }: { l: (typeof logos)[number] }) {
  return (
    <li className="flex h-20 min-w-0 items-center justify-center rounded-xl px-4 transition-colors duration-300 hover:bg-white/[0.06]">
      <Image
        src={l.image}
        alt={l.description}
        width={100}
        height={36}
        loading="lazy"
        className={`max-h-9 w-auto max-w-[110px] object-contain opacity-60 brightness-0 invert transition-all duration-300 hover:opacity-100 ${
          l.mono ? "" : "hover:brightness-100 hover:invert-0"
        }`}
      />
    </li>
  );
}

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
      <Reveal>
        <Spotlight className="relative overflow-hidden rounded-[20px] bg-charcoal p-3 shadow-[0_24px_50px_-24px_rgba(18,17,14,0.55)] ring-1 ring-foreground/10">
          <div
            className="bg-noise pointer-events-none absolute inset-0 opacity-[0.05]"
            aria-hidden="true"
          />
          <ul className="relative m-0 grid list-none grid-cols-2 gap-1 p-0 sm:grid-cols-3 lg:grid-cols-7">
            {logos.map((l) => (
              <LogoItem key={l.id} l={l} />
            ))}
          </ul>
        </Spotlight>
      </Reveal>
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
