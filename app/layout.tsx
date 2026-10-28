import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono, Archivo, Chivo_Mono, Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { OG_DESCRIPTION, OG_IMAGE, OG_TITLE, TWITTER_DESCRIPTION } from "@/lib/og";

const plusJakarta = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-heading",
});

const inter = Inter({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrains = JetBrains_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-mono",
  // ponytail: solo etiquetas y cifras; sin preload no compite con el CSS por el ancho de banda del primer paint
  preload: false,
});

// Tipografías de la landing, las mismas de se7en.com.ar: Archivo (títulos en versión ancha y texto),
// Chivo Mono (etiquetas) e Instrument Serif cursiva (la palabra de énfasis).
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
});

const chivoMono = Chivo_Mono({
  subsets: ["latin"],
  variable: "--font-chivo",
  preload: false,
});

const serifAccent = Instrument_Serif({
  weight: "400",
  style: ["italic"],
  subsets: ["latin"],
  variable: "--font-serif-accent",
  preload: false,
});

const siteUrl = "https://www.sentineltech.com.ar";
const title = "Sentinel Cloud | Detección temprana de incendios forestales";
const description =
  "Detección temprana de incendios forestales con datos satelitales, información geoespacial e IA. Sensores y drones se suman de forma progresiva. Patagonia, Argentina.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s | Sentinel Technologies",
  },
  description,
  authors: [{ name: "Sentinel Technologies", url: siteUrl }],
  creator: "Sentinel Technologies",
  publisher: "Sentinel Technologies",
  verification: {
    google: "_e_gueYaQyl1g7OI7D112etzhS028QTSXqnFzdM1Gfg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
    languages: { "es-AR": siteUrl },
  },
  openGraph: {
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    url: siteUrl,
    siteName: "Sentinel",
    locale: "es_AR",
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: TWITTER_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

export const viewport: Viewport = {
  // lets the admin use the phone's safe areas (notch, home bar)
  viewportFit: "cover",
  themeColor: "#faf7f0",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Sentinel Technologies",
  url: siteUrl,
  logo: `${siteUrl}/apple-icon.png`,
  description,
  areaServed: [
    { "@type": "AdministrativeArea", name: "Neuquén" },
    { "@type": "AdministrativeArea", name: "Río Negro" },
    { "@type": "AdministrativeArea", name: "Patagonia" },
    { "@type": "Country", name: "Argentina" },
  ],
  sameAs: [
    "https://instagram.com/sentinel.arg",
    "https://linktr.ee/sentinelarg",
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      email: "sentinelproyecto@gmail.com",
      contactType: "customer service",
      areaServed: "AR",
      availableLanguage: ["es"],
    },
  ],
  // Domicilio confirmado por el dueño (28/10/2026): San Rafael, Mendoza. El área de servicio es la Patagonia.
  address: {
    "@type": "PostalAddress",
    addressLocality: "San Rafael",
    addressRegion: "Mendoza",
    addressCountry: "AR",
  },
  knowsAbout: [
    "Wildfire Detection",
    "Satellite Data Analysis",
    "Artificial Intelligence",
    "Geospatial Intelligence",
    "Environmental Monitoring",
    "Forest Fire Prevention",
    "Drone Technology",
  ],
  award: ["ILAN Awards 2025", "Premio Sadosky 2025", "JIJE 2025"],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Sentinel Technologies",
  url: siteUrl,
  inLanguage: "es-AR",
};

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Sentinel Cloud",
  applicationCategory: "EnvironmentalManagement",
  operatingSystem: "Web",
  description:
    "Plataforma SaaS de monitoreo, alertas y dashboards en tiempo real para detección de incendios forestales.",
  provider: {
    "@type": "Organization",
    name: "Sentinel Technologies",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      </head>
      <body
        className={`${archivo.variable} ${chivoMono.variable} ${serifAccent.variable} ${inter.variable} ${plusJakarta.variable} ${jetbrains.variable} font-sans antialiased bg-[#faf7f0] text-[#1a1812]`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:rounded-sm focus:bg-[#0f7a4f] focus:px-4 focus:py-2 focus:text-[13px] focus:text-[#faf7f0] focus:outline-none focus:ring-2 focus:ring-[#faf7f0]"
        >
          Saltar al contenido principal
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
