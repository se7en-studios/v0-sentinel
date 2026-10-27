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
      <p className="a-eyebrow flex items-center gap-3 !text-left !text-a-accent">
        <span aria-hidden className="h-px w-8 bg-a-accent/60" />
        FAQ
      </p>
      <h3 className="a-display-m mt-4 !text-[clamp(2.25rem,4.2vw,3.75rem)] text-[#e3f6dc]">
        {title}
      </h3>
      <ul className="mt-10 divide-y divide-a-line border-y border-a-line">
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
                  className="group flex min-h-20 w-full items-center justify-between gap-4 py-5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-a-accent"
                >
                  <span className="flex items-baseline gap-4 md:gap-6">
                    <span aria-hidden className="w-7 text-[0.9375rem] tabular-nums text-a-faint">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`font-[family-name:var(--font-display)] text-[clamp(1.375rem,2.2vw,1.875rem)] leading-[1.15] transition-colors ${
                        isOpen ? "text-a-accent" : "text-[#e3f6dc] group-hover:text-white"
                      }`}
                    >
                      {faq.question}
                    </span>
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
                  <p className="max-w-2xl pb-6 pl-11 pr-10 text-[1.0625rem] leading-relaxed text-[#b9cdbf] md:pl-[3.25rem]">
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
