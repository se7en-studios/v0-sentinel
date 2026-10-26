"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Chapter, Eyebrow } from "@/components/ui/chapter";
import { CONTACT_FALLBACK_EMAIL } from "@/lib/contact";

interface FaqItem {
  question: string;
  answer: string;
}

// Acordeón de una pregunta abierta a la vez. Nombre histórico: ya no hay categorías.
export function FaqSectionWithCategories({
  title,
  items,
}: {
  title: string;
  items: FaqItem[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Chapter id="faq" className="overflow-x-clip">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-20 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgb(15_122_79/0.10),transparent_70%)]"
      />
      <div className="relative grid gap-12 lg:grid-cols-[1fr_1.7fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Eyebrow>Preguntas frecuentes</Eyebrow>
          <h2 className="t-h2">{title}</h2>
          <div className="glass-light mt-8 rounded-[20px] p-6">
            <p className="t-h3">¿Otra duda?</p>
            <p className="t-small mt-2 text-foreground/75">
              Contanos qué territorio cuidás y te respondemos en 24 h hábiles.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="#contacto"
                className="inline-flex min-h-11 items-center rounded-full bg-[#09593a] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#0b6b44] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7a4f]"
              >
                Escribinos
              </a>
              <a
                href={`mailto:${CONTACT_FALLBACK_EMAIL}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-black/15 px-4 text-sm font-medium text-[#0b6b44] transition hover:border-[#0b6b44] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7a4f]"
              >
                <Mail aria-hidden className="h-4 w-4" />
                Email
              </a>
            </div>
          </div>
        </div>

        <ul className="space-y-3 md:space-y-4">
          {items.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <li
                key={faq.question}
                className={`glass-light rounded-[20px] transition-shadow duration-300 ${
                  isOpen ? "ring-1 ring-[#0f7a4f]/35" : ""
                }`}
              >
                <h3>
                  <button
                    type="button"
                    id={`faq-trigger-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="flex w-full items-center gap-4 rounded-[20px] px-5 py-5 text-left md:gap-6 md:px-7 md:py-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7a4f]"
                  >
                    <span
                      aria-hidden
                      className="t-label w-7 shrink-0 text-[#0b6b44]"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="t-body flex-1 font-semibold">
                      {faq.question}
                    </span>
                    <span
                      aria-hidden
                      className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
                        isOpen
                          ? "border-[#0b6b44] bg-[#0b6b44] text-white"
                          : "border-black/15 text-[#0b6b44]"
                      }`}
                    >
                      <span className="absolute h-0.5 w-3.5 rounded bg-current" />
                      <span
                        className={`absolute h-3.5 w-0.5 rounded bg-current transition-transform duration-300 ${
                          isOpen ? "scale-y-0" : ""
                        }`}
                      />
                    </span>
                  </button>
                </h3>
                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${i}`}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden" inert={!isOpen}>
                    <p className="t-body px-5 pb-6 text-foreground/80 md:pl-[4.75rem] md:pr-20">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Chapter>
  );
}
