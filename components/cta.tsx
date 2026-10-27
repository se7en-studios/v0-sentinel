import { Suspense } from "react";
import { Mail, MessageCircle } from "lucide-react";
import { SplitReveal } from "@/components/ui/split-reveal";
import { ASection, aFocus } from "@/components/a-section";
import { ContactForm } from "@/components/contact-form";
import { FAQ } from "@/components/faq";
import { CONTACT_FALLBACK_EMAIL, whatsappUrl } from "@/lib/contact";

const WA_URL = whatsappUrl(
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  "Hola Sentinel, quiero coordinar un piloto de detección temprana de incendios.",
);

const quick = `inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-medium text-a-accent underline decoration-a-line underline-offset-4 hover:decoration-a-accent ${aFocus}`;

// Piloto: sin precios (se define con cada organización) y las 4 a 8 semanas son una estimación interna.
const PILOT = [
  "4 a 8 semanas hasta las primeras alertas a confirmar, según el territorio.",
  "Sin inversión inicial en equipos: todo en la nube.",
  "Elegimos juntos una zona, la que más te preocupa.",
];

// Capítulo final único: piloto + contacto + preguntas frecuentes (reemplaza a Pilot y FAQ en la home).
export function CTA() {
  return (
    <ASection id="contacto" tone="forest" className="!pb-20">
      <span id="piloto" className="absolute" aria-hidden />
      <div className="grid gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
        <div>
          <p className="a-eyebrow flex items-center gap-3 !text-left !text-a-accent">
            <span aria-hidden className="h-px w-8 bg-a-accent/60" />
            Piloto
          </p>
          <SplitReveal as="h2" className="a-display mt-5 !tracking-[-0.03em]">
            Hablemos de tu{" "}
            <span className="bg-gradient-to-r from-[#a9efc9] via-[#d8f5cf] to-[#ffb27a] bg-clip-text pr-[0.15em] italic text-transparent">
              territorio
            </span>
          </SplitReveal>
          <ol className="mt-10 max-w-lg space-y-3">
            {PILOT.map((t, i) => (
              <li
                key={t}
                className="a-card flex items-start gap-4 !bg-white/[0.03] p-4 md:p-5"
              >
                <span aria-hidden className="font-[family-name:var(--font-display)] text-3xl leading-none text-a-accent">
                  {i + 1}
                </span>
                <span className="text-[1.0625rem] leading-snug text-[#d3e6d8]">{t}</span>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-col items-start gap-1">
            {WA_URL && (
              <a href={WA_URL} target="_blank" rel="noopener noreferrer" className={quick}>
                <MessageCircle aria-hidden className="h-4 w-4" />
                Escribinos por WhatsApp
                <span className="sr-only"> (abre en pestaña nueva)</span>
              </a>
            )}
            <a href={`mailto:${CONTACT_FALLBACK_EMAIL}`} className={quick}>
              <Mail aria-hidden className="h-4 w-4" />
              {CONTACT_FALLBACK_EMAIL}
            </a>
          </div>
        </div>

        <div className="a-rise relative min-w-0">
          <div aria-hidden className="pointer-events-none absolute -inset-10 -z-10 bg-[radial-gradient(closest-side,rgba(255,106,43,0.18),transparent)]" />
          <Suspense fallback={<div className="a-card min-h-[28rem]" aria-hidden />}>
            <ContactForm />
          </Suspense>
        </div>
      </div>

      <div className="mt-24 md:mt-32">
        <FAQ />
      </div>
    </ASection>
  );
}
