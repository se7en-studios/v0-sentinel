"use client";

import { useRef } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Newspaper } from "lucide-react";
import { pressMentions } from "@/lib/press-mentions";
import { formatDate } from "@/lib/format-date";

export function Press() {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollByCard = (dir: 1 | -1) => {
    trackRef.current?.scrollBy({ left: dir * 380, behavior: "smooth" });
  };

  return (
    <section
      id="prensa"
      className="relative py-20 lg:py-24 overflow-hidden"
      style={{ background: "#faf7f0" }}
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
          <div>
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl mb-4 max-w-2xl flex items-center gap-3"
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 800,
                color: "rgba(26,24,18,0.92)",
                lineHeight: 1.1,
              }}
            >
              <Newspaper
                className="w-7 h-7 shrink-0 hidden sm:block"
                style={{ color: "var(--green-aa)" }}
              />
              Dónde{" "}
              <span style={{ color: "var(--green-aa)" }}>salimos en los medios.</span>
            </h2>
            <p
              className="text-[13px] max-w-xl"
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 300,
                color: "rgba(26,24,18,0.7)",
              }}
            >
              Medios y organizaciones que ya cubrieron el proyecto.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              aria-label="Notas anteriores"
              className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:-translate-y-0.5 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7a4f]"
              style={{
                border: "0.5px solid rgba(26,24,18,0.15)",
                color: "rgba(26,24,18,0.8)",
              }}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              aria-label="Notas siguientes"
              className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:-translate-y-0.5 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7a4f]"
              style={{
                border: "0.5px solid rgba(26,24,18,0.15)",
                color: "rgba(26,24,18,0.8)",
              }}
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <div
          ref={trackRef}
          role="region"
          aria-label="Notas de prensa"
          tabIndex={0}
          className="scrollbar-hide focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0f7a4f] flex gap-4 overflow-x-auto px-6 lg:px-10"
          style={{
            scrollSnapType: "x mandatory",
            scrollPadding: "0 24px",
          }}
        >
          {pressMentions.map((m, i) => (
            <PressCard key={i} mention={m} featured={i === 0} />
          ))}
          {/* trailing spacer so the last card can snap fully into view */}
          <div className="shrink-0 w-2 lg:w-6" aria-hidden />
        </div>

        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-10 sm:w-24"
          style={{
            background: "linear-gradient(to right, #faf7f0, transparent)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-10 sm:w-24"
          style={{
            background: "linear-gradient(to left, #faf7f0, transparent)",
          }}
        />
      </div>
    </section>
  );
}

function PressCard({
  mention,
  featured = false,
}: {
  mention: (typeof pressMentions)[number];
  featured?: boolean;
}) {
  return (
    <a
      href={mention.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative shrink-0 flex flex-col overflow-hidden rounded-lg border-[0.5px] border-[rgba(26,24,18,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(15,122,79,0.3)] focus-visible:border-[#0f7a4f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7a4f]"
      style={{
        background: "rgba(26,24,18,0.02)",
        width: featured ? "min(85vw, 460px)" : "min(75vw, 320px)",
        scrollSnapAlign: "start",
      }}
    >
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: featured ? "16/10" : "4/3",
          background:
            "linear-gradient(135deg, rgba(15,122,79,0.1), rgba(26,24,18,0.05))",
        }}
      >
        {mention.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={encodeURI(mention.image)}
            alt=""
            width={featured ? 460 : 320}
            height={featured ? 288 : 240}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Newspaper
              className="w-8 h-8"
              style={{ color: "rgba(15,122,79,0.25)" }}
            />
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(12,11,9,0.95) 0%, rgba(12,11,9,0.2) 55%, transparent 100%)",
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
          <span
            className="px-2 py-0.5 rounded-sm text-[11px] tracking-wider uppercase font-medium"
            style={{
              fontFamily: "var(--font-sans)",
              color: "#94f1be",
              background: "rgba(20,74,52,0.8)",
              border: "0.5px solid rgba(148,241,190,0.3)",
              backdropFilter: "blur(4px)",
            }}
          >
            {mention.outlet}
          </span>
          <ArrowUpRight
            className="w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            style={{ color: "rgba(255,255,255,0.85)" }}
          />
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <p
          className={
            featured
              ? "text-[16px] leading-snug line-clamp-3"
              : "text-[13px] leading-snug line-clamp-2"
          }
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            color: "rgba(26,24,18,0.9)",
          }}
        >
          {mention.title}
          <span className="sr-only"> (abre en pestaña nueva)</span>
        </p>
        {mention.date && (
          <p
            className="text-[11px] mt-3"
            style={{
              fontFamily: "var(--font-sans)",
              color: "rgba(26,24,18,0.65)",
            }}
          >
            {formatDate(mention.date)}
          </p>
        )}
      </div>
    </a>
  );
}
