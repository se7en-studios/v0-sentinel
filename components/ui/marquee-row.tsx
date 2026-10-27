import type { CSSProperties, ReactNode } from "react";

// Fila que corre sola a todo el ancho y pausa al pasar el mouse (.a-marquee en globals.css).
// `children(hidden)` pinta una mitad; la repetida va oculta a lectores de pantalla y tabulador.
// Cada mitad debe llenar el ancho de pantalla: repetir los ítems si son pocos.
// Con reduced-motion no se anima y se desplaza a mano.
export function MarqueeRow({
  children,
  fade = "#e6e3dc",
  seconds = 50,
  reverse = false,
}: {
  children: (hidden: boolean) => ReactNode;
  fade?: string;
  seconds?: number;
  reverse?: boolean;
}) {
  const half = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 gap-6 pr-6">
      {children(hidden)}
    </ul>
  );
  return (
    <div className="a-marquee relative left-1/2 w-screen -translate-x-1/2 overflow-hidden motion-reduce:overflow-x-auto">
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 md:w-32" style={{ background: `linear-gradient(to right, ${fade}, transparent)` }} />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 md:w-32" style={{ background: `linear-gradient(to left, ${fade}, transparent)` }} />
      <div className="a-marquee-track" style={{ "--dur": `${seconds}s`, animationDirection: reverse ? "reverse" : undefined } as CSSProperties}>
        {half(false)}
        {half(true)}
      </div>
    </div>
  );
}
