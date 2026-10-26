import Image from "next/image";

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
    <div className="border-t rule pt-8">
      <h3 className="t-h3">Programas y entidades en las que participamos</h3>
      <p className="t-caption mt-1 max-w-2xl">
        Universidades de origen, organizadores de competencias y programas de
        los que Sentinel formó parte. No implica convenio ni respaldo comercial.
      </p>
      <ul className="mt-6 flex list-none flex-wrap items-center gap-x-8 gap-y-5 p-0">
        {logos.map((l) => (
          <li key={l.id}>
            <Image
              src={l.image}
              alt={l.description}
              width={100}
              height={32}
              loading="lazy"
              className="h-6 w-auto max-w-[90px] object-contain opacity-60 brightness-0"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
