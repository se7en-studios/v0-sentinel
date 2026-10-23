import type { Metadata, Viewport } from "next";
import { DemoApp } from "@/components/demo/demo-app";
import { ARGENTINA } from "@/lib/demo/argentina";

// Public presentation mode: sample data only, no auth, no API calls, not indexed.
export const metadata: Metadata = {
  title: "Modo presentación",
  description:
    "Recorrido guiado y visual de qué hace Sentinel, con datos de ejemplo.",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f0" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1410" },
  ],
};

export default function DemoPage() {
  return (
    <DemoApp
      geo={{ path: ARGENTINA.path, proj: ARGENTINA.proj }}
      rings={ARGENTINA.rings}
    />
  );
}
