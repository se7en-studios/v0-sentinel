"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { SentinelLogo, SentinelMark } from "@/components/sentinel-logo";
import Link from "next/link";
import { SECTIONS } from "@/lib/sections";
import { useActiveSection } from "@/hooks/use-active-section";

const navLinks = SECTIONS.filter((s) => s.nav).map((s) => ({
  id: s.id,
  label: s.label,
  href: `/#${s.id}`,
}));

const FOCUSABLE = "a[href], button:not([disabled])";

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);
  const [overHero, setOverHero] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const activeSection = useActiveSection();

  // Dos observers en vez de un listener de scroll: uno detecta "salí del tope"
  // (activa el vidrio) y otro "la barra ya no está sobre el hero oscuro".
  useEffect(() => {
    const top = topRef.current;
    if (!top) return;
    const io = new IntersectionObserver(([e]) => setIsScrolled(!e.isIntersecting));
    io.observe(top);
    const hero = isHome ? document.querySelector("[data-nav-dark]") : null;
    // 80px = alto de la barra en md+: el hero cuenta mientras cubra la barra.
    const heroIo = hero
      ? new IntersectionObserver(([e]) => setOverHero(e.isIntersecting), {
          rootMargin: "-80px 0px 0px 0px",
        })
      : null;
    if (hero) heroIo?.observe(hero);
    return () => {
      io.disconnect();
      heroIo?.disconnect();
    };
  }, [isHome]);

  // Menú abierto: Escape cierra, Tab queda atrapado, el fondo no scrollea.
  useEffect(() => {
    if (!isOpen) return;
    const close = () => {
      setIsOpen(false);
      toggleRef.current?.focus();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return close();
      if (e.key !== "Tab" || !navRef.current) return;
      const items = [
        ...navRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ].filter((el) => el.offsetParent !== null);
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    navRef.current?.querySelector<HTMLElement>("#mobile-menu a")?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  // Solo la home tiene hero oscuro bajo la barra (texto crema): transparente en
  // el tope, vidrio oscuro al bajar, y crema opaca cuando el hero ya pasó.
  const heroBehind = isHome && overHero;
  const onDark = heroBehind || isOpen;
  const barBg = isOpen
    ? "bg-charcoal"
    : heroBehind
      ? isScrolled
        ? "bg-charcoal/55 backdrop-blur-xl border-b border-white/10"
        : "bg-transparent"
      : "bg-[#faf7f0]/90 backdrop-blur-xl border-b border-black/5";
  const cta = isHome ? "#contacto" : "/#contacto";

  const isCurrent = (id: string) => isHome && activeSection === id;
  const currentProps = (id: string) =>
    isCurrent(id) ? { "aria-current": "location" as const } : {};

  const linkTone = onDark
    ? "text-[#f4efe2]/85 hover:text-leaf-bright aria-[current]:text-leaf-bright"
    : "text-[#1a1812]/80 hover:text-[#0b6b45] aria-[current]:text-[#0b6b45]";

  return (
    <>
    <div ref={topRef} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-6" />
    <nav
      ref={navRef}
      aria-label="Navegación principal"
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${barBg}`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:h-20 md:px-8">
        <Link
          href="/#inicio"
          className="flex items-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-leaf-bright"
          onClick={() => setIsOpen(false)}
        >
          <span className="flex items-center gap-2">
            <SentinelMark className="size-7 md:size-8" />
            <SentinelLogo
              className="h-5 w-auto md:h-6"
              fill={onDark ? "#f4efe2" : "var(--primary)"}
            />
          </span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {navLinks.map((l) => (
            <a
              key={l.id}
              href={l.href}
              {...currentProps(l.id)}
              className={`t-small rounded-sm px-1 py-1 font-medium transition-colors aria-[current]:underline aria-[current]:underline-offset-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-bright ${linkTone}`}
            >
              {l.label}
            </a>
          ))}
          <a
            href={cta}
            className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-[0.9375rem] font-semibold transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-bright ${
              onDark
                ? "bg-leaf-bright text-charcoal shadow-[0_8px_30px_-6px_rgb(95_227_161/0.55)] hover:shadow-[0_12px_36px_-6px_rgb(95_227_161/0.7)]"
                : "bg-charcoal text-[#faf7f0] shadow-[0_8px_24px_-8px_rgb(15_122_79/0.5)] hover:bg-leaf"
            }`}
          >
            Solicitar un piloto
            <ArrowRight aria-hidden className="h-4 w-4" />
          </a>
        </div>

        <button
          ref={toggleRef}
          type="button"
          className={`-mr-2.5 rounded-sm p-2.5 md:hidden focus-visible:outline-2 focus-visible:outline-leaf-bright ${
            onDark ? "text-[#f4efe2]" : "text-[#1a1812]"
          }`}
          onClick={() => setIsOpen((o) => !o)}
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
        >
          {isOpen ? (
            <X aria-hidden className="h-6 w-6" />
          ) : (
            <Menu aria-hidden className="h-6 w-6" />
          )}
        </button>
      </div>

      <div
        id="mobile-menu"
        inert={!isOpen}
        className={`fixed inset-x-0 bottom-0 top-16 overflow-y-auto bg-charcoal px-5 pb-8 pt-6 text-[#f4efe2] md:hidden ${
          isOpen ? "block" : "hidden"
        }`}
      >
        <ul className="divide-y divide-white/10 border-y border-white/10">
          {navLinks.map((l) => (
            <li key={l.id}>
              <a
                href={l.href}
                {...currentProps(l.id)}
                onClick={() => setIsOpen(false)}
                className="t-h3 block py-4 aria-[current]:text-leaf-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-bright"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href={cta}
          onClick={() => setIsOpen(false)}
          className="mt-8 flex min-h-12 items-center justify-center rounded-full bg-leaf-bright px-5 text-base font-semibold text-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Solicitar un piloto
        </a>
      </div>
    </nav>
    </>
  );
}
