"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";
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
const BRAND = "#0b4f35";

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const activeSection = useActiveSection();

  // Un observer: detecta "salí del tope" para mostrar el filete inferior.
  useEffect(() => {
    const top = topRef.current;
    if (!top) return;
    const io = new IntersectionObserver(([e]) =>
      setIsScrolled(!e.isIntersecting),
    );
    io.observe(top);
    return () => io.disconnect();
  }, []);

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

  const cta = isHome ? "#contacto" : "/#contacto";
  const isCurrent = (id: string) => isHome && activeSection === id;
  const currentProps = (id: string) =>
    isCurrent(id) ? { "aria-current": "location" as const } : {};

  return (
    <>
      <div
        ref={topRef}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-6"
      />
      <nav
        ref={navRef}
        aria-label="Navegación principal"
        className={`fixed inset-x-0 top-0 z-50 bg-paper transition-colors duration-200 ${
          isScrolled || isOpen ? "border-b rule" : "border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:h-20 md:px-8">
          <Link
            href="/#inicio"
            className="flex items-center gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            onClick={() => setIsOpen(false)}
          >
            <SentinelMark className="size-7 md:size-8" />
            <SentinelLogo className="h-5 w-auto md:h-6" fill={BRAND} />
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((l) => (
              <a
                key={l.id}
                href={l.href}
                {...currentProps(l.id)}
                className="t-small rounded-sm px-1 py-1 font-medium text-ink transition-colors hover:text-brand aria-[current]:text-brand aria-[current]:underline aria-[current]:underline-offset-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {l.label}
              </a>
            ))}
            <a
              href={cta}
              className="inline-flex min-h-11 items-center rounded-sm bg-brand px-5 text-[0.9375rem] font-semibold text-paper transition-colors hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Pedir un piloto
            </a>
          </div>

          <button
            ref={toggleRef}
            type="button"
            className="-mr-2.5 rounded-sm p-2.5 text-ink md:hidden focus-visible:outline-2 focus-visible:outline-brand"
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
          className={`fixed inset-x-0 bottom-0 top-16 overflow-y-auto bg-paper px-5 pb-8 pt-6 text-ink md:hidden ${
            isOpen ? "block" : "hidden"
          }`}
        >
          <ul className="divide-y divide-ink/15 border-y rule">
            {navLinks.map((l) => (
              <li key={l.id}>
                <a
                  href={l.href}
                  {...currentProps(l.id)}
                  onClick={() => setIsOpen(false)}
                  className="t-h3 block py-4 aria-[current]:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={cta}
            onClick={() => setIsOpen(false)}
            className="mt-8 flex min-h-12 items-center justify-center rounded-sm bg-brand px-5 text-base font-semibold text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Pedir un piloto
          </a>
        </div>
      </nav>
    </>
  );
}
