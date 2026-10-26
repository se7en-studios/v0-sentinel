"use client";

import { Mail, MapPin, Share2, Instagram, Linkedin } from "lucide-react";
import { SentinelLogo } from "@/components/sentinel-logo";
import { ContactForm } from "@/components/contact-form";
import { CONTACT_FALLBACK_EMAIL } from "@/lib/contact";

const footerLinks = {
  Producto: [
    { label: "Cómo funciona", href: "/#servicios" },
    { label: "Reconocimientos", href: "/#noticias" },
    { label: "Prensa", href: "/#prensa" },
  ],
  Empresa: [
    { label: "Solución", href: "/#nosotros" },
    { label: "Equipo", href: "/#equipo" },
  ],
  Soporte: [
    { label: "Blog", href: "/blog" },
    { label: "Contacto", href: "/#contacto" },
    { label: "FAQ", href: "/#faq" },
    { label: "Privacidad", href: "/privacidad" },
  ],
};

const socialLinks = [
  {
    href: "https://instagram.com/sentinel.arg",
    label: "Instagram",
    icon: <Instagram className="w-4 h-4" />,
  },
  {
    href: "https://linkedin.com/company/sentinelarg",
    label: "LinkedIn",
    icon: <Linkedin className="w-4 h-4" />,
  },
  {
    href: "https://linktr.ee/sentinelarg",
    label: "Linktree",
    icon: <Share2 className="w-4 h-4" />,
  },
];

export function Footer() {
  return (
    <footer
      className="relative overflow-hidden"
      style={{ background: "#0c0b09" }}
    >
      {/* Top border gradient — same green-fade seam used elsewhere as a
          section boundary. */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(148,241,190,0.35), transparent)",
        }}
      />

      {/* dot-grid coverage texture — echoes the satellite card in
          capabilities.tsx, ties the closing section back to the brand's
          "always watching" idea instead of a flat dark panel. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(148,241,190,0.08) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 0%, black 0%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 0%, black 0%, transparent 75%)",
        }}
      />

      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none">
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 800,
            fontSize: "18vw",
            color: "rgba(148,241,190,0.04)",
            letterSpacing: "0.1em",
            whiteSpace: "nowrap",
          }}
        >
          SENTINEL
        </span>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-10">
        <div className="mb-16">
          <ContactForm />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-14">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <SentinelLogo className="h-6 w-auto" />
            </div>

            <p
              className="text-[13px] leading-relaxed mb-7 max-w-xs"
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 300,
                color: "rgba(240,234,216,0.55)",
              }}
            >
              Plataforma de detección temprana de incendios: datos satelitales,
              inteligencia artificial y alertas para quienes cuidan el territorio.
            </p>

            <div className="space-y-2.5 mb-7">
              <a
                href={`mailto:${CONTACT_FALLBACK_EMAIL}`}
                className="flex items-center gap-2.5 w-fit transition-colors duration-200"
                style={{ color: "rgba(240,234,216,0.6)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "rgba(240,234,216,0.85)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(240,234,216,0.6)")
                }
              >
                <Mail
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: "#94f1be", opacity: 0.8 }}
                />
                <span
                  className="text-[12px]"
                  style={{ fontFamily: "var(--font-sans)", fontWeight: 300 }}
                >
                  {CONTACT_FALLBACK_EMAIL}
                </span>
              </a>
              <div className="flex items-center gap-2.5">
                <MapPin
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: "#94f1be", opacity: 0.8 }}
                />
                <span
                  className="text-[12px]"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontWeight: 300,
                    color: "rgba(240,234,216,0.6)",
                  }}
                >
                  San Rafael, Mendoza, Argentina
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
                  style={{
                    background: "rgba(240,234,216,0.05)",
                    border: "0.5px solid rgba(240,234,216,0.15)",
                    color: "rgba(240,234,216,0.6)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(148,241,190,0.4)";
                    e.currentTarget.style.color = "#94f1be";
                    e.currentTarget.style.background = "rgba(148,241,190,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(240,234,216,0.15)";
                    e.currentTarget.style.color = "rgba(240,234,216,0.6)";
                    e.currentTarget.style.background = "rgba(240,234,216,0.05)";
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <p
                className="text-[11px] tracking-[0.2em] uppercase mb-5"
                style={{
                  fontFamily: "var(--font-sans)",
                  color: "rgba(240,234,216,0.3)",
                }}
              >
                {section}
              </p>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[13px] transition-colors duration-200"
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontWeight: 300,
                        color: "rgba(240,234,216,0.6)",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "#94f1be")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "rgba(240,234,216,0.6)")
                      }
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Live Network Telemetry Status */}
        <div className="mb-8 p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-emerald-300 font-semibold tracking-wider">
              RED SENTINEL CLOUD: 100% OPERATIVA
            </span>
          </div>
          <div className="flex items-center gap-4 text-white/50 text-[11px]">
            <span>NODOS PATAGONIA: CONECTADOS</span>
            <span className="hidden md:inline text-white/20">|</span>
            <span className="hidden md:inline">DESPACHO DE ALERTAS: ACTIVO</span>
          </div>
        </div>

        {/* Bottom */}
        <div
          className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: "rgba(240,234,216,0.08)" }}
        >
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 text-center sm:text-left">
            <p
              className="text-[12px]"
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 300,
                color: "rgba(240,234,216,0.5)",
              }}
            >
              © {new Date().getFullYear()} Sentinel. Todos los derechos
              reservados.
            </p>
            <span
              className="hidden sm:inline text-[10px]"
              style={{ color: "rgba(240,234,216,0.25)" }}
            >
              •
            </span>
            <span
              className="text-[11px] hidden sm:inline"
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 300,
                color: "rgba(240,234,216,0.45)",
              }}
            >
              Monitoreo y Alerta Temprana de Incendios
            </span>
          </div>

          {/* Creado por Se7en Dev */}
          <div className="flex items-center">
            <a
              href="https://se7endev.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 text-[12px] transition-colors duration-200"
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 300,
                color: "rgba(240,234,216,0.55)",
              }}
            >
              <span>Creado por</span>
              <span className="font-medium text-[#94f1be] group-hover:underline underline-offset-4 decoration-[#94f1be]/50 transition-all inline-flex items-center gap-1">
                Se7en Dev
                <svg
                  className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 opacity-70 group-hover:opacity-100"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 17L17 7M17 7H7M17 7V17"
                  />
                </svg>
              </span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
