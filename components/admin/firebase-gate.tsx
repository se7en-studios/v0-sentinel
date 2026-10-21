"use client";

import { useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { LoginShell } from "./login-shell";
import { fb } from "@/lib/admin/firebase";
import { AdminApp, type CloudSession } from "./admin-app";
import { Btn, inputCls } from "./ui";

const MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Email o contraseña incorrectos.",
  "auth/invalid-email": "El email no es válido.",
  "auth/user-disabled":
    "Esta cuenta está deshabilitada. Escribinos a sentinelproyecto@gmail.com.",
  "auth/too-many-requests": "Demasiados intentos. Esperá unos minutos.",
  "auth/network-request-failed": "Sin conexión. Revisá tu internet.",
};
const errMsg = (e: unknown) =>
  MESSAGES[(e as { code?: string })?.code ?? ""] ??
  "No se pudo iniciar sesión.";

function CloudLogin() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await signInWithEmailAndPassword(fb().auth, email.trim(), pw);
    } catch (err) {
      setMsg({ text: errMsg(err) });
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!email.trim())
      return setMsg({
        text: "Escribí tu email y volvé a tocar “Olvidé mi contraseña”.",
      });
    try {
      await sendPasswordResetEmail(fb().auth, email.trim());
    } catch {
      /* same answer either way: do not reveal which emails exist */
    }
    setMsg({
      ok: true,
      text: "Si el email tiene una cuenta, te enviamos un enlace para restablecer la contraseña.",
    });
  };

  return (
    <LoginShell
      subtitle="Ingresá con la cuenta de tu organización."
      onSubmit={submit}
    >
        <label
          htmlFor="em"
          className="mb-1 block text-[12px] font-medium text-foreground/70"
        >
          Email
        </label>
        <input
          id="em"
          type="email"
          autoComplete="username"
          autoFocus
          className={inputCls}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label
          htmlFor="pw"
          className="mb-1 mt-3 block text-[12px] font-medium text-foreground/70"
        >
          Contraseña
        </label>
        <input
          id="pw"
          type="password"
          autoComplete="current-password"
          className={inputCls}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        {msg && (
          <p
            role="alert"
            className={`mt-2 text-[12px] ${msg.ok ? "text-primary" : "text-[#b83a3a]"}`}
          >
            {msg.text}
          </p>
        )}
        <Btn
          type="submit"
          variant="solid"
          className="mt-4 h-10 w-full"
          disabled={busy || !email || !pw}
        >
          {busy ? "Ingresando…" : "Ingresar"}
        </Btn>
        <button
          type="button"
          onClick={reset}
          className="mt-3 w-full text-center text-[12px] text-foreground/55 underline-offset-2 hover:underline"
        >
          Olvidé mi contraseña
        </button>
    </LoginShell>
  );
}

export function FirebaseGate() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => onAuthStateChanged(fb().auth, setUser), []);

  const cloud = useMemo<CloudSession | undefined>(
    () =>
      user
        ? {
            uid: user.uid,
            email: user.email,
            getToken: () => user.getIdToken(),
            signOut: () => signOut(fb().auth),
          }
        : undefined,
    [user],
  );

  if (user === undefined) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#faf7f0] text-sm text-black/50">
        Cargando…
      </main>
    );
  }
  if (!cloud) return <CloudLogin />;
  return <AdminApp authRequired cloud={cloud} />;
}
