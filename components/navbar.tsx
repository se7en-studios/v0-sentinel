"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { SentinelLogo, SentinelMark } from "@/components/sentinel-logo";
import { useActiveSection } from "@/hooks/use-active-section";

const NAV_LINKS = [
  { id: "plataforma", label: "Cómo funciona" },
  { id: "en-vivo", label: "En vivo" },
  { id: "para-quien", label: "Para quién" },
  { id: "equipo", label: "Quiénes somos" },
];

const FOCUSABLE = "a[href], button:not([disabled])";
const RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9efc9]";

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const prefix = isHome ? "" : "/";
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const activeSection = useActiveSection();

  // Un IntersectionObserver sobre un centinela en lo alto de la página: sin listener de scroll.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) =>
      setIsScrolled(!e.isIntersecting),
    );
    io.observe(el);
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

  const barBg = isOpen ? "bg-a-bg" : "";

  const current = (id: string) =>
    isHome && activeSection === id
      ? { "aria-current": "location" as const }
      : {};

  return (
    <>
      <div
        ref={sentinelRef}
        aria-hidden
        className="pointer-events-none absolute left-0 top-20 h-px w-px"
      />
      <nav
        ref={navRef}
        aria-label="Navegación principal"
        className={`fixed inset-x-0 top-0 z-50 font-[family-name:var(--font-geist)] text-[#e3f6dc] transition-colors duration-300 ${barBg}`}
      >
        {!isOpen && (
          <>
            <div aria-hidden className={`absolute inset-0 -z-10 bg-gradient-to-b from-black/50 to-transparent transition-opacity duration-500 ${isScrolled ? "opacity-0" : "opacity-100"}`} />
            <div aria-hidden className={`absolute inset-0 -z-10 border-b border-a-line bg-a-bg/90 transition-opacity duration-500 ${isScrolled ? "opacity-100" : "opacity-0"}`} />
          </>
        )}
        <div className="mx-auto grid h-14 max-w-6xl grid-cols-[1fr_auto] items-center gap-4 px-5 md:h-16 md:grid-cols-[1fr_auto_1fr] md:px-8">
          <a
            href={`${prefix}#inicio`}
            onClick={() => setIsOpen(false)}
            className={`flex w-fit items-center gap-2 rounded-sm ${RING}`}
          >
            <SentinelMark className="size-6" />
            <SentinelLogo className="h-4 w-auto" fill="#e3f6dc" />
            <span className="rounded-full border border-a-line px-2 py-0.5 text-xs font-medium text-a-mute">
              Cloud
            </span>
          </a>

          <ul className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((l) => (
              <li key={l.id}>
                <a
                  href={`${prefix}#${l.id}`}
                  {...current(l.id)}
                  className={`a-linkline rounded-sm py-1 text-sm text-a-mute transition-colors hover:text-[#e3f6dc] aria-[current]:text-[#e3f6dc] aria-[current]:[background-size:100%_1px] ${RING}`}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden items-center justify-end gap-5 md:flex">
            <a
              href="/demo"
              className={`rounded-sm text-sm text-a-mute transition-colors hover:text-[#e3f6dc] ${RING}`}
            >
              Ver el panel
            </a>
            <a
              href={`${prefix}#contacto`}
              className={`a-pill !h-9 !px-4 !text-sm ${RING}`}
            >
              Pedir un piloto
            </a>
          </div>

          <button
            ref={toggleRef}
            type="button"
            className={`-mr-2.5 justify-self-end rounded-sm p-2.5 md:hidden ${RING}`}
            onClick={() => setIsOpen((o) => !o)}
            aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {isOpen ? (
              <X aria-hidden className="size-6" />
            ) : (
              <Menu aria-hidden className="size-6" />
            )}
          </button>
        </div>

        <div
          id="mobile-menu"
          inert={!isOpen}
          className={`fixed inset-x-0 bottom-0 top-14 overflow-y-auto bg-a-bg px-5 pb-8 pt-4 md:hidden ${
            isOpen ? "block" : "hidden"
          }`}
        >
          <ul className="divide-y divide-[color:var(--color-a-line)] border-y border-a-line">
            {NAV_LINKS.map((l) => (
              <li key={l.id}>
                <a
                  href={`${prefix}#${l.id}`}
                  {...current(l.id)}
                  onClick={() => setIsOpen(false)}
                  className={`block py-4 text-lg font-medium aria-[current]:text-a-accent ${RING}`}
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="/demo"
                onClick={() => setIsOpen(false)}
                className={`block py-4 text-lg font-medium text-a-mute ${RING}`}
              >
                Ver el panel
              </a>
            </li>
          </ul>
          <a
            href={`${prefix}#contacto`}
            onClick={() => setIsOpen(false)}
            className={`a-pill mt-8 !h-12 w-full ${RING}`}
          >
            Pedir un piloto
          </a>
        </div>
      </nav>
    </>
  );
}
