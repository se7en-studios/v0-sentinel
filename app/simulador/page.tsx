import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FireTimeline } from "@/components/fire-timeline";

export const metadata: Metadata = {
  title: "Simulador de los primeros 60 minutos",
  description:
    "Un foco, dos relojes: movés el minuto y mirás cuánto crece un incendio según cuándo llega la brigada. Es una simulación ilustrativa, no una predicción.",
  alternates: { canonical: "/simulador" },
};

export default function SimuladorPage() {
  return (
    <>
      <header>
        <Navbar />
      </header>
      <main id="main-content" className="a-root pt-12">
        <FireTimeline />
      </main>
      <Footer />
    </>
  );
}
