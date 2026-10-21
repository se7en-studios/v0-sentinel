"use client";

import { useEffect } from "react";

const PREFIX = "sentinel-admin-workspace-v1";
const BACKUP = "sentinel-admin-backup:";

/** Every workspace copy this browser holds (one per account). */
function storedWorkspaces() {
  const out: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const v = k?.startsWith(PREFIX) ? localStorage.getItem(k) : null;
      if (k && v) out[k] = v;
    }
  } catch {
    /* private mode */
  }
  return out;
}

export default function AdminError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] render error", error);
  }, [error]);

  // a render error is not proof the saved data is bad: keep a copy before clearing anything
  const wipe = () => {
    try {
      for (const [k, v] of Object.entries(storedWorkspaces())) {
        localStorage.setItem(BACKUP + k, v);
        localStorage.removeItem(k);
      }
    } catch {
      /* private mode or quota */
    }
    reset();
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(storedWorkspaces(), null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sentinel-respaldo.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <main className="grid min-h-dvh place-items-center bg-[#faf7f0] px-6 text-center text-[#1a1812]">
      <div className="max-w-md">
        <h1 className="font-heading text-xl font-bold">
          Algo falló en el panel
        </h1>
        <p className="mt-2 text-[14px] text-[#1a1812]/65">
          Podés reintentar. Si se repite, restablecé el espacio de trabajo de
          este navegador: antes se guarda una copia de respaldo, y también podés
          descargarla.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-[#0f7a4f] px-4 py-2 text-sm font-medium text-white"
          >
            Reintentar
          </button>
          <button
            type="button"
            onClick={download}
            className="rounded-md border border-black/15 px-4 py-2 text-sm"
          >
            Descargar respaldo
          </button>
          <button
            type="button"
            onClick={wipe}
            className="rounded-md border border-black/15 px-4 py-2 text-sm"
          >
            Restablecer y reintentar
          </button>
        </div>
      </div>
    </main>
  );
}
