import type { FormEventHandler, ReactNode } from "react";
import { SentinelLogo, SentinelMark } from "@/components/sentinel-logo";
import type { Translate } from "@/lib/admin/i18n";

/** Shared frame for both login screens: soft brand glow, faint grid, one card. */
export function LoginShell({
  subtitle,
  onSubmit,
  children,
  t,
}: {
  t: Translate;
  subtitle: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
}) {
  return (
    <main
      className="relative grid min-h-dvh place-items-center overflow-hidden bg-[#faf7f0] px-4"
      style={{
        backgroundImage:
          "radial-gradient(60rem 36rem at 12% -10%, rgba(15,122,79,0.13), transparent 60%), radial-gradient(48rem 30rem at 100% 110%, rgba(229,83,45,0.12), transparent 60%), radial-gradient(rgba(0,0,0,0.07) 1px, transparent 1px)",
        backgroundSize: "auto, auto, 22px 22px",
      }}
    >
      <div className="view-in w-full max-w-sm">
        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-black/8 bg-white/90 p-7 shadow-xl shadow-black/5 backdrop-blur"
        >
          <div className="mb-3 flex items-center gap-2">
            <SentinelMark className="size-7" />
            <SentinelLogo className="h-6 w-auto" fill="var(--primary)" />
          </div>
          <h1 className="font-heading text-2xl font-bold leading-tight">
            {t("login.title")}
          </h1>
          <p className="mb-5 mt-1 text-[13px] text-foreground/60">{subtitle}</p>
          {children}
        </form>
        <p className="mt-4 flex items-center justify-center gap-2 text-[11.5px] text-foreground/55">
          <span className="size-1.5 rounded-full bg-primary" aria-hidden />
          {t("login.footer")}
        </p>
      </div>
    </main>
  );
}
