"use client";

import { useState } from "react";
import { Plus, Minus, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filtered =
    activeCategory === "Todas"
      ? items
      : items.filter((i) => i.category === activeCategory);

  return (
    <section
      id="faq"
      className="py-24 lg:py-32 bg-[#faf7f0] overflow-hidden"
    >
      <div className="max-w-4xl mx-auto px-6 lg:px-10">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase mb-4 bg-emerald-900/10 text-emerald-800 border border-emerald-700/20">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
            <span>Preguntas Frecuentes</span>
          </div>

          <h2
            className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#1a1812] mb-4"
            style={{ fontFamily: "var(--font-heading)", lineHeight: 1.1 }}
          >
            {title}
          </h2>
          
          {description && (
            <p
              className="text-[15px] text-[#1a1812]/70 font-light max-w-lg mx-auto"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {description}
            </p>
          )}
        </motion.div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
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
                className={`px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-300 ${
                  active
                    ? "bg-emerald-800 text-white shadow-md shadow-emerald-900/15 scale-105"
                    : "bg-white text-[#1a1812]/70 border border-black/10 hover:border-black/20 hover:text-[#1a1812]"
                }`}
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Accordion with Smooth Spring Physics */}
        <div className="space-y-3">
          {filtered.map((faq, i) => {
            const isOpen = openIndex === i;
            const panelId = `faq-panel-${activeCategory}-${i}`;
            const buttonId = `faq-trigger-${activeCategory}-${i}`;

            return (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className={`rounded-2xl transition-all duration-300 border ${
                  isOpen
                    ? "bg-white border-emerald-600/30 shadow-lg shadow-emerald-950/5"
                    : "bg-white/60 border-black/5 hover:bg-white hover:border-black/10"
                }`}
              >
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="w-full flex items-center justify-between gap-4 p-6 text-left"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                >
                  <span
                    className="text-[15px] sm:text-[16px] font-semibold text-[#1a1812]"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {faq.question}
                  </span>

                  <div
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isOpen
                        ? "bg-emerald-800 text-white rotate-180"
                        : "bg-emerald-50 text-emerald-800"
                    }`}
                  >
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-1 text-[14px] text-[#1a1812]/75 font-light leading-relaxed border-t border-black/5">
                        <p style={{ fontFamily: "var(--font-sans)" }}>
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Contact Info Footer Note */}
        {contactInfo && (
          <div className="mt-12 text-center">
            <p className="text-[14px] text-[#1a1812]/70 font-light mb-3">
              {contactInfo.title}
            </p>
            <button
              type="button"
              onClick={contactInfo.onContact}
              className="px-6 py-2.5 rounded-full text-[13px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-600/20 hover:bg-emerald-100 transition-colors"
            >
              {contactInfo.buttonText}
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
