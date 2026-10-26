"use client";

import { Marquee } from "@/components/ui/marquee";

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

export function Partners() {
  return (
    <section
      className="relative py-20 lg:py-28 overflow-hidden"
      style={{ background: "#faf7f0" }}
    >
      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-10 text-center mb-14">
        <h2
          className="text-3xl sm:text-4xl mb-4"
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 800,
            color: "rgba(26,24,18,0.92)",
            lineHeight: 1.1,
          }}
        >
          Programas y entidades con las{" "}
          <span style={{ color: "var(--green-aa)" }}>que participamos.</span>
        </h2>
        <p
          className="text-[13px] max-w-lg mx-auto"
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 300,
            color: "rgba(26,24,18,0.62)",
          }}
        >
          Universidades de origen, organizadores de competencias y programas de
          los que Sentinel formó parte en su camino de idea universitaria a
          piloto. No implica convenio ni respaldo comercial.
        </p>
      </div>

      <div className="relative">
        <Marquee pauseOnHover repeat={3} className="[--duration:35s]">
          {logos.map((logo) => (
            <div
              key={logo.id}
              className="flex items-center justify-center h-16 w-[140px] shrink-0"
            >
              <img
                src={logo.image}
                alt={logo.description}
                title={logo.description}
                width={100}
                height={36}
                loading="lazy"
                className="max-h-9 max-w-[100px] w-auto object-contain transition-all duration-300 hover:scale-105 opacity-60 hover:opacity-100"
                style={{ filter: "grayscale(100%) brightness(0)" }}
              />
            </div>
          ))}
        </Marquee>
        {/* edge fade so logos don't hard-cut against the page background */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-24 sm:w-40"
          style={{
            background: "linear-gradient(to right, #faf7f0, transparent)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-24 sm:w-40"
          style={{
            background: "linear-gradient(to left, #faf7f0, transparent)",
          }}
        />
      </div>
    </section>
  );
}
