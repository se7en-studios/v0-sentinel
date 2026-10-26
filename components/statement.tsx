// Momento tipográfico entre capítulos. Sin JS: el énfasis se ilumina palabra por palabra con
// una view-timeline CSS; si el navegador no la soporta (o hay reduced-motion) el texto ya está visible.
const CSS = `
.st-sec{view-timeline-name:--st;view-timeline-axis:block}
.st-w{color:#f08a4b}
@supports (animation-timeline: view()){
  @media (prefers-reduced-motion: no-preference){
    .st-w{color:rgb(244 239 226/.22);animation:st-lit linear both;animation-timeline:--st;
      animation-range:entry calc(12% + var(--i)*7%) entry calc(32% + var(--i)*7%)}
    @keyframes st-lit{to{color:#f08a4b}}
  }
}`;

export function Statement({ text, accent }: { text: string; accent: string }) {
  const at = accent ? text.indexOf(accent) : -1;
  const before = at === -1 ? text : text.slice(0, at);
  const lit = at === -1 ? "" : accent;
  const after = at === -1 ? "" : text.slice(at + accent.length);

  return (
    <section className="st-sec relative isolate flex min-h-[80svh] items-center overflow-hidden bg-charcoal py-24 text-[#f4efe2] md:py-32">
      <style>{CSS}</style>
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_70%_55%_at_20%_100%,rgb(232_115_42/0.22),transparent_70%),radial-gradient(ellipse_60%_50%_at_90%_0%,rgb(15_122_79/0.28),transparent_70%)]"
      />
      <div
        aria-hidden
        className="bg-noise absolute inset-0 -z-10 opacity-[0.07] mix-blend-overlay"
      />
      <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
        <p className="t-display max-w-5xl text-balance">
          {before}
          {lit.split(" ").map((w, i, arr) => (
            <span key={i}>
              <span className="st-w" style={{ "--i": i } as React.CSSProperties}>
                {w}
              </span>
              {i < arr.length - 1 ? " " : ""}
            </span>
          ))}
          {after}
        </p>
      </div>
    </section>
  );
}
