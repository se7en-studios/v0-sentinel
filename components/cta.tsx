import { Suspense } from "react";
import { CtaStickyBar } from "@/components/cta-sticky-bar";
import { ContactForm } from "@/components/contact-form";
import { CONTACT_FALLBACK_EMAIL, whatsappUrl } from "@/lib/contact";

const WA_URL = whatsappUrl(
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  "Hola Sentinel, quiero coordinar un piloto de detección temprana de incendios.",
);

const textLink =
  "font-semibold text-brand underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand";

export function CTA() {
  return (
    <>
      <section
        id="contacto"
        className="scroll-mt-20 border-t rule bg-paper py-24 text-ink md:py-32"
      >
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <h2 className="t-display max-w-4xl">Hablemos de tu territorio</h2>
          <div className="mt-14 grid gap-14 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="t-lead">
                Un piloto es una prueba acotada: elegimos juntos una zona, la
                monitoreamos y vemos si las alertas sirven antes de pensar en un
                contrato más grande.
              </p>
              <ul className="t-body mt-6 space-y-2 border-t rule pt-6">
                <li>No hay inversión inicial en equipos.</li>
                <li>
                  Apuntamos a 4 a 8 semanas hasta las primeras alertas, a
                  confirmar según el territorio.
                </li>
                <li>
                  Pensado para municipios, brigadas y propietarios forestales.
                </li>
              </ul>
              <p className="t-body mt-8">
                También podés escribirnos{" "}
                {WA_URL && (
                  <>
                    por{" "}
                    <a
                      href={WA_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={textLink}
                    >
                      WhatsApp
                      <span className="sr-only"> (abre en pestaña nueva)</span>
                    </a>{" "}
                    o{" "}
                  </>
                )}
                a{" "}
                <a
                  href={`mailto:${CONTACT_FALLBACK_EMAIL}`}
                  className={`${textLink} break-all`}
                >
                  {CONTACT_FALLBACK_EMAIL}
                </a>
                . Respondemos en 24 horas hábiles.
              </p>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <Suspense fallback={<div className="min-h-[28rem]" />}>
                <ContactForm />
              </Suspense>
            </div>
          </div>
        </div>
      </section>
      <CtaStickyBar />
    </>
  );
}
