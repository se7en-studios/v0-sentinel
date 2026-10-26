import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_FALLBACK_EMAIL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Política de privacidad | Sentinel",
  description: "Qué datos recoge el formulario de contacto de Sentinel y para qué se usan.",
  robots: { index: false },
};

export default function PrivacidadPage() {
  return (
    <main id="main-content" className="mx-auto max-w-2xl px-6 py-28 text-[15px] leading-relaxed" style={{ color: "#1a1812", background: "#faf7f0", fontFamily: "var(--font-sans)" }}>
      <p className="mb-6 rounded-sm border border-amber-600 bg-amber-50 p-3 text-[13px] text-amber-900">
        Borrador pendiente de revisión por el equipo de Sentinel. No constituye aún un texto legal definitivo.
      </p>
      <h1 className="mb-6 text-4xl" style={{ fontFamily: "var(--font-heading)", fontWeight: 800 }}>
        Política de privacidad
      </h1>
      <h2 className="mt-8 mb-2 text-xl font-semibold">Qué datos recogemos</h2>
      <p>
        Solo los que completás en el formulario de contacto: nombre, email, organización (opcional), tipo de interés
        (opcional) y el mensaje. Además, por seguridad, tu dirección IP se usa de forma temporal en memoria para limitar
        envíos repetidos; no la almacenamos.
      </p>
      <h2 className="mt-8 mb-2 text-xl font-semibold">Para qué los usamos</h2>
      <p>
        Únicamente para responder tu consulta y coordinar una reunión. No vendemos ni cedemos tus datos. El mensaje se
        envía por correo a través del proveedor Resend, que actúa como encargado del envío.
      </p>
      <h2 className="mt-8 mb-2 text-xl font-semibold">Conservación y tus derechos</h2>
      <p>
        Conservamos tu consulta mientras dure la conversación comercial. Podés pedir acceso, rectificación o supresión de
        tus datos escribiendo a{" "}
        <a className="underline" href={`mailto:${CONTACT_FALLBACK_EMAIL}`}>{CONTACT_FALLBACK_EMAIL}</a>. En Argentina,
        la Agencia de Acceso a la Información Pública es el órgano de control de la Ley 25.326.
      </p>
      <h2 className="mt-8 mb-2 text-xl font-semibold">Contacto</h2>
      <p>
        <a className="underline" href={`mailto:${CONTACT_FALLBACK_EMAIL}`}>{CONTACT_FALLBACK_EMAIL}</a>
      </p>
      <p className="mt-10"><Link className="underline" href="/">Volver al inicio</Link></p>
    </main>
  );
}
