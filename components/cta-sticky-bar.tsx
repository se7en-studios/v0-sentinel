"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

// Barra CTA solo mobile: aparece al dejar atrás el hero y se va cuando #contacto está a la vista.
// Deja libre la esquina derecha (botón de WhatsApp, z-50) y queda por debajo del menú (z-50).
export function CtaStickyBar() {
  const [pastHero, setPastHero] = useState(false);
  const [atContact, setAtContact] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("inicio");
    const contact = document.getElementById("contacto");
    const ios: IntersectionObserver[] = [];
    if (hero) {
      const io = new IntersectionObserver(([e]) =>
        setPastHero(!e.isIntersecting && e.boundingClientRect.top < 0),
      );
      io.observe(hero);
      ios.push(io);
    }
    if (contact) {
      const io = new IntersectionObserver(([e]) => setAtContact(e.isIntersecting));
      io.observe(contact);
      ios.push(io);
    }
    return () => ios.forEach((io) => io.disconnect());
  }, []);

  const show = pastHero && !atContact;

  return (
    <div
      inert={!show}
      className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-[4.75rem] z-40 transition duration-300 md:hidden ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <a
        href="#contacto"
        className="flex min-h-12 items-center justify-between gap-3 rounded-full bg-leaf-bright px-5 text-base font-semibold text-charcoal shadow-[0_12px_32px_-8px_rgb(0_0_0/0.6)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-bright"
      >
        Coordinar un piloto
        <ArrowRight aria-hidden className="h-5 w-5 shrink-0" />
      </a>
    </div>
  );
}
