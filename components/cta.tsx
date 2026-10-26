import { Suspense } from "react";
import { Check, Mail, MessageCircle } from "lucide-react";
import { Chapter, Eyebrow } from "@/components/ui/chapter";
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
  "inline-flex min-h-12 items-center gap-2.5 rounded-full border border-white/25 px-5 text-base font-medium text-[#f4efe2] transition hover:border-leaf-bright hover:text-leaf-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-bright";

export function CTA() {
  return (
    <Chapter id="contacto" tone="dark">
      <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div>
          <Eyebrow tone="dark">Contacto</Eyebrow>
          <h2 className="t-display">Empecemos con un piloto</h2>
          <p className="t-lead mt-6 max-w-xl text-[#f4efe2]/80">
            Contanos qué territorio cuidás. Definimos juntos la zona y validamos
            la detección antes de cualquier contrato mayor.
          </p>
          <ul className="mt-8 space-y-3">
            {GUARANTEES.map((g) => (
              <li key={g} className="t-body flex items-start gap-3">
                <Check
                  aria-hidden
                  className="mt-1 h-5 w-5 shrink-0 text-leaf-bright"
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
          fallback={
            <div className="min-h-[28rem] rounded-xl border border-white/15 bg-white/[0.04]" />
          }
        >
          <ContactForm />
        </Suspense>
      </div>
    </Chapter>
  );
}
