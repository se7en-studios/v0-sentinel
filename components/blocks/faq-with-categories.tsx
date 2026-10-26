"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

interface FaqSectionWithCategoriesProps {
  title: string;
  description?: string;
  items: FaqItem[];
  contactInfo?: {
    title: string;
    buttonText: string;
    onContact: () => void;
  };
}

export function FaqSectionWithCategories({
  title,
  description,
  items,
  contactInfo,
}: FaqSectionWithCategoriesProps) {
  const categories = [
    "Todas",
    ...Array.from(new Set(items.map((i) => i.category))),
  ];
  const [activeCategory, setActiveCategory] = useState("Todas");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered =
    activeCategory === "Todas"
      ? items
      : items.filter((i) => i.category === activeCategory);

  return (
    <section
      id="faq"
      className="py-20 lg:py-24"
      style={{ background: "#faf7f0" }}
    >
      <div className="max-w-3xl mx-auto px-6 lg:px-10">
        <div className="mb-10 text-center">
          <p
            className="text-[11px] tracking-[0.3em] uppercase mb-5"
            style={{
              fontFamily: "var(--font-sans)",
              color: "var(--muted-foreground)",
            }}
          >
            Preguntas frecuentes
          </p>
          <h2
            className="text-4xl sm:text-5xl mb-4"
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 800,
              color: "rgba(26,24,18,0.92)",
              lineHeight: 1.1,
            }}
          >
            {title}
          </h2>
          {description && (
            <p
              className="text-sm md:text-base max-w-lg mx-auto"
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 300,
                color: "var(--muted-foreground)",
              }}
            >
              {description}
            </p>
          )}
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((cat) => {
            const active = cat === activeCategory;
            return (
              <button
                key={cat}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setActiveCategory(cat);
                  setOpenIndex(null);
                }}
                className="px-4 py-2 rounded-full text-xs transition-all duration-200"
                style={{
                  fontFamily: "var(--font-sans)",
                  border: `0.5px solid ${active ? "rgba(15,122,79,0.4)" : "rgba(26,24,18,0.1)"}`,
                  background: active
                    ? "rgba(15,122,79,0.08)"
                    : "rgba(26,24,18,0.02)",
                  color: active ? "var(--green-aa)" : "var(--muted-foreground)",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Accordion */}
        <div
          className="border-t"
          style={{ borderColor: "rgba(26,24,18,0.08)" }}
        >
          {filtered.map((faq, i) => {
            const isOpen = openIndex === i;
            const panelId = `faq-panel-${activeCategory}-${i}`;
            const buttonId = `faq-trigger-${activeCategory}-${i}`;
            return (
              <div
                key={faq.question}
                className="border-b"
                style={{ borderColor: "rgba(26,24,18,0.08)" }}
              >
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="w-full flex items-start justify-between gap-4 py-6 text-left group"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                >
                  <span
                    className="text-[14px] font-medium leading-snug transition-colors duration-200 group-hover:text-[rgba(26,24,18,0.95)]"
                    style={{
                      fontFamily: "var(--font-sans)",
                      color: isOpen
                        ? "rgba(26,24,18,0.95)"
                        : "rgba(26,24,18,0.7)",
                    }}
                  >
                    {faq.question}
                  </span>
                  <div
                    className="flex-shrink-0 w-7 h-7 rounded-sm flex items-center justify-center mt-0.5 transition-all duration-200"
                    style={{
                      background: isOpen
                        ? "rgba(15,122,79,0.12)"
                        : "rgba(26,24,18,0.04)",
                      border: `0.5px solid ${isOpen ? "rgba(15,122,79,0.35)" : "rgba(26,24,18,0.1)"}`,
                    }}
                  >
                    {isOpen ? (
                      <Minus
                        className="w-3.5 h-3.5"
                        style={{ color: "var(--green-aa)" }}
                      />
                    ) : (
                      <Plus
                        className="w-3.5 h-3.5"
                        style={{ color: "var(--muted-foreground)" }}
                      />
                    )}
                  </div>
                </button>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  aria-hidden={!isOpen}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p
                      className="pb-6 text-[13px] leading-relaxed"
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontWeight: 300,
                        color: "rgba(26,24,18,0.65)",
                      }}
                    >
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {contactInfo && (
          <div className="mt-12 text-center">
            <p
              className="text-sm mb-4"
              style={{
                fontFamily: "var(--font-sans)",
                color: "rgba(26,24,18,0.62)",
              }}
            >
              {contactInfo.title}
            </p>
            <button
              type="button"
              onClick={contactInfo.onContact}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-sm text-[13px] font-normal transition-all duration-200 hover:border-[rgba(15,122,79,0.5)] hover:text-[#0f7a4f]"
              style={{
                fontFamily: "var(--font-sans)",
                background: "rgba(15,122,79,0.06)",
                border: "0.5px solid rgba(15,122,79,0.25)",
                color: "var(--green-aa)",
              }}
            >
              {contactInfo.buttonText}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
