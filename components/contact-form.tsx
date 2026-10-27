"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  CONTACT_FALLBACK_EMAIL,
  INTEREST_OPTIONS,
  validateContact,
  type ContactErrors,
} from "@/lib/contact";

type Status = "idle" | "sending" | "ok" | "error" | "unavailable";

// ?perfil= usa el vocabulario de la landing ("campo"); el esquema usa "forestal".
const PERFIL_TO_INTEREST: Record<string, string> = {
  municipio: "municipio",
  brigada: "brigada",
  campo: "forestal",
};

const field =
  "h-12 w-full rounded-xl border border-a-line bg-a-bg px-4 text-base text-[#e3f6dc] placeholder:text-a-faint focus-visible:border-a-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-a-accent aria-[invalid=true]:border-[#ff9b8a]";
const label = "mb-1.5 block text-sm font-medium text-[#e3f6dc]";

function FieldError({ id, msg }: { id: string; msg?: string }) {
  return msg ? (
    <p id={id} className="mt-1.5 text-sm text-[#ffb4a6]">
      {msg}
    </p>
  ) : null;
}

export function ContactForm() {
  const params = useSearchParams();
  const defaultInterest = PERFIL_TO_INTEREST[params.get("perfil") ?? ""] ?? "";
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<ContactErrors>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const form = e.currentTarget;
    const v = validateContact(Object.fromEntries(new FormData(form).entries()));
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
        body: JSON.stringify(v.data),
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
        <p className="text-xl font-semibold text-a-accent">Recibimos tu mensaje.</p>
        <p className="mt-2 text-a-mute">
          Te respondemos en 24 h hábiles. Si es urgente, escribinos a {mail}.
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
          No completar
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <label htmlFor="c-name" className={label}>
          Nombre
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
          Email
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
          Organización{" "}
          <span className="font-normal opacity-70">(opcional)</span>
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
          Soy…
        </label>
        <select
          id="c-interest"
          name="interest"
          defaultValue={defaultInterest}
          className={field}
        >
          <option value="" className="text-black">
            Elegí una opción
          </option>
          {INTEREST_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="text-black">
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="c-msg" className={label}>
          Mensaje
        </label>
        <textarea
          id="c-msg"
          name="message"
          rows={4}
          required
          maxLength={2000}
          className={`${field} !h-auto py-3`}
          placeholder="¿Qué territorio cuidás y qué necesitás?"
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
          {status === "sending" ? "Enviando…" : "Solicitar un piloto"}
        </button>
        <p className="text-sm text-a-mute">
          Te respondemos en 24 h hábiles.
        </p>
      </div>
      <p className="text-sm text-a-mute sm:col-span-2">
        Al enviar aceptás nuestra{" "}
        <a href="/privacidad" className="underline underline-offset-2">
          política de privacidad
        </a>
        .
      </p>

      <div className="sm:col-span-2" aria-live="polite">
        {status === "error" && (
          <p role="alert" className="text-sm text-[#ffb4a6]">
            No pudimos enviar tu mensaje. Probá de nuevo o escribinos a {mail}.
          </p>
        )}
        {status === "unavailable" && (
          <p role="alert" className="text-sm text-[#ffd9a0]">
            El envío en línea no está disponible por ahora: escribinos a {mail}.
          </p>
        )}
      </div>
    </form>
  );
}
