"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { whatsappUrl } from "@/lib/contact";
import { useActiveSection } from "@/hooks/use-active-section";
import { SECTIONS, SECTION_LABELS_EN } from "@/lib/sections";
import { useCopy, useLang } from "@/lib/i18n/client";
import type { Copy } from "@/lib/i18n";

const NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

const COPY: Copy<{
  message: (section: string | undefined) => string;
  aside: string;
  ariaExternal: string;
  ariaForm: string;
}> = {
  es: {
    message: (section) =>
      `Hola Sentinel, quiero más información sobre la detección temprana de incendios${
        section ? ` (estoy viendo la sección "${section}" de la web)` : ""
      }.`,
    aside: "Contacto rápido",
    ariaExternal: "Escribir al equipo de Sentinel por WhatsApp",
    ariaForm: "Ir al formulario de contacto",
  },
  en: {
    message: (section) =>
      `Hi Sentinel, I'd like more information about early wildfire detection${
        section ? ` (I'm viewing the "${section}" section of the website)` : ""
      }.`,
    aside: "Quick contact",
    ariaExternal: "Message the Sentinel team on WhatsApp",
    ariaForm: "Go to the contact form",
  },
};

// Opcional: si no hay número confirmado, el botón lleva al formulario (#contacto).
export function WhatsAppButton() {
  const [hidden, setHidden] = useState(false);
  const active = useActiveSection();
  const c = useCopy(COPY);
  const lang = useLang();

  // Ocultar mientras el cierre (formulario) está en pantalla: ya tiene su propio WhatsApp.
  useEffect(() => {
    const target = document.getElementById("contacto");
    if (!target) return;
    const io = new IntersectionObserver(([e]) => setHidden(e.isIntersecting), {
      threshold: 0.05,
    });
    io.observe(target);
    return () => io.disconnect();
  }, []);

  if (hidden) return null;

  const found = SECTIONS.find((s) => s.id === active);
  const section = found && (lang === "en" ? SECTION_LABELS_EN[found.id] : found.label);
  const url = whatsappUrl(NUMBER, c.message(section));
  const external = url !== null;

  return (
    <aside
      aria-label={c.aside}
      className="fixed bottom-4 right-4 z-50 md:bottom-6 md:right-6"
    >
      <a
        href={url ?? "#contacto"}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="flex size-12 items-center justify-center rounded-full border border-a-line bg-a-bg text-a-accent transition-colors hover:border-a-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9efc9]"
        aria-label={external ? c.ariaExternal : c.ariaForm}
      >
        <MessageCircle aria-hidden className="size-5" />
      </a>
    </aside>
  );
}
