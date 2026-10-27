import type { ReactNode } from "react";

const TONES = { dark: "", surface: "!bg-a-surface", forest: "a-forest", bone: "a-bone" };

// Sección del sistema oscuro: fondo continuo, ancho acotado, título centrado con etiqueta.
export function ASection({
  id,
  tone = "dark",
  className = "",
  children,
}: {
  id?: string;
  tone?: "dark" | "surface" | "forest" | "bone";
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`a-root relative scroll-mt-20 py-24 md:py-36 ${TONES[tone]} ${className}`}>
      <div className="mx-auto w-full max-w-[1100px] px-5 md:px-8">{children}</div>
    </section>
  );
}

export function AHeading({
  eyebrow,
  title,
  sub,
  titleAs: Title = "h2",
}: {
  eyebrow: string;
  title: ReactNode;
  sub?: ReactNode;
  titleAs?: "h1" | "h2";
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="a-eyebrow">{eyebrow}</p>
      <Title className="a-title mt-4">{title}</Title>
      {sub ? <p className="a-sub mt-5">{sub}</p> : null}
    </div>
  );
}

// Escalonado para .a-rise en grillas: el rango de la animación se corre por índice.
export const riseDelay = (i: number, step = 7) => ({
  animationRange: `entry ${4 + i * step}% entry ${48 + i * step}%`,
});

export const aFocus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-a-accent";
