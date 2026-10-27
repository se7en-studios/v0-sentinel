"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ASection } from "@/components/a-section";

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
    <ASection id="faq">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <p className="a-eyebrow">Preguntas frecuentes</p>
          <h2 className="a-title mt-4">{title}</h2>
          <p className="a-sub mt-5">
            ¿Otra duda?{" "}
            <a
              href="#contacto"
              className="font-medium text-a-accent underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-a-accent"
            >
              Escribinos
            </a>
            .
          </p>
        </div>

        <ul className="mt-12 space-y-3">
          {items.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <li key={faq.question} className="a-card">
                <h3>
                  <button
                    type="button"
                    id={`faq-trigger-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="flex min-h-14 w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-a-accent"
                  >
                    <span className="font-medium text-[#e3f6dc]">
                      {faq.question}
                    </span>
                    <Plus
                      aria-hidden
                      className={`h-5 w-5 shrink-0 text-a-accent transition-transform duration-300 ${
                        isOpen ? "rotate-45" : ""
                      }`}
                    />
                  </button>
                </h3>
                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${i}`}
                  className={`grid transition-[grid-template-rows] duration-300 ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden" inert={!isOpen}>
                    <p className="px-5 pb-5 pr-12 text-[0.9375rem] leading-relaxed text-a-mute">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </ASection>
  );
}
