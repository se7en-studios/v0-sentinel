"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { whatsappUrl } from "@/lib/contact";

// Opcional: si no hay número confirmado, el botón lleva al formulario (#contacto).
const WA_URL = whatsappUrl(
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  "Hola Sentinel, quiero más información sobre la plataforma de detección temprana de incendios.",
);

export function WhatsAppButton() {
  const [hidden, setHidden] = useState(false);

  // Ocultar mientras el formulario/footer está visible.
  useEffect(() => {
    const target = document.getElementById("contacto");
    if (!target) return;
    const io = new IntersectionObserver(([e]) => setHidden(e.isIntersecting), { threshold: 0.05 });
    io.observe(target);
    return () => io.disconnect();
  }, []);

  if (hidden) return null;

  const external = WA_URL !== null;
  return (
    <aside aria-label="Contacto rápido" className="fixed bottom-6 right-6 z-50">
      <a
        href={WA_URL ?? "#contacto"}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#f1ede3] hover:bg-[#e9e3d4] border border-[rgba(26,24,18,0.12)] hover:border-[#0f7a4f]/40 text-[#1a1812] shadow-lg shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7a4f]"
        aria-label={external ? "Escribir al equipo de Sentinel por WhatsApp" : "Ir al formulario de contacto"}
      >
        <MessageCircle className="w-4 h-4 text-[var(--green-aa)]" />
        <span
          className="text-[12px] font-normal tracking-wide"
          style={{ fontFamily: "var(--font-sans)", color: "rgba(26,24,18,0.85)" }}
        >
          {external ? "WhatsApp" : "Contacto"}
        </span>
      </a>
    </aside>
  );
}
