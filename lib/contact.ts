import { z } from "zod";
import type { Lang } from "@/lib/i18n";

// ponytail: mail visible hoy en el footer; el equipo decide si cambia.
export const CONTACT_FALLBACK_EMAIL = "sentinelproyecto@gmail.com";

export const INTEREST_OPTIONS = [
  { value: "municipio", label: "Municipio / gobierno" },
  { value: "brigada", label: "Brigada / bomberos" },
  { value: "forestal", label: "Propietario forestal / agro" },
  { value: "otro", label: "Otro" },
] as const;

export const MAX_BODY_BYTES = 8_000;

const MSG = {
  es: {
    name: "Ingresá tu nombre.",
    max100: "Máximo 100 caracteres.",
    max200: "Máximo 200 caracteres.",
    email: "Ingresá un email válido.",
    max120: "Máximo 120 caracteres.",
    messageMin: "Contanos un poco más (mínimo 10 caracteres).",
    max2000: "Máximo 2000 caracteres.",
  },
  en: {
    name: "Enter your name.",
    max100: "Maximum 100 characters.",
    max200: "Maximum 200 characters.",
    email: "Enter a valid email.",
    max120: "Maximum 120 characters.",
    messageMin: "Tell us a bit more (minimum 10 characters).",
    max2000: "Maximum 2000 characters.",
  },
} as const;

export const INTEREST_OPTIONS_EN = [
  { value: "municipio", label: "Municipality / government" },
  { value: "brigada", label: "Fire brigade / firefighters" },
  { value: "forestal", label: "Forestry / farm owner" },
  { value: "otro", label: "Other" },
] as const;

/** Idioma del visitante: solo "en" cambia algo; cualquier otro valor es "es". */
export const parseLang = (v: unknown): Lang => (v === "en" ? "en" : "es");

export const createContactSchema = (lang: Lang = "es") => {
  const m = MSG[lang];
  return z.object({
    name: z.string().trim().min(2, m.name).max(100, m.max100),
    email: z.string().trim().max(200, m.max200).pipe(z.email(m.email)),
    organization: z.string().trim().max(120, m.max120).optional().default(""),
    interest: z
      .enum(["municipio", "brigada", "forestal", "otro"])
      .optional()
      .or(z.literal("").transform(() => undefined)),
    message: z.string().trim().min(10, m.messageMin).max(2000, m.max2000),
    // honeypot: humans never see/fill it
    website: z.string().max(200).optional().default(""),
  });
};

export const contactSchema = createContactSchema("es");

export type ContactInput = z.infer<typeof contactSchema>;
export type ContactErrors = Partial<Record<keyof ContactInput, string>>;

export function validateContact(
  raw: unknown,
  lang: Lang = "es",
): { ok: true; data: ContactInput } | { ok: false; errors: ContactErrors } {
  const r = createContactSchema(lang).safeParse(raw);
  if (r.success) return { ok: true, data: r.data };
  const errors: ContactErrors = {};
  for (const issue of r.error.issues) {
    const key = issue.path[0] as keyof ContactInput | undefined;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}

/** Link de WhatsApp si hay número configurado (solo dígitos), si no null. */
export function whatsappUrl(number: string | undefined, text: string): string | null {
  const digits = (number ?? "").replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
