"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export function Problem() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.05, rootMargin: "0px 0px 200px 0px" },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative bg-[#faf7f0]">
      {/* Hero image */}
      <div className="relative h-[68vh] min-h-[460px] overflow-hidden">
        <Image
          src="/a3.jpg"
          alt="Bomberos enfrentando incendio forestal en la Patagonia"
          fill
          sizes="100vw"
          loading="lazy"
          className="object-cover transition-transform duration-[3000ms]"
          style={{ transform: isVisible ? "scale(1.04)" : "scale(1)" }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0b09] via-[#0c0b09]/50 to-[#0c0b09]/20" />

        <div className="absolute bottom-0 left-0 right-0 px-8 md:px-16 pb-12">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-sm text-[11px] font-medium tracking-[0.18em] uppercase mb-4 transition-all duration-700"
            style={{
              fontFamily: "var(--font-sans)",
              background: "rgba(241,107,107,0.15)",
              border: "0.5px solid rgba(241,107,107,0.35)",
              color: "#f16b6b",
              opacity: isVisible ? 1 : 0,
            }}
          >
            Emergencia territorial
          </div>
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl leading-none font-extrabold tracking-[-0.03em] transition-all duration-700"
            style={{
              fontFamily: "var(--font-heading)",
              color: "rgba(240,234,216,0.95)",
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(16px)",
              transitionDelay: "100ms",
            }}
          >
            Hoy la Patagonia duele.
          </h2>

        </div>
      </div>

      {/* Contenido */}
      <div className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left */}
            <div>
              <p
                className="text-lg leading-relaxed mb-8 transition-all duration-700"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 300,
                  color: "rgba(26,24,18,0.7)",
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0)" : "translateY(16px)",
                  transitionDelay: "150ms",
                }}
              >
                No es solo bosque lo que se quema.{" "}
                <span style={{ color: "rgba(26,24,18,0.85)", fontWeight: 400 }}>
                  Detrás de cada hectárea hay un hogar, una fuente de trabajo y
                  una biodiversidad que no vuelve a crecer en lo que dura una
                  vida.
                </span>
              </p>

              {/* Problem list */}
              <div
                className="space-y-0 transition-all duration-700"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0)" : "translateY(16px)",
                  transitionDelay: "350ms",
                }}
              >
                {[
                  {
                    title: "Pulmón verde en riesgo",
                    body: "Bosques nativos que tardan décadas en regenerarse se pierden en horas.",
                  },
                  {
                    title: "Comunidades amenazadas",
                    body: "Familias enteras pierden sus hogares y su sustento económico.",
                  },
                  {
                    title: "Detección tardía",
                    body: "Cuanto más tarde se detecta un foco, más recursos exige controlarlo.",
                  },
                ].map((item, i) => (
                  <div
                    key={item.title}
                    className="flex gap-4 items-start py-4"
                    style={{
                      borderBottom:
                        i < 2 ? "0.5px solid rgba(26,24,18,0.06)" : "none",
                    }}
                  >
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        background: "#0f7a4f",
                        borderRadius: "50%",
                        marginTop: "6px",
                        flexShrink: 0,
                        opacity: 0.8,
                      }}
                    />
                    <div>
                      <p
                        style={{
                          fontSize: "14px",
                          fontFamily: "var(--font-sans)",
                          fontWeight: 500,
                          color: "rgba(26,24,18,0.85)",
                          marginBottom: "3px",
                        }}
                      >
                        {item.title}
                      </p>
                      <p
                        style={{
                          fontSize: "13px",
                          fontFamily: "var(--font-sans)",
                          fontWeight: 300,
                          color: "rgba(26,24,18,0.66)",
                          lineHeight: 1.5,
                        }}
                      >
                        {item.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div
                className="mt-12 transition-all duration-700"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0)" : "translateY(16px)",
                  transitionDelay: "450ms",
                }}
              >
                <a
                  href="#contacto"
                  className="group inline-flex items-center gap-2 px-7 py-3 text-[13px] font-medium rounded-sm transition-all duration-200 border border-[rgba(15,122,79,0.35)] bg-[rgba(15,122,79,0.1)] text-[var(--green-aa)] hover:bg-[#0f7a4f] hover:text-[#faf7f0] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Pedir una reunión
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </a>
              </div>
            </div>

            {/* Right — image grid */}
            <div
              className="grid grid-cols-2 gap-3 transition-all duration-700"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(24px)",
                transitionDelay: "400ms",
              }}
            >
              {["/problem-a2.jpg", "/problem-a1.jpg"].map((src, i) => (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-lg group transition-all duration-700"
                  style={{
                    aspectRatio: "4/5",
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible
                      ? "translateY(0) scale(1)"
                      : "translateY(20px) scale(0.97)",
                    transitionDelay: `${450 + i * 80}ms`,
                  }}
                >
                  <Image
                    src={src}
                    alt={`Incendio forestal en la Patagonia argentina ${i + 1}`}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
