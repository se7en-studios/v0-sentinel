"use client";

import { useState } from "react";
import { SentinelLogo } from "@/components/sentinel-logo";
import { Btn, inputCls } from "./ui";

export function LoginForm() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    }).catch(() => null);
    if (res?.ok) return window.location.reload();
    setErr(res ? "Contraseña incorrecta" : "No se pudo conectar");
    setBusy(false);
  };

  return (
    <main className="grid min-h-dvh place-items-center bg-[#0c0b09] px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-xl border border-white/10 bg-[#faf7f0] p-7 shadow-2xl"
      >
        <SentinelLogo className="mb-1 h-6 w-auto" />
        <h1 className="font-heading text-xl font-bold">Panel de monitoreo</h1>
        <p className="mb-5 mt-1 text-[13px] text-foreground/55">
          Acceso para clientes de Sentinel Cloud.
        </p>
        <label
          htmlFor="pw"
          className="mb-1 block text-[12px] font-medium text-foreground/70"
        >
          Contraseña
        </label>
        <input
          id="pw"
          type="password"
          autoFocus
          autoComplete="current-password"
          className={inputCls}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        {err && (
          <p role="alert" className="mt-2 text-[12px] text-[#b83a3a]">
            {err}
          </p>
        )}
        <Btn
          type="submit"
          variant="solid"
          className="mt-4 h-10 w-full"
          disabled={busy || !pw}
        >
          {busy ? "Ingresando…" : "Ingresar"}
        </Btn>
      </form>
    </main>
  );
}
