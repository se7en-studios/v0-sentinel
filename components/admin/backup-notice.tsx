"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import type { Ctx } from "./ctx";

/** Dismissible explanation shown while the fires come from the INPE backup instead of NASA FIRMS. */
export function BackupNotice({ ctx }: { ctx: Ctx }) {
  const [dismissed, setDismissed] = useState(false);
  if (ctx.payload?.fallback !== "INPE" || dismissed) return null;
  return (
    <div
      role="status"
      className="flex shrink-0 items-start gap-2 border-b border-[var(--hairline)] bg-foreground/[0.04] px-3 py-1.5 text-[12px] text-foreground/75"
    >
      <Info className="mt-0.5 size-3.5 shrink-0 text-foreground/50" aria-hidden />
      <p className="min-w-0 flex-1">
        <b className="font-semibold">{ctx.t("backup.title")}.</b>{" "}
        {ctx.t("backup.body")}
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded-md px-2 py-0.5 font-medium text-foreground/70 hover:bg-foreground/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {ctx.t("backup.dismiss")}
      </button>
    </div>
  );
}
