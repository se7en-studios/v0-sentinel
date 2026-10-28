import type { Metadata } from "next";
import { HomePage } from "@/components/home-page";

const siteUrl = "https://www.sentineltech.com.ar";

// El resto de los metadatos vienen del layout raíz; acá solo se declara la pareja de idiomas de la home.
export const metadata: Metadata = {
  alternates: {
    canonical: siteUrl,
    languages: { "es-AR": siteUrl, en: `${siteUrl}/en`, "x-default": siteUrl },
  },
};

export default function Home() {
  return <HomePage lang="es" />;
}
