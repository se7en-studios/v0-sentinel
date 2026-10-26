"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Instagram } from "lucide-react";

const posts = [
  {
    image: "/ig-post-1.jpg",
    // Review: original caption claimed "drones autónomos... menos de 5 minutos"
    // (contradicts software-first). Rewritten as target; confirm vs. the real post.
    caption:
      "Un incendio detectado en los primeros minutos se controla. Uno detectado horas después, arrasa. Sentinel apunta a detectar focos activos lo antes posible con datos satelitales e IA.",
    alt: "Publicación de Sentinel sobre detección temprana de incendios",
    href: "https://www.instagram.com/p/DWmLb_DjvIA/",
  },
  {
    image: "/ig-post-2.jpg",
    caption:
      "Con Sentinel pasás de reaccionar a predecir. Monitorear → Detectar/Verificar → Contextualizar → Alertar. Así funciona la protección real del territorio.",
    alt: "Publicación de Sentinel con el ciclo monitorear, detectar, contextualizar y alertar",
    href: "https://www.instagram.com/p/DWmLh-Bjn91/",
  },
  {
    image: "/ig-post-3.jpg",
    caption:
      "El fuego no da segundas oportunidades. Usamos sistemas de detección temprana e inteligencia territorial para identificar el peligro antes de que sea incontrolable.",
    alt: "Publicación de Sentinel sobre detección temprana e inteligencia territorial",
    href: "https://www.instagram.com/p/DZL3LoIjMNn/",
  },
];

export function InstagramFeed() {
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
    <section
      ref={sectionRef}
      className="relative py-20 lg:py-24 overflow-hidden"
      style={{ background: "#faf7f0" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(15,122,79,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
        <div
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16 transition-all duration-700"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(16px)",
          }}
        >
          <div>
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl mb-4"
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 800,
                color: "rgba(26,24,18,0.92)",
                lineHeight: 1,
              }}
            >
              Seguinos en <span style={{ color: "var(--green-aa)" }}>Instagram.</span>
            </h2>
            <p
              className="max-w-md text-[13px] leading-relaxed"
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 300,
                color: "rgba(26,24,18,0.62)",
              }}
            >
              Prevenimos incendios y generamos datos ambientales, el detrás de
              escena de Sentinel contado por el equipo.
            </p>
          </div>

          <a
            href="https://instagram.com/sentinel.arg"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-sm text-[13px] font-medium transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] w-fit"
            style={{
              fontFamily: "var(--font-sans)",
              background: "rgba(15,122,79,0.1)",
              border: "0.5px solid rgba(15,122,79,0.3)",
              color: "var(--green-aa)",
            }}
          >
            <Instagram className="w-4 h-4" />
            @sentinel.arg
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {posts.map((post, i) => (
            <a
              key={post.href}
              href={post.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative rounded-lg overflow-hidden border-[0.5px] border-[rgba(26,24,18,0.08)] transition-all duration-500 hover:-translate-y-1 hover:border-[rgba(15,122,79,0.3)] shadow-lg shadow-black/10 ${
                i === 0
                  ? "aspect-[4/5] sm:aspect-[4/9] sm:row-span-2"
                  : "aspect-square sm:aspect-[16/10]"
              }`}
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(24px)",
                transitionDelay: `${i * 100}ms`,
              }}
            >
              <Image
                src={post.image}
                alt={post.alt}
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30" />

              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p
                  className="text-[12px] leading-relaxed line-clamp-4"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontWeight: 300,
                    color: "rgba(240,234,216,0.85)",
                  }}
                >
                  {post.caption}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
