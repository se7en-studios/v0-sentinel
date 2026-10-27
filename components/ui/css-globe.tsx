"use client";

// Tierra de solo CSS: la textura (equirrectangular, verde bosque) corre dentro de un círculo con sombras interiores
// y un borde de brasa. Sin WebGL ni dependencias; con reduced-motion queda quieta.
const SIZE = 280;

export function CssGlobe({ className }: { className?: string }) {
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
      <style>{`@keyframes cg-rotate{from{background-position:0 0}to{background-position:${SIZE * 2}px 0}}@media (prefers-reduced-motion: reduce){[data-cg]{animation:none!important}}`}</style>
    </div>
  );
}
