import { AdminApp } from "@/components/admin/admin-app";
import { LoginForm } from "@/components/admin/login-form";
import { authConfigured, authRequired, isAuthed } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!authConfigured() && !(await isAuthed())) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#faf7f0] px-6 text-center text-[#1a1812]">
        <div className="max-w-md">
          <h1 className="font-heading text-xl font-bold">Panel bloqueado</h1>
          <p className="mt-2 text-[14px] text-[#1a1812]/65">
            Falta configurar{" "}
            <code className="rounded bg-black/5 px-1">ADMIN_PASSWORD</code> en
            el servidor. Cargala en las variables de entorno de Vercel y volvé a
            desplegar.
          </p>
        </div>
      </main>
    );
  }
  if (!(await isAuthed())) return <LoginForm />;
  return <AdminApp authRequired={authRequired()} />;
}
