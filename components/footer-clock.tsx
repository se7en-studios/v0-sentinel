"use client";

import { useEffect, useState } from "react";

const fmt = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "America/Argentina/Buenos_Aires", // toda la Patagonia argentina usa UTC-3
});

// Se monta vacío (SSR estable) y arranca en el cliente; se pausa con la pestaña oculta.
export function FooterClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(() => !document.hidden && tick(), 20_000);
    return () => clearInterval(id);
  }, []);

  return (
    <p className="t-label text-[#f4efe2]/70">
      Atento al territorio · Patagonia{" "}
      <time className="tabular-nums text-leaf-bright" suppressHydrationWarning>
        {time || "--:--"}
      </time>{" "}
      ART
    </p>
  );
}
