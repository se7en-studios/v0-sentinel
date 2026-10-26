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
        className="group relative flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#0c0b09] text-[#faf7f0] border border-emerald-500/30 hover:border-emerald-400 shadow-xl shadow-black/25 transition-all duration-300 hover:scale-105 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7a4f]"
        aria-label={external ? "Escribir al equipo de Sentinel por WhatsApp" : "Ir al formulario de contacto"}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
        </span>
        <MessageCircle className="w-4 h-4 text-emerald-300 transition-transform duration-300 group-hover:rotate-12" />
        <span
          className="text-[12px] font-medium tracking-wide text-white/90 group-hover:text-white"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {external ? "WhatsApp" : "Contacto"}
        </span>
      </a>
    </aside>
  );
}
