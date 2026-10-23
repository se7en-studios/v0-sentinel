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
import { fbAuth } from "@/lib/admin/firebase";
import { AdminApp, type CloudSession } from "./admin-app";
import { Btn, inputCls } from "./ui";
import { useStoredT } from "./use-stored-t";
import type { MsgKey, Translate } from "@/lib/admin/i18n";

const ERR_KEYS: Record<string, MsgKey> = {
  "auth/invalid-credential": "auth.invalid-credential",
  "auth/invalid-email": "auth.invalid-email",
  "auth/user-disabled": "auth.user-disabled",
  "auth/too-many-requests": "auth.too-many-requests",
  "auth/network-request-failed": "auth.network-request-failed",
};
const errMsg = (e: unknown, t: Translate) =>
  t(ERR_KEYS[(e as { code?: string })?.code ?? ""] ?? "auth.generic");

function CloudLogin() {
  const { t } = useStoredT();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await signInWithEmailAndPassword(fbAuth(), email.trim(), pw);
    } catch (err) {
      setMsg({ text: errMsg(err, t) });
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!email.trim())
      return setMsg({
        text: t("login.needEmail"),
      });
    try {
      await sendPasswordResetEmail(fbAuth(), email.trim());
    } catch {
      /* same answer either way: do not reveal which emails exist */
    }
    setMsg({
      ok: true,
      text: t("login.resetSent"),
    });
  };

  return (
    <LoginShell
      t={t}
      subtitle={t("login.subCloud")}
      onSubmit={submit}
    >
        <label
          htmlFor="em"
          className="mb-1 block text-[12px] font-medium text-foreground/70"
        >
          {t("login.email")}
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
          {t("login.password")}
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
          {busy ? t("login.busy") : t("login.submit")}
        </Btn>
        <button
          type="button"
          onClick={reset}
          className="mt-3 w-full text-center text-[12px] text-foreground/55 underline-offset-2 hover:underline"
        >
          {t("login.forgot")}
        </button>
    </LoginShell>
  );
}

export function FirebaseGate() {
  const { t } = useStoredT();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => onAuthStateChanged(fbAuth(), setUser), []);

  const cloud = useMemo<CloudSession | undefined>(
    () =>
      user
        ? {
            uid: user.uid,
            email: user.email,
            getToken: () => user.getIdToken(),
            signOut: () => signOut(fbAuth()),
          }
        : undefined,
    [user],
  );

  if (user === undefined) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#faf7f0] text-sm text-black/50">
        {t("login.loading")}
      </main>
    );
  }
  if (!cloud) return <CloudLogin />;
  return <AdminApp authRequired cloud={cloud} />;
}
