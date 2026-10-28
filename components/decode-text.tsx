"use client";

import { useEffect } from "react";

const GLYPHS = "01ABCDEFGHJKLMNPQRSTUVXYZ/<>+*#";

// Las etiquetas de sección se "decodifican" una vez al entrar en pantalla (efecto de terminal).
// Sin reduced-motion y sin tocar la estructura: solo cambia el texto de los nodos de texto y termina en el original.
export function DecodeText() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const done = new WeakSet<Element>();
    const run = (el: HTMLElement) => {
      const nodes: { n: Text; full: string }[] = [];
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let t: Node | null;
      while ((t = w.nextNode())) {
        const full = t.textContent ?? "";
        if (full.trim().length > 1) nodes.push({ n: t as Text, full });
      }
      const start = performance.now();
      const dur = 700;
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / dur);
        for (const { n, full } of nodes) {
          n.textContent = full
            .split("")
            .map((c, i) => (c === " " || i < full.length * p ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
            .join("");
        }
        if (p < 1) requestAnimationFrame(step);
        else for (const { n, full } of nodes) n.textContent = full;
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting && !done.has(e.target)) {
            done.add(e.target);
            run(e.target as HTMLElement);
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.6 },
    );
    document.querySelectorAll<HTMLElement>(".a-eyebrow").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
