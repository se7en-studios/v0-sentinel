import Image from "next/image";
import { Chapter, Eyebrow } from "@/components/ui/chapter";

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

const STRIP_CSS = `
@keyframes pt-marquee{to{transform:translateX(-50%)}}
.pt-track{display:flex;width:max-content;animation:pt-marquee 60s linear infinite}
.pt-strip:hover .pt-track{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.pt-track{animation:none}.pt-strip{overflow-x:auto}}
`;

function LogoItem({
  l,
  decorative,
}: {
  l: (typeof logos)[number];
  decorative?: boolean;
}) {
  return (
    <li className="flex h-16 shrink-0 items-center px-6">
      <Image
        src={l.image}
        alt={decorative ? "" : l.description}
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
      <style>{STRIP_CSS}</style>
      <div className="pt-strip relative overflow-hidden rounded-[20px] bg-charcoal py-3 shadow-[0_24px_50px_-24px_rgba(18,17,14,0.55)] ring-1 ring-foreground/10">
        <div
          className="bg-noise pointer-events-none absolute inset-0 opacity-[0.05]"
          aria-hidden="true"
        />
        <div className="relative [mask-image:linear-gradient(to_right,transparent,#000_10%,#000_90%,transparent)]">
          <div className="pt-track">
            <ul className="m-0 flex list-none p-0">
              {logos.map((l) => (
                <LogoItem key={l.id} l={l} />
              ))}
            </ul>
            <ul aria-hidden="true" className="m-0 flex list-none p-0">
              {logos.map((l) => (
                <LogoItem key={l.id} l={l} decorative />
              ))}
            </ul>
          </div>
        </div>
      </div>
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
