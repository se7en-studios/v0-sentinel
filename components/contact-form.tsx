"use client";

import { useState, type FormEvent } from "react";
import {
  CONTACT_FALLBACK_EMAIL,
  INTEREST_OPTIONS,
  validateContact,
  type ContactErrors,
} from "@/lib/contact";

type Status = "idle" | "sending" | "ok" | "error" | "unavailable";

const field =
  "w-full rounded-sm border border-[rgba(240,234,216,0.2)] bg-[rgba(240,234,216,0.05)] px-3 py-2.5 text-[14px] text-[#f0ead8] placeholder:text-[rgba(240,234,216,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94f1be] aria-[invalid=true]:border-[#ff9b8a]";
const label = "block text-[12px] mb-1.5 text-[rgba(240,234,216,0.75)]";

function FieldError({ id, msg }: { id: string; msg?: string }) {
  return msg ? (
    <p id={id} className="mt-1 text-[12px] text-[#ffb4a6]">
      {msg}
    </p>
  ) : null;
}

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<ContactErrors>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const form = e.currentTarget;
    const raw = Object.fromEntries(new FormData(form).entries());
    const v = validateContact(raw);
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

  const mailto = `mailto:${CONTACT_FALLBACK_EMAIL}`;

  return (
    <section id="contacto" aria-labelledby="contacto-title" className="scroll-mt-24">
      <h2
        id="contacto-title"
        className="text-3xl sm:text-4xl mb-3"
        style={{ fontFamily: "var(--font-heading)", fontWeight: 800, color: "#f0ead8" }}
      >
        Hablemos
      </h2>
      <p className="text-[14px] mb-8 max-w-xl text-[rgba(240,234,216,0.7)]" style={{ fontFamily: "var(--font-sans)" }}>
        Contanos qué territorio cuidás y te respondemos para coordinar una reunión.
      </p>

      {status === "ok" ? (
        <p role="status" className="rounded-sm border border-[rgba(148,241,190,0.4)] p-4 text-[14px] text-[#94f1be]">
          ¡Gracias! Recibimos tu mensaje y te escribimos a la brevedad.
        </p>
      ) : (
        <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2 max-w-3xl" style={{ fontFamily: "var(--font-sans)" }}>
          {/* honeypot */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>
              No completar
              <input type="text" name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          <div>
            <label htmlFor="c-name" className={label}>Nombre *</label>
            <input id="c-name" name="name" autoComplete="name" required className={field}
              aria-invalid={!!errors.name} aria-describedby={errors.name ? "c-name-err" : undefined} />
            <FieldError id="c-name-err" msg={errors.name} />
          </div>
          <div>
            <label htmlFor="c-email" className={label}>Email *</label>
            <input id="c-email" name="email" type="email" autoComplete="email" required className={field}
              aria-invalid={!!errors.email} aria-describedby={errors.email ? "c-email-err" : undefined} />
            <FieldError id="c-email-err" msg={errors.email} />
          </div>
          <div>
            <label htmlFor="c-org" className={label}>Organización</label>
            <input id="c-org" name="organization" autoComplete="organization" className={field}
              aria-invalid={!!errors.organization} aria-describedby={errors.organization ? "c-org-err" : undefined} />
            <FieldError id="c-org-err" msg={errors.organization} />
          </div>
          <div>
            <label htmlFor="c-interest" className={label}>Soy (opcional)</label>
            <select id="c-interest" name="interest" defaultValue="" className={field}>
              <option value="">Seleccionar</option>
              {INTEREST_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="text-black">{o.label}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="c-msg" className={label}>Mensaje *</label>
            <textarea id="c-msg" name="message" rows={5} required maxLength={2000} className={field}
              aria-invalid={!!errors.message} aria-describedby={errors.message ? "c-msg-err" : undefined} />
            <FieldError id="c-msg-err" msg={errors.message} />
          </div>

          <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={status === "sending"}
              className="inline-flex items-center rounded-sm bg-[#0f7a4f] px-8 py-3.5 text-[13px] font-medium text-[#faf7f0] transition hover:bg-[#0c6941] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94f1be] disabled:opacity-60"
            >
              {status === "sending" ? "Enviando…" : "Enviar mensaje"}
            </button>
            <p className="text-[12px] text-[rgba(240,234,216,0.55)]">
              Al enviar aceptás nuestra <a href="/privacidad" className="underline">política de privacidad</a>.
            </p>
          </div>

          <div className="sm:col-span-2" aria-live="polite">
            {status === "error" && (
              <p role="alert" className="text-[13px] text-[#ffb4a6]">
                No pudimos enviar tu mensaje. Probá de nuevo o escribinos a{" "}
                <a className="underline" href={mailto}>{CONTACT_FALLBACK_EMAIL}</a>.
              </p>
            )}
            {status === "unavailable" && (
              <p role="alert" className="text-[13px] text-[#ffd9a0]">
                El envío en línea no está disponible por ahora: escribinos a{" "}
                <a className="underline" href={mailto}>{CONTACT_FALLBACK_EMAIL}</a>.
              </p>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
