import { Instagram, Linkedin } from "lucide-react";
import { SentinelLogo } from "@/components/sentinel-logo";
import { CONTACT_FALLBACK_EMAIL } from "@/lib/contact";

const COLUMNS = [
  {
    title: "Producto",
    links: [
      { label: "Cómo funciona", href: "/#plataforma" },
      { label: "Simulador", href: "/simulador" },
      { label: "Metodología", href: "/metodologia" },
    ],
  },
  {
    title: "Sentinel",
    links: [
      { label: "Equipo", href: "/#equipo" },
      { label: "Blog", href: "/blog" },
      { label: "Contacto", href: "/#contacto" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacidad", href: "/privacidad" },
      { label: "Créditos de imágenes", href: "/creditos" },
    ],
  },
];

const SOCIALS = [
  { href: "https://instagram.com/sentinel.arg", label: "Instagram", icon: Instagram },
  { href: "https://linkedin.com/company/sentinelarg", label: "LinkedIn", icon: Linkedin },
];

const link =
  "a-linkline inline-flex min-h-8 w-fit items-center rounded-sm text-sm text-a-mute transition-colors hover:text-a-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-a-accent";

export function Footer() {
  return (
    <footer className="a-root a-forest overflow-hidden">
      <div className="mx-auto w-full max-w-6xl px-5 pb-6 pt-16 md:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <SentinelLogo className="h-6 w-auto" fill="#a9efc9" />
            <p className="mt-4 text-sm text-a-mute">San Rafael, Mendoza, Argentina</p>
            <a href={`mailto:${CONTACT_FALLBACK_EMAIL}`} className={`${link} mt-1`}>
              {CONTACT_FALLBACK_EMAIL}
            </a>
          </div>

          {COLUMNS.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-a-faint">{c.title}</p>
              <ul className="space-y-1">
                {c.links.map((l) => (
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

        <div className="mt-14 flex flex-col gap-3 border-t border-a-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-a-mute">© {new Date().getFullYear()} Sentinel. Todos los derechos reservados.</p>
          <div className="flex items-center gap-5">
            {SOCIALS.map(({ href, label, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${label} (abre en pestaña nueva)`}
                className="flex h-11 w-11 items-center justify-center rounded-full text-a-mute transition-colors hover:text-a-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-a-accent"
              >
                <Icon aria-hidden className="h-4 w-4" />
              </a>
            ))}
            <a
              href="https://se7endev.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm text-sm text-a-mute transition-colors hover:text-a-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-a-accent"
            >
              Creado por <span className="font-medium text-a-accent">Se7en Dev</span>
            </a>
          </div>
        </div>
      </div>
      {/* Palabra de marca recortada por abajo; decorativa (el nombre ya está arriba). */}
      <div aria-hidden className="mx-auto mt-6 h-[clamp(3.5rem,15vw,15rem)] w-full max-w-[1600px] overflow-hidden px-2">
        <p data-w="SENTINEL" className="a-wordmark-xl a-wordmark-rise text-center after:content-[attr(data-w)]" />
      </div>
    </footer>
  );
}
