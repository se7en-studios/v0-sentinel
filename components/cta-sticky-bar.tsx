"use client";

import { useEffect, useState } from "react";

// Barra CTA solo mobile: aparece al dejar atrás el hero y se va cuando #contacto está a la vista.
// El botón deja libre la esquina derecha (botón de WhatsApp, z-50).
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
      const io = new IntersectionObserver(([e]) =>
        setAtContact(e.isIntersecting),
      );
      io.observe(contact);
      ios.push(io);
    }
    return () => ios.forEach((io) => io.disconnect());
  }, []);

  const show = pastHero && !atContact;

  return (
    <div
      inert={!show}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-ink/20 bg-paper pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-4 pr-[4.75rem] pt-3 transition duration-300 md:hidden ${
        show
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-full opacity-0"
      }`}
    >
      <a
        href="#contacto"
        className="flex min-h-12 items-center justify-center rounded-sm bg-brand px-5 text-base font-semibold text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        Coordinar un piloto
      </a>
    </div>
  );
}
