import { SentinelLogo, SentinelMark } from "@/components/sentinel-logo";
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
  { href: "https://instagram.com/sentinel.arg", label: "Instagram" },
  { href: "https://linkedin.com/company/sentinelarg", label: "LinkedIn" },
  { href: "https://linktr.ee/sentinelarg", label: "Linktree" },
];

const link =
  "t-small inline-block py-1 text-paper/75 underline-offset-4 transition-colors hover:text-paper hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper";

export function Footer() {
  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto w-full max-w-6xl px-5 pb-8 pt-16 md:px-8 md:pt-20">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <span className="flex items-center gap-2.5">
              <SentinelMark className="size-7" />
              <SentinelLogo className="h-5 w-auto" fill="#f3efe5" />
            </span>
            <p className="t-small mt-5 max-w-xs text-paper/75">
              Detección temprana de incendios forestales con datos satelitales,
              información geoespacial e IA.
            </p>
            <p className="t-small mt-5 text-paper/75">
              San Rafael, Mendoza, Argentina
            </p>
            <a href={`mailto:${CONTACT_FALLBACK_EMAIL}`} className={link}>
              {CONTACT_FALLBACK_EMAIL}
            </a>
            <ul className="mt-3 flex flex-wrap gap-x-5">
              {socialLinks.map(({ href, label }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={link}
                  >
                    {label}
                    <span className="sr-only"> (abre en pestaña nueva)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {Object.entries(footerLinks).map(([section, links]) => (
            <nav key={section} aria-label={section}>
              <p className="t-small mb-3 font-semibold">{section}</p>
              <ul className="space-y-1">
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

        <div className="mt-14 flex flex-col gap-3 border-t border-paper/20 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="t-small text-paper/70">
            © {new Date().getFullYear()} Sentinel. Todos los derechos
            reservados.
          </p>
          <a
            href="https://se7endev.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="t-small w-fit text-paper/70 underline-offset-4 hover:text-paper hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
          >
            Creado por Se7en Dev
            <span className="sr-only"> (abre en pestaña nueva)</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
