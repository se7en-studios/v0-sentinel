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
          <SplitReveal as="h2" className="a-display">
            Hablemos de tu territorio
          </SplitReveal>
          <ul className="a-sub mt-10 max-w-md space-y-3">
            {PILOT.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
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

        <div className="a-rise min-w-0">
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
