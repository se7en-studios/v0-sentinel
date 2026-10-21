"use client";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  const wipe = () => {
    try {
      localStorage.removeItem("sentinel-admin-workspace-v1");
    } catch {
      /* private mode */
    }
    reset();
  };
  return (
    <main className="grid min-h-dvh place-items-center bg-[#faf7f0] px-6 text-center text-[#1a1812]">
      <div className="max-w-md">
        <h1 className="font-heading text-xl font-bold">Algo falló en el panel</h1>
        <p className="mt-2 text-[14px] text-[#1a1812]/65">Podés reintentar. Si se repite, restablecé el espacio de trabajo guardado en este navegador.</p>
        <div className="mt-4 flex justify-center gap-2">
          <button type="button" onClick={reset} className="rounded-md bg-[#0f7a4f] px-4 py-2 text-sm font-medium text-white">Reintentar</button>
          <button type="button" onClick={wipe} className="rounded-md border border-black/15 px-4 py-2 text-sm">Restablecer y reintentar</button>
        </div>
      </div>
    </main>
  );
}
