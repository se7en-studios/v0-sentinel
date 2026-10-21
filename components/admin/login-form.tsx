"use client";

import { useState } from "react";
import { LoginShell } from "./login-shell";
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
    const j = (await res?.json().catch(() => null)) as { error?: string } | null;
    setErr(res ? (j?.error ?? "Contraseña incorrecta") : "No se pudo conectar");
    setBusy(false);
  };

  return (
    <LoginShell
      subtitle="Acceso para clientes de Sentinel Cloud."
      onSubmit={submit}
    >
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
    </LoginShell>
  );
}
