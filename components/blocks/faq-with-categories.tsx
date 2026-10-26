"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Chapter, Eyebrow } from "@/components/ui/chapter";

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
    <Chapter id="faq">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <div>
          <Eyebrow>Preguntas frecuentes</Eyebrow>
          <h2 className="t-h2">{title}</h2>
          <p className="t-body mt-5 text-foreground/75">
            ¿Otra duda?{" "}
            <a
              href="#contacto"
              className="font-medium text-[#0b6b44] underline underline-offset-2"
            >
              Escribinos
            </a>
            .
          </p>
        </div>

        <ul className="divide-y divide-black/10 border-y border-black/10">
          {items.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <li key={faq.question}>
                <h3>
                  <button
                    type="button"
                    id={`faq-trigger-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7a4f]"
                  >
                    <span className="t-body font-semibold">{faq.question}</span>
                    <Plus
                      aria-hidden
                      className={`h-5 w-5 shrink-0 text-[#0b6b44] transition-transform duration-300 ${
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
                    <p className="t-body pb-5 pr-9 text-foreground/80">
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
