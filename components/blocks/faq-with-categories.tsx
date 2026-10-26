"use client";

import { useState } from "react";
import { CONTACT_FALLBACK_EMAIL } from "@/lib/contact";

interface FaqItem {
  question: string;
  answer: string;
}

const norm = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

// Acordeón de una pregunta abierta a la vez. Nombre histórico: ya no hay categorías.
export function FaqSectionWithCategories({
  title,
  items,
}: {
  title: string;
  items: FaqItem[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const q = norm(query.trim());
  // Se conserva el índice original para que los ids de aria-controls no cambien al filtrar.
  const visible = items
    .map((faq, i) => ({ faq, i }))
    .filter(
      ({ faq }) => !q || norm(`${faq.question} ${faq.answer}`).includes(q),
    );

  return (
    <section
      id="faq"
      className="scroll-mt-20 overflow-x-clip bg-paper py-24 text-ink md:py-32"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 md:px-8 lg:grid-cols-12">
        <div className="lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
          <h2 className="t-h2">{title}</h2>
          <p className="t-body mt-6 text-ink/80">
            Si la tuya no está, escribinos y te respondemos en 24 horas hábiles:{" "}
            <a
              href={`mailto:${CONTACT_FALLBACK_EMAIL}`}
              className={`font-semibold text-brand underline underline-offset-4 ${focus}`}
            >
              {CONTACT_FALLBACK_EMAIL}
            </a>
            .
          </p>
        </div>

        <div className="min-w-0 lg:col-span-7 lg:col-start-6">
          <label
            htmlFor="faq-search"
            className="t-small mb-1 block text-ink/75"
          >
            Buscar en las preguntas
          </label>
          <input
            id="faq-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-controls="faq-list"
            placeholder="Precio, falsas alarmas, soporte"
            autoComplete="off"
            className="min-h-11 w-full rounded-none border-0 border-b border-ink/50 bg-transparent px-0 text-base text-ink placeholder:text-ink/55 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-0"
          />
          <p role="status" className="sr-only">
            {q ? `${visible.length} de ${items.length} preguntas` : ""}
          </p>

          {visible.length === 0 && (
            <p className="t-body mt-8">
              No encontramos esa pregunta.{" "}
              <a
                href="#contacto"
                className="font-semibold underline underline-offset-4"
              >
                Escribinos y te respondemos
              </a>
              .
            </p>
          )}

          <ul id="faq-list" className="mt-8 border-b rule">
            {visible.map(({ faq, i }) => {
              const isOpen = openIndex === i;
              return (
                <li key={faq.question} className="border-t rule">
                  <h3>
                    <button
                      type="button"
                      id={`faq-trigger-${i}`}
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${i}`}
                      onClick={() => setOpenIndex(isOpen ? null : i)}
                      className={`flex w-full items-center justify-between gap-6 py-5 text-left ${focus}`}
                    >
                      <span className="font-serif text-xl leading-snug md:text-2xl">
                        {faq.question}
                      </span>
                      <span
                        aria-hidden
                        className="relative h-4 w-4 shrink-0 text-brand"
                      >
                        <span className="absolute left-0 top-1/2 h-px w-4 bg-current" />
                        <span
                          className={`absolute left-1/2 top-0 h-4 w-px bg-current transition-transform duration-200 ${
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
                    className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden" inert={!isOpen}>
                      <p className="t-body max-w-2xl pb-6 text-ink/85">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
