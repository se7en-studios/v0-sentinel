"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  CONTACT_FALLBACK_EMAIL,
  INTEREST_OPTIONS,
  INTEREST_OPTIONS_EN,
  validateContact,
  type ContactErrors,
} from "@/lib/contact";
import { useCopy, useLang } from "@/lib/i18n/client";
import type { Copy } from "@/lib/i18n";

type Status = "idle" | "sending" | "ok" | "error" | "unavailable";

// ?perfil= usa el vocabulario de la landing ("campo"); el esquema usa "forestal".
const PERFIL_TO_INTEREST: Record<string, string> = {
  municipio: "municipio",
  brigada: "brigada",
  campo: "forestal",
};

const COPY: Copy<{
  okTitle: string;
  okBody: string;
  honeypot: string;
  name: string;
  email: string;
  org: string;
  optional: string;
  iam: string;
  choose: string;
  message: string;
  placeholder: string;
  sending: string;
  submit: string;
  reply: string;
  privacyPre: string;
  privacyLink: string;
  errorPre: string;
  unavailablePre: string;
}> = {
  es: {
    okTitle: "Recibimos tu mensaje.",
    okBody: "Te respondemos en 24 h hábiles. Si es urgente, escribinos a",
    honeypot: "No completar",
    name: "Nombre",
    email: "Email",
    org: "Organización",
    optional: "(opcional)",
    iam: "Soy…",
    choose: "Elegí una opción",
    message: "Mensaje",
    placeholder: "¿Qué territorio cuidás y qué necesitás?",
    sending: "Enviando…",
    submit: "Solicitar un piloto",
    reply: "Te respondemos en 24 h hábiles.",
    privacyPre: "Al enviar aceptás nuestra",
    privacyLink: "política de privacidad",
    errorPre: "No pudimos enviar tu mensaje. Probá de nuevo o escribinos a",
    unavailablePre: "El envío en línea no está disponible por ahora: escribinos a",
  },
  en: {
    okTitle: "We got your message.",
    okBody: "We reply within 24 business hours. If it's urgent, write to us at",
    honeypot: "Do not fill in",
    name: "Name",
    email: "Email",
    org: "Organization",
    optional: "(optional)",
    iam: "I am…",
    choose: "Choose an option",
    message: "Message",
    placeholder: "Which territory do you look after and what do you need?",
    sending: "Sending…",
    submit: "Request a pilot",
    reply: "We reply within 24 business hours.",
    privacyPre: "By submitting you accept our",
    privacyLink: "privacy policy",
    errorPre: "We couldn't send your message. Try again or write to us at",
    unavailablePre: "Online sending is not available right now: write to us at",
  },
};

const field =
  "h-12 w-full rounded-xl border border-a-line bg-a-bg px-4 text-base text-[#e3f6dc] placeholder:text-a-faint focus-visible:border-a-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-a-accent aria-[invalid=true]:border-[#ff9b8a]";
const label = "mb-1.5 block text-[0.9375rem] font-medium text-[#e3f6dc]";

function FieldError({ id, msg }: { id: string; msg?: string }) {
  return msg ? (
    <p id={id} className="mt-1.5 text-[0.9375rem] text-[#ffb4a6]">
      {msg}
    </p>
  ) : null;
}

export function ContactForm() {
  const params = useSearchParams();
  const lang = useLang();
  const c = useCopy(COPY);
  const interestOptions = lang === "en" ? INTEREST_OPTIONS_EN : INTEREST_OPTIONS;
  const defaultInterest = PERFIL_TO_INTEREST[params.get("perfil") ?? ""] ?? "";
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<ContactErrors>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const form = e.currentTarget;
    const v = validateContact(Object.fromEntries(new FormData(form).entries()), lang);
    if (!v.ok) {
      setErrors(v.errors);
      return;
    }
    setErrors({});
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v.data, lang }),
      });
      if (res.ok) {
        form.reset();
        setStatus("ok");
      } else if (res.status === 503) {
        setStatus("unavailable");
      } else if (res.status === 422) {
        const body = await res.json().catch(() => ({}));
        setErrors(body.errors ?? {});
        setStatus("idle");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const mail = (
    <a
      className="underline underline-offset-2"
      href={`mailto:${CONTACT_FALLBACK_EMAIL}`}
    >
      {CONTACT_FALLBACK_EMAIL}
    </a>
  );

  if (status === "ok") {
    return (
      <div
        role="status"
        className="a-card !border-a-accent/40 p-6 md:p-8"
      >
        <p className="text-xl font-semibold text-a-accent">{c.okTitle}</p>
        <p className="mt-2 text-a-mute">
          {c.okBody} {mail}.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="a-card grid gap-5 p-6 text-left md:p-8 sm:grid-cols-2"
    >
      {/* honeypot */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
      >
        <label>
          {c.honeypot}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <label htmlFor="c-name" className={label}>
          {c.name}
        </label>
        <input
          id="c-name"
          name="name"
          autoComplete="name"
          required
          className={field}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "c-name-err" : undefined}
        />
        <FieldError id="c-name-err" msg={errors.name} />
      </div>
      <div>
        <label htmlFor="c-email" className={label}>
          {c.email}
        </label>
        <input
          id="c-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={field}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "c-email-err" : undefined}
        />
        <FieldError id="c-email-err" msg={errors.email} />
      </div>
      <div>
        <label htmlFor="c-org" className={label}>
          {c.org}{" "}
          <span className="font-normal opacity-70">{c.optional}</span>
        </label>
        <input
          id="c-org"
          name="organization"
          autoComplete="organization"
          className={field}
          aria-invalid={!!errors.organization}
          aria-describedby={errors.organization ? "c-org-err" : undefined}
        />
        <FieldError id="c-org-err" msg={errors.organization} />
      </div>
      <div>
        <label htmlFor="c-interest" className={label}>
          {c.iam}
        </label>
        <select
          id="c-interest"
          name="interest"
          defaultValue={defaultInterest}
          className={field}
        >
          <option value="" className="text-black">
            {c.choose}
          </option>
          {interestOptions.map((o) => (
            <option key={o.value} value={o.value} className="text-black">
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="c-msg" className={label}>
          {c.message}
        </label>
        <textarea
          id="c-msg"
          name="message"
          rows={4}
          required
          maxLength={2000}
          className={`${field} !h-auto py-3`}
          placeholder={c.placeholder}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "c-msg-err" : undefined}
        />
        <FieldError id="c-msg-err" msg={errors.message} />
      </div>

      <div className="sm:col-span-2 flex flex-wrap items-center gap-x-5 gap-y-3">
        <button
          type="submit"
          disabled={status === "sending"}
          className="a-pill !h-12 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-a-accent disabled:opacity-60"
        >
          {status === "sending" ? c.sending : c.submit}
        </button>
        <p className="text-[0.9375rem] text-a-mute">
          {c.reply}
        </p>
      </div>
      <p className="text-[0.9375rem] text-a-mute sm:col-span-2">
        {c.privacyPre}{" "}
        <a href="/privacidad" className="underline underline-offset-2">
          {c.privacyLink}
        </a>
        .
      </p>

      <div className="sm:col-span-2" aria-live="polite">
        {status === "error" && (
          <p role="alert" className="text-[0.9375rem] text-[#ffb4a6]">
            {c.errorPre} {mail}.
          </p>
        )}
        {status === "unavailable" && (
          <p role="alert" className="text-[0.9375rem] text-[#ffd9a0]">
            {c.unavailablePre} {mail}.
          </p>
        )}
      </div>
    </form>
  );
}
