"use client";

// Tierra de solo CSS: la textura (equirrectangular, verde bosque) corre dentro de un círculo con sombras interiores
// y un borde de brasa. Sin WebGL ni dependencias; con reduced-motion queda quieta.
const SIZE = 280;

// Focos de calor pegados al mapa (lat, lon): giran con la Tierra, no flotan encima.
export type GlobeDot = { lat: number; lon: number; delay?: number; more?: boolean };

function Dots({ dots, show, dense }: { dots: GlobeDot[]; show: boolean; dense: boolean }) {
  return (
    <>
      {[0, -1].map((k) => (
        <div
          key={k}
          className="cg-dots"
          style={{ width: SIZE * 2, height: SIZE, left: k * SIZE * 2, opacity: show ? 1 : 0 }}
        >
          {dots.map((d, i) => (
            <span
              key={i}
              className="cg-dot"
              style={{
                left: `${((d.lon + 180) / 360) * 100}%`,
                top: `${((90 - d.lat) / 180) * 100}%`,
                animationDelay: `${d.delay ?? 0}s`,
                opacity: d.more && !dense ? 0 : 1,
              }}
            />
          ))}
        </div>
      ))}
    </>
  );
}

export function CssGlobe({
  className,
  dots = [],
  showDots = false,
  denseDots = false,
}: {
  className?: string;
  dots?: GlobeDot[];
  showDots?: boolean;
  denseDots?: boolean;
}) {
  return (
    <div
      aria-hidden
      data-cg
      className={className}
      style={{
        width: SIZE,
        height: SIZE,
        borderRadius: "9999px",
        overflow: "hidden",
        position: "relative",
        backgroundImage: "url('/globe/earth-ember.webp')",
        // la textura es 2:1: con el alto fijo, un giro completo son 2×SIZE px
        backgroundSize: "auto 100%",
        backgroundRepeat: "repeat-x",
        backgroundPosition: "0 0",
        animation: "cg-rotate 60s linear infinite",
        boxShadow:
          "0 0 40px rgba(255,106,43,0.28), -5px 0 8px #ff9a5a inset, 15px 2px 25px #000 inset, -24px -2px 34px #ff6a2b99 inset, 170px 0 44px #00000044 inset, 100px 0 38px #00000077 inset",
      }}
    >
      <Dots dots={dots} show={showDots} dense={denseDots} />
      <style>{`@keyframes cg-rotate{from{background-position:0 0}to{background-position:${SIZE * 2}px 0}}@keyframes cg-move{to{transform:translateX(${SIZE * 2}px)}}@keyframes cg-pulse{0%,100%{box-shadow:0 0 6px 2px rgba(255,106,43,.8)}50%{box-shadow:0 0 14px 6px rgba(255,138,76,.95)}}.cg-dots{position:absolute;top:0;pointer-events:none;transition:opacity .7s;animation:cg-move 60s linear infinite}.cg-dot{position:absolute;width:7px;height:7px;margin:-3.5px 0 0 -3.5px;border-radius:9999px;background:#ffd2a8;transition:opacity .7s;animation:cg-pulse 1.8s ease-in-out infinite}@media (prefers-reduced-motion: reduce){[data-cg]{animation:none!important}.cg-dots{animation:none!important}.cg-dot{animation:none!important}}`}</style>
    </div>
  );
}
