import { Mail, MapPin, Share2, Instagram, Linkedin } from "lucide-react";
import { SentinelLogo } from "@/components/sentinel-logo";
import { CONTACT_FALLBACK_EMAIL } from "@/lib/contact";

const footerLinks = {
  Plataforma: [
    { label: "Cómo funciona", href: "/#plataforma" },
    { label: "Para quién", href: "/#para-quien" },
    { label: "Datos en vivo", href: "/#en-vivo" },
    { label: "Metodología", href: "/metodologia" },
  ],
  Empresa: [
    { label: "Equipo", href: "/#equipo" },
    { label: "Blog", href: "/blog" },
    { label: "Prensa", href: "/#prensa" },
  ],
  Ayuda: [
    { label: "Preguntas frecuentes", href: "/#faq" },
    { label: "Contacto", href: "/#contacto" },
    { label: "Privacidad", href: "/privacidad" },
  ],
};

const socialLinks = [
  {
    href: "https://instagram.com/sentinel.arg",
    label: "Instagram",
    icon: Instagram,
  },
  {
    href: "https://linkedin.com/company/sentinelarg",
    label: "LinkedIn",
    icon: Linkedin,
  },
  { href: "https://linktr.ee/sentinelarg", label: "Linktree", icon: Share2 },
];

const link =
  "t-small text-[#f4efe2]/75 transition-colors hover:text-leaf-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-bright rounded-sm";

export function Footer() {
  return (
    <footer className="bg-charcoal text-[#f4efe2] border-t border-white/10">
      <div className="mx-auto w-full max-w-6xl px-5 md:px-8 pt-16 pb-10">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <SentinelLogo className="h-6 w-auto" />
            <p className="t-small mt-4 max-w-xs text-[#f4efe2]/75">
              Detección temprana de incendios forestales: datos satelitales,
              geoespacial e IA para quienes cuidan el territorio.
            </p>
            <div className="mt-5 space-y-2.5">
              <a
                href={`mailto:${CONTACT_FALLBACK_EMAIL}`}
                className={`${link} flex w-fit items-center gap-2.5`}
              >
                <Mail
                  aria-hidden
                  className="h-4 w-4 shrink-0 text-leaf-bright"
                />
                {CONTACT_FALLBACK_EMAIL}
              </a>
              <p className="t-small flex items-center gap-2.5 text-[#f4efe2]/75">
                <MapPin
                  aria-hidden
                  className="h-4 w-4 shrink-0 text-leaf-bright"
                />
                San Rafael, Mendoza, Argentina
              </p>
            </div>
            <div className="mt-5 flex gap-2">
              {socialLinks.map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-[#f4efe2]/80 transition-colors hover:border-leaf-bright hover:text-leaf-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-bright"
                >
                  <Icon aria-hidden className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([section, links]) => (
            <nav key={section} aria-label={section}>
              <p className="t-label mb-4 text-[#f4efe2]/60">{section}</p>
              <ul className="space-y-3">
                {links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className={link}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="t-small text-[#f4efe2]/65">
            © {new Date().getFullYear()} Sentinel. Todos los derechos
            reservados.
          </p>
          <a
            href="https://se7endev.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="t-small w-fit text-[#f4efe2]/65 transition-colors hover:text-leaf-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-bright rounded-sm"
          >
            Creado por{" "}
            <span className="font-medium text-leaf-bright">Se7en Dev</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
