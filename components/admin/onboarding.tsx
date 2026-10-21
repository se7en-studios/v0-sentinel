"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MODE_ROLE } from "@/lib/admin/types";
import type { Ctx, Tab } from "./ctx";
import { Btn } from "./ui";

const KEY = "sentinel-admin-onboarding-dismissed";

export function Onboarding({
  ctx,
  goTab,
}: {
  ctx: Ctx;
  goTab: (t: Tab) => void;
}) {
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    try {
      setHidden(localStorage.getItem(KEY) === "1");
    } catch {
      setHidden(false);
    }
  }, []);

  const roles = ctx.ws.features.map(
    (f) => MODE_ROLE[String(f.properties.mode)],
  );
  const steps = [
    {
      done: roles.includes("zone"),
      label: "Marcá tu primera zona de monitoreo",
      go: () => goTab("zonas"),
    },
    {
      done: roles.includes("route"),
      label: "Armá una ruta de dron (o generala desde la zona)",
      go: () => goTab("drones"),
    },
    {
      done: roles.includes("sensor"),
      label: "Colocá un sensor",
      go: () => goTab("drones"),
    },
    {
      done: Boolean(
        ctx.ws.settings.notify.email || ctx.ws.settings.notify.whatsapp,
      ),
      label: "Cargá un contacto para alertas",
      go: () => goTab("config"),
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  if (hidden || doneCount === steps.length) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* private mode */
    }
  };

  return (
    <section
      className="rounded-xl border border-primary/25 bg-primary/[0.06] p-3.5"
      aria-label="Primeros pasos"
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[12.5px] font-semibold">
          Primeros pasos · {doneCount}/{steps.length}
        </h3>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Ocultar primeros pasos"
          className="grid size-8 place-items-center rounded text-foreground/45 hover:bg-foreground/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-6"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <div className="mb-2.5 h-1 overflow-hidden rounded-full bg-foreground/10">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>
      <ul className="space-y-1">
        {steps.map((s) => (
          <li key={s.label}>
            <button
              type="button"
              onClick={s.go}
              disabled={s.done}
              className="flex w-full items-center gap-2 rounded px-1 py-1.5 text-left text-[12.5px] hover:bg-foreground/5 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                className={cn(
                  "grid size-4 shrink-0 place-items-center rounded-full border",
                  s.done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-foreground/25",
                )}
              >
                {s.done && <Check className="size-3" />}
              </span>
              <span className={cn(s.done && "text-foreground/45 line-through")}>
                {s.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {ctx.ws.features.length === 0 && (
        <Btn className="mt-2.5 w-full" onClick={ctx.loadDemo}>
          O probá con datos de ejemplo
        </Btn>
      )}
    </section>
  );
}
