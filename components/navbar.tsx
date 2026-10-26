"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { SentinelLogo } from "@/components/sentinel-logo";
import { SECTIONS } from "@/lib/sections";
import { useActiveSection } from "@/hooks/use-active-section";

const BLOG = { id: "blog", label: "Blog", href: "/blog" };
const navLinks = [
  ...SECTIONS.filter((s) => s.nav && s.id !== "contacto").map((s) => ({
    id: s.id,
    label: s.label,
    href: `/#${s.id}`,
  })),
  BLOG,
  { id: "contacto", label: "Contacto", href: "/#contacto" },
];

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const activeSection = useActiveSection();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setIsMobileMenuOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isMobileMenuOpen]);

  // ponytail: only the home has a dark full-bleed hero under the transparent
  // nav (cream text). Every other route is cream: solid bar + dark text.
  const isLight = isHome && !isScrolled && !isMobileMenuOpen;
  const solid = !isLight;
  const cta = isHome ? "#contacto" : "/#contacto";

  const isCurrent = (id: string) =>
    id === "blog" ? pathname.startsWith("/blog") : isHome && activeSection === id;
  const currentProps = (id: string) =>
    isCurrent(id)
      ? { "aria-current": id === "blog" ? ("page" as const) : ("location" as const) }
      : {};

  const linkTone = isLight
    ? "text-[#faf7f0]/85 hover:text-[#faf7f0] focus-visible:text-[#faf7f0] aria-[current]:text-[#faf7f0] decoration-[#faf7f0]"
    : "text-[#1a1812]/75 hover:text-[#1a1812] focus-visible:text-[#1a1812] aria-[current]:text-[#0b6b45] decoration-[#0f7a4f]";

  return (
    <nav
      aria-label="Navegación principal"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        solid
          ? "bg-[#faf7f0]/95 backdrop-blur-xl border-b border-black/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-16 md:h-20">
          <a
            href="/#inicio"
            className={`flex items-center rounded-sm transition-colors duration-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0f7a4f] ${
              isLight ? "text-[#faf7f0]" : "text-[#1a1812]"
            }`}
          >
            <SentinelLogo className="h-5 w-auto" />
          </a>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                {...currentProps(link.id)}
                className={`text-[13px] font-light rounded-sm underline-offset-8 transition-colors duration-300 aria-[current]:underline aria-[current]:decoration-2 focus-visible:underline focus-visible:outline-none ${linkTone}`}
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:block">
            <a
              href={cta}
              className="inline-block text-[12px] font-medium px-5 py-2.5 rounded-full text-[#faf7f0] bg-[#0c0b09] transition-all duration-200 hover:bg-[#0f7a4f] focus-visible:bg-[#0f7a4f] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7a4f]"
              style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.04em" }}
            >
              Solicitar reunión
            </a>
          </div>

          <button
            ref={toggleRef}
            type="button"
            className={`md:hidden p-2.5 -mr-2.5 rounded-sm transition-colors duration-500 focus-visible:outline-2 focus-visible:outline-[#0f7a4f] ${
              isLight ? "text-[#faf7f0]" : "text-[#1a1812]"
            }`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        inert={!isMobileMenuOpen}
        className={`md:hidden transition-all duration-300 overflow-y-auto ${
          isMobileMenuOpen ? "max-h-[calc(100dvh-4rem)]" : "max-h-0"
        }`}
      >
        <div className="bg-[#faf7f0] border-t border-black/5 px-6 py-5 space-y-5">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              {...currentProps(link.id)}
              className="block text-[14px] font-light text-[#1a1812]/80 aria-[current]:text-[#0b6b45] aria-[current]:font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7a4f]"
              style={{ fontFamily: "var(--font-sans)" }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href={cta}
            className="block text-center text-[13px] font-medium px-5 py-3 rounded-full text-[#faf7f0] bg-[#0f7a4f] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c0b09]"
            style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.04em" }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Solicitar reunión
          </a>
        </div>
      </div>
    </nav>
  );
}
