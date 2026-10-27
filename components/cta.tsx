import { Suspense } from "react";
import { Mail, MessageCircle } from "lucide-react";
import { ASection, aFocus } from "@/components/a-section";
import { ContactForm } from "@/components/contact-form";
import { CONTACT_FALLBACK_EMAIL, whatsappUrl } from "@/lib/contact";

const WA_URL = whatsappUrl(
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  "Hola Sentinel, quiero coordinar un piloto de detección temprana de incendios.",
);

const quick = `inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-medium text-a-accent underline decoration-a-line underline-offset-4 hover:decoration-a-accent ${aFocus}`;

// El panel forest sigue en el footer, que cierra con la palabra de marca.
export function CTA() {
  return (
    <ASection id="contacto" tone="forest" className="!pb-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="a-eyebrow">Contacto</p>
        <h2 className="a-display mt-5">Hablemos de tu territorio</h2>
        <p className="a-sub mx-auto mt-6 max-w-xl">
          Contanos qué zona cuidás. Elegimos juntos dónde probar y validamos las
          alertas antes de pensar en algo más grande.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-2xl">
        <Suspense
          fallback={<div className="a-card min-h-[28rem]" aria-hidden />}
        >
          <ContactForm />
        </Suspense>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-1">
          {WA_URL && (
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={quick}
            >
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
    </ASection>
  );
}
