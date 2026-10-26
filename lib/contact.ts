import { z } from "zod";

// ponytail: mail visible hoy en el footer; el equipo decide si cambia.
export const CONTACT_FALLBACK_EMAIL = "sentinelproyecto@gmail.com";

export const INTEREST_OPTIONS = [
  { value: "municipio", label: "Municipio / gobierno" },
  { value: "brigada", label: "Brigada / bomberos" },
  { value: "forestal", label: "Propietario forestal / agro" },
  { value: "otro", label: "Otro" },
] as const;

export const MAX_BODY_BYTES = 8_000;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Ingresá tu nombre.").max(100, "Máximo 100 caracteres."),
  email: z.string().trim().max(200, "Máximo 200 caracteres.").pipe(z.email("Ingresá un email válido.")),
  organization: z.string().trim().max(120, "Máximo 120 caracteres.").optional().default(""),
  interest: z
    .enum(["municipio", "brigada", "forestal", "otro"])
    .optional()
    .or(z.literal("").transform(() => undefined)),
  message: z
    .string()
    .trim()
    .min(10, "Contanos un poco más (mínimo 10 caracteres).")
    .max(2000, "Máximo 2000 caracteres."),
  // honeypot: humans never see/fill it
  website: z.string().max(200).optional().default(""),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type ContactErrors = Partial<Record<keyof ContactInput, string>>;

export function validateContact(
  raw: unknown,
): { ok: true; data: ContactInput } | { ok: false; errors: ContactErrors } {
  const r = contactSchema.safeParse(raw);
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
