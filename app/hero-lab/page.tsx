import type { Metadata } from "next";
import SculptureHero from "@/components/ui/liquid-sculpture-hero";

// Prueba de un hero alternativo (partículas líquidas sobre el bosque patagónico). No indexada.
export const metadata: Metadata = {
  title: "Prueba de hero",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default function HeroLab() {
  return (
    <SculptureHero
      src="/hero/patagonia-bosque.webp"
      imageAlt="Cordillera nevada y bosque de coníferas de la Patagonia con un foco de incendio"
      brand="Sentinel"
      navLinks={[
        { label: "Cómo funciona", href: "/#plataforma" },
        { label: "En vivo", href: "/#en-vivo" },
        { label: "Para quién", href: "/#para-quien" },
      ]}
      navCta={{ label: "Pedir un piloto", href: "/#contacto" }}
      themeToggle={false}
      eyebrow="Detección temprana · Patagonia"
      headline={"El aviso llega antes\nque el humo."}
      headlineAccent="que el humo."
      body="Detectamos focos de incendio desde el espacio y avisamos en minutos a quien tiene que actuar. Para municipios, brigadas y productores."
      primaryCta={{ label: "Pedir un piloto", href: "/#contacto" }}
      secondaryCta={{ label: "Ver cómo funciona", href: "/#plataforma" }}
      hint="Pasá el cursor por el bosque"
      hintTouch="Tocá el bosque"
      background="#e4ece3"
      textColor="#0c2418"
      accentColor="#c2410c"
      headingFont="var(--font-geist), sans-serif"
      accentFont="var(--font-display), serif"
      bodyFont="var(--font-geist), sans-serif"
      loadFonts={false}
      backdropText="patagonia"
      showCredit={false}
      intro
      ambient
      ambientIntensity={0.35}
      particleDensity={1}
      radius={240}
      sculptureScale={1.3}
      sculptureY={-2}
    />
  );
}
