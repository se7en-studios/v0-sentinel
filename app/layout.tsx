import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

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
});

const siteUrl = "https://www.sentineltech.com.ar";
const title =
  "Sentinel Cloud: Detección Temprana de Incendios Forestales con IA | Sentinel";
const description =
  "Sentinel Cloud integra datos satelitales, información geoespacial e inteligencia artificial para detectar incendios forestales a tiempo, con expansión progresiva a sensores y drones. Patagonia y Argentina.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s | Sentinel Technologies",
  },
  description,
  keywords: [
    "Sentinel Cloud",
    "detección temprana de incendios forestales",
    "monitoreo satelital de incendios",
    "inteligencia artificial incendios forestales",
    "monitoreo de incendios",
    "solución a incendios forestales",
    "prevención incendios Patagonia",
    "monitoreo geoespacial ambiental",
    "monitoreo con drones",
    "drones monitoreo ambiental",
    "Sentinel Technologies Argentina",
    "monitoreo Río Negro",
    "wildfire detection Argentina",
  ],
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
    title,
    description,
    url: siteUrl,
    siteName: "Sentinel Technologies",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
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
  offers: {
    "@type": "Offer",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      description: "Modelo sin CAPEX inicial. Piloto de 4 a 8 semanas.",
    },
  },
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
    <html lang="es" className="scroll-smooth">
      <head>
        {/* ponytail: the hero video streams from Cloudinary — preconnecting
            lets the browser open that connection while the HTML is still
            parsing instead of waiting until the <video> tag is discovered,
            which matters on the LCP critical path. */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
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
        className={`${inter.variable} ${plusJakarta.variable} ${jetbrains.variable} font-sans antialiased bg-[#faf7f0] text-[#1a1812]`}
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
