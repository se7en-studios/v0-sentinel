import { SentinelLogo, SentinelMark } from "@/components/sentinel-logo";
import { Mail, MapPin, Share2, Instagram, Linkedin } from "lucide-react";
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
  "t-small inline-block py-1 text-[#f4efe2]/75 transition-colors hover:text-leaf-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-bright rounded-sm";

export function Footer() {
  return (
    <footer className="relative isolate overflow-hidden bg-charcoal text-[#f4efe2]">
      <div
        aria-hidden
        className="bg-noise absolute inset-0 -z-10 opacity-[0.05] mix-blend-overlay"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgb(95_227_161/0.4),transparent)]"
      />
      <div className="mx-auto w-full max-w-6xl px-5 pb-6 pt-16 md:px-8 md:pt-20">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <span className="flex items-center gap-2.5">
              <SentinelMark className="size-8" />
              <SentinelLogo className="h-6 w-auto" fill="#f4efe2" />
            </span>
            <p className="t-small mt-5 max-w-xs text-[#f4efe2]/75">
              Detección temprana de incendios forestales: datos satelitales,
              geoespacial e IA para quienes cuidan el territorio.
            </p>
            <div className="mt-6 space-y-2.5">
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
            <div className="mt-6 flex gap-2.5">
              {socialLinks.map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="glass flex h-11 w-11 items-center justify-center rounded-full text-[#f4efe2]/85 transition hover:-translate-y-0.5 hover:border-leaf-bright/60 hover:text-leaf-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-bright"
                >
                  <Icon aria-hidden className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([section, links]) => (
            <nav key={section} aria-label={section}>
              <p className="t-label mb-4 text-leaf-bright">{section}</p>
              <ul className="space-y-1.5">
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
            className="t-small w-fit rounded-sm text-[#f4efe2]/65 transition-colors hover:text-leaf-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-bright"
          >
            Creado por{" "}
            <span className="font-medium text-leaf-bright">Se7en Dev</span>
          </a>
        </div>
      </div>

      {/* Wordmark tipográfico decorativo, recortado al borde inferior. */}
      <div
        aria-hidden
        className="pointer-events-none mt-4 h-[5.5rem] select-none overflow-hidden text-center md:h-[11rem]"
      >
        <p className="font-[family-name:var(--font-display)] text-[clamp(4.5rem,19vw,17rem)] uppercase leading-[0.9] tracking-tight text-transparent [-webkit-text-stroke:1px_rgb(244_239_226/0.14)] bg-clip-text bg-[linear-gradient(to_bottom,rgb(244_239_226/0.14),transparent_85%)]">
          Sentinel
        </p>
      </div>
    </footer>
  );
}
