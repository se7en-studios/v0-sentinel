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
  "min-h-11 w-full rounded-none border-0 border-b border-ink/50 bg-transparent px-0 py-2 text-base text-ink transition placeholder:text-ink/55 hover:border-ink focus-visible:border-brand focus-visible:outline-none focus-visible:ring-0 aria-[invalid=true]:border-signal";
const label = "t-small mb-1 block font-semibold text-ink";

function FieldError({ id, msg }: { id: string; msg?: string }) {
  return msg ? (
    <p id={id} className="t-small mt-1.5 text-signal">
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
      <div role="status" className="border-t rule pt-6">
        <p className="t-h3 text-brand">Recibimos tu mensaje.</p>
        <p className="t-body mt-2 text-ink/85">
          Te respondemos en 24 h hábiles. Si es urgente, escribinos a {mail}.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="relative grid gap-x-6 gap-y-6 sm:grid-cols-2"
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
          <option value="">
            Elegí una opción
          </option>
          {INTEREST_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
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
          className={field}
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
          className="inline-flex min-h-12 items-center rounded-sm bg-brand px-8 text-base font-semibold text-paper transition hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60"
        >
          {status === "sending" ? "Enviando…" : "Solicitar un piloto"}
        </button>
        <p className="t-small text-ink/75">
          Te respondemos en 24 h hábiles.
        </p>
      </div>
      <p className="t-small sm:col-span-2 text-ink/70">
        Al enviar aceptás nuestra{" "}
        <a href="/privacidad" className="underline underline-offset-2">
          política de privacidad
        </a>
        .
      </p>

      <div className="sm:col-span-2" aria-live="polite">
        {status === "error" && (
          <p role="alert" className="t-small text-signal">
            No pudimos enviar tu mensaje. Probá de nuevo o escribinos a {mail}.
          </p>
        )}
        {status === "unavailable" && (
          <p role="alert" className="t-small text-signal">
            El envío en línea no está disponible por ahora: escribinos a {mail}.
          </p>
        )}
      </div>
    </form>
  );
}
