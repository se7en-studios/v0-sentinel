"use client";

import { useState } from "react";
import { LoginShell } from "./login-shell";
import { Btn, inputCls } from "./ui";
import { useStoredT } from "./use-stored-t";

export function LoginForm() {
  const { t } = useStoredT();
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
    setErr(res ? (res.status === 401 ? t("login.wrongPassword") : (j?.error ?? t("login.wrongPassword"))) : t("login.noConnection"));
    setBusy(false);
  };

  return (
    <LoginShell
      t={t}
      subtitle={t("login.subPassword")}
      onSubmit={submit}
    >
        <label
          htmlFor="pw"
          className="mb-1 block text-[12px] font-medium text-foreground/70"
        >
          {t("login.password")}
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
          {busy ? t("login.busy") : t("login.submit")}
        </Btn>
    </LoginShell>
  );
}
