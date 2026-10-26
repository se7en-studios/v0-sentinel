"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { whatsappUrl } from "@/lib/contact";
import { useActiveSection } from "@/hooks/use-active-section";
import { SECTIONS } from "@/lib/sections";

const NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

// Opcional: si no hay número confirmado, el botón lleva al formulario (#contacto).
export function WhatsAppButton() {
  const [hidden, setHidden] = useState(false);
  const active = useActiveSection();

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

  const section = SECTIONS.find((s) => s.id === active)?.label;
  const url = whatsappUrl(
    NUMBER,
    `Hola Sentinel, quiero más información sobre la detección temprana de incendios${
      section ? ` (estoy viendo la sección "${section}" de la web)` : ""
    }.`,
  );
  const external = url !== null;

  return (
    <aside
      aria-label="Contacto rápido"
      className="fixed bottom-4 right-4 z-50 md:bottom-6 md:right-6"
    >
      <a
        href={url ?? "#contacto"}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className={`flex size-12 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
          external ? "bg-[#1a7f46]" : "bg-ink"
        }`}
        aria-label={
          external
            ? "Escribir al equipo de Sentinel por WhatsApp"
            : "Ir al formulario de contacto"
        }
      >
        <MessageCircle aria-hidden className="size-6" />
      </a>
    </aside>
  );
}
