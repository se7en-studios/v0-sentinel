import type { Metadata } from "next";
import { HomePage } from "@/components/home-page";
import { OG_IMAGE } from "@/lib/og";

const siteUrl = "https://www.sentineltech.com.ar";
const title = "Sentinel Cloud | Early wildfire detection";
const description =
  "Early wildfire detection with satellite data, geospatial information and AI. Sensors and drones are added progressively. Patagonia, Argentina.";
const ogDescription =
  "We detect fire hotspots with satellite data and AI and alert municipalities, fire brigades and producers across Patagonia within minutes. Sensors and drones are added progressively.";

// Versión en inglés de la home. Los demás tipos de página (blog, metodología, etc.) siguen en español.
export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: {
    canonical: `${siteUrl}/en`,
    languages: { "es-AR": siteUrl, en: `${siteUrl}/en`, "x-default": siteUrl },
  },
  openGraph: {
    title,
    description: ogDescription,
    url: `${siteUrl}/en`,
    siteName: "Sentinel",
    locale: "en_US",
    type: "website",
    images: [{ ...OG_IMAGE, alt: "Sentinel: fire doesn't wait, neither do we. Early wildfire detection." }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: "Satellite data and AI to detect wildfires early in Patagonia.",
    images: [OG_IMAGE.url],
  },
};

export default function HomeEn() {
  return <HomePage lang="en" />;
}
