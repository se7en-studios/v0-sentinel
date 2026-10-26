import { Suspense } from "react";
import Image from "next/image";
import { Check, Mail, MessageCircle } from "lucide-react";
import { Eyebrow } from "@/components/ui/chapter";
import { ContactForm } from "@/components/contact-form";
import { CONTACT_FALLBACK_EMAIL, whatsappUrl } from "@/lib/contact";

const GUARANTEES = [
  "Sin inversión inicial en equipos (CAPEX)",
  "Piloto de 4 a 8 semanas, a confirmar según el territorio",
  "Para municipios, brigadas y propietarios forestales",
];

const WA_URL = whatsappUrl(
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  "Hola Sentinel, quiero coordinar un piloto de detección temprana de incendios.",
);

const quick =
  "glass inline-flex min-h-12 items-center gap-2.5 rounded-full px-5 text-base font-medium text-[#f4efe2] transition hover:-translate-y-0.5 hover:border-leaf-bright/60 hover:text-leaf-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-bright";

export function CTA() {
  return (
    <section
      id="contacto"
      className="relative isolate scroll-mt-20 overflow-hidden bg-charcoal py-24 text-[#f4efe2] md:py-36"
    >
      {/* Foto del bosque con grading ámbar → verde y degradé a charcoal arriba y abajo. */}
      <Image
        src="/hero-forest.avif"
        alt=""
        fill
        sizes="100vw"
        loading="lazy"
        className="-z-30 object-cover object-[50%_60%] opacity-45 saturate-[0.7]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-[linear-gradient(115deg,rgb(232_115_42/0.28),transparent_45%,rgb(15_122_79/0.35)_100%)] mix-blend-soft-light"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-[linear-gradient(to_bottom,var(--color-charcoal)_0%,rgb(18_17_14/0.55)_28%,rgb(18_17_14/0.7)_70%,var(--color-charcoal)_100%)]"
      />
      {/* Panel real del producto, desenfocado: solo decorativo. */}
      <Image
        src="/product/panel-3d.webp"
        alt=""
        width={2000}
        height={1250}
        sizes="60vw"
        loading="lazy"
        className="pointer-events-none absolute -right-[18%] top-[8%] -z-10 hidden w-[62%] max-w-none rotate-[-4deg] opacity-[0.14] blur-[6px] brightness-75 lg:block"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(rgb(244_239_226)_1px,transparent_1px),linear-gradient(90deg,rgb(244_239_226)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
      />
      <div
        aria-hidden
        className="bg-noise absolute inset-0 -z-10 opacity-[0.06] mix-blend-overlay"
      />

      <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16">
          <div>
            <Eyebrow tone="dark">Contacto</Eyebrow>
            <h2 className="t-display">Empecemos con un piloto</h2>
            <p className="t-lead mt-6 max-w-xl text-[#f4efe2]/85">
              Contanos qué territorio cuidás. Definimos juntos la zona y
              validamos la detección antes de cualquier contrato mayor.
            </p>
            <ul className="mt-8 flex flex-wrap gap-2.5">
              {GUARANTEES.map((g) => (
                <li
                  key={g}
                  className="glass t-small flex items-center gap-2 rounded-full py-2 pl-3 pr-4"
                >
                  <Check
                    aria-hidden
                    className="h-4 w-4 shrink-0 text-leaf-bright"
                  />
                  <span>{g}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-3">
              {WA_URL && (
                <a
                  href={WA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={quick}
                >
                  <MessageCircle aria-hidden className="h-5 w-5" />
                  Escribinos por WhatsApp
                </a>
              )}
              <a href={`mailto:${CONTACT_FALLBACK_EMAIL}`} className={quick}>
                <Mail aria-hidden className="h-5 w-5" />
                {CONTACT_FALLBACK_EMAIL}
              </a>
            </div>
          </div>
          <Suspense
            fallback={<div className="glass min-h-[28rem] rounded-[20px]" />}
          >
            <ContactForm />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
