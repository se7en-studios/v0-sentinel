"use client";

import { useEffect, useRef } from "react";

const DESKTOP_MOTION = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";

// El HTML (marco + poster) llega renderizado; GSAP se suma después solo en lg+.
export function HeroReveal() {
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const section = useRef<HTMLElement>(null);

  // Reproduce solo con el video en pantalla; con reduced-motion o ahorro de datos queda el poster.
  useEffect(() => {
    const v = video.current;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (!v || conn?.saveData || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) void v.play().catch(() => {});
      else v.pause();
    }, { threshold: 0.35 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!window.matchMedia(DESKTOP_MOTION).matches) return;
    let cancelled = false;
    let revert = () => {};

    void import("@/lib/gsap").then(({ gsap }) => {
      if (cancelled || !frame.current || !section.current) return;
      const hero = document.getElementById("inicio");
      const photo = hero?.querySelector<HTMLElement>("[data-hero-photo]");
      const dim = hero?.querySelector<HTMLElement>("[data-hero-dim]");
      const mm = gsap.matchMedia();
      mm.add(DESKTOP_MOTION, () => {
        gsap.fromTo(frame.current, { scale: 0.86, y: 40 }, {
          scale: 1, y: 0, ease: "none", force3D: true,
          scrollTrigger: { trigger: section.current, start: "top bottom", end: "top 25%", scrub: 0.6 },
        });
        if (hero && photo && dim) {
          const st = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
          gsap.to(photo, { scale: 1.08, ease: "none", scrollTrigger: st });
          gsap.to(dim, { opacity: 0.75, ease: "none", scrollTrigger: st });
        }
      });
      revert = () => mm.revert();
    });

    return () => {
      cancelled = true;
      revert();
    };
  }, []);

  return (
    <section ref={section} aria-label="El panel de Sentinel" className="a-root bg-a-bg px-5 pb-20 pt-12 md:px-8 md:pb-32 md:pt-20">
      <figure className="mx-auto max-w-6xl">
        <div ref={frame} className="a-brackets origin-center">
          <span className="a-bk a-bk-tr" />
          <span className="a-bk a-bk-bl" />
          <div className="a-frame relative aspect-video">
            <video
              ref={video}
              muted
              loop
              playsInline
              preload="metadata"
              poster="/video/admin-caso-hero-poster.webp"
              aria-label="Grabación del panel de Sentinel: el perímetro del incendio crece con la línea de tiempo"
              className="absolute inset-0 size-full object-cover"
            >
              <source src="/video/admin-caso-hero.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
        <figcaption className="mx-auto mt-4 max-w-xl text-center text-xs text-a-faint">
          Reconstrucción del incendio de Puerto Patriada (enero de 2026) en el panel de Sentinel con datos de NASA FIRMS y Sentinel-2.
        </figcaption>
      </figure>
    </section>
  );
}
