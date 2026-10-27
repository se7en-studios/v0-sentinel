"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

// Acordeón de una pregunta abierta a la vez, sin tarjetas. Vive dentro del capítulo
// "Hablemos" (CTA), por eso no abre su propia sección. Nombre histórico: ya no hay categorías.
export function FaqSectionWithCategories({
  title,
  items,
}: {
  title: string;
  items: FaqItem[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div id="faq" className="scroll-mt-20">
      <h3 className="text-sm font-medium uppercase tracking-[0.16em] text-a-faint">
        {title}
      </h3>
      <ul className="mt-6 divide-y divide-a-line border-y border-a-line">
        {items.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <li key={faq.question}>
              <h4>
                <button
                  type="button"
                  id={`faq-trigger-${i}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex min-h-16 w-full items-center justify-between gap-4 py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-a-accent"
                >
                  <span className="text-lg font-medium text-[#e3f6dc]">
                    {faq.question}
                  </span>
                  <Plus
                    aria-hidden
                    className={`h-5 w-5 shrink-0 text-a-accent transition-transform duration-300 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  />
                </button>
              </h4>
              <div
                id={`faq-panel-${i}`}
                role="region"
                aria-labelledby={`faq-trigger-${i}`}
                className={`grid transition-[grid-template-rows] duration-300 ${
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden" inert={!isOpen}>
                  <p className="max-w-2xl pb-5 pr-10 text-[0.9375rem] leading-relaxed text-a-mute">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
