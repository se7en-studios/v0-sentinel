"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { STEP_TAB, goalById, stepDone, stepsFor } from "@/lib/admin/goals";
import type { Ctx, Tab } from "./ctx";
import { Btn } from "./ui";
import { guideSeen, openGuide } from "./guide-state";

const KEY = "sentinel-admin-onboarding-dismissed";

export function Onboarding({
  ctx,
  goTab,
}: {
  ctx: Ctx;
  goTab: (t: Tab) => void;
}) {
  const [hidden, setHidden] = useState(true);
  // null: follow the default below; a click pins it open or closed
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      setHidden(localStorage.getItem(KEY) === "1");
    } catch {
      setHidden(false);
    }
  }, []);

  const steps = stepsFor(goalById(ctx.ws.settings.goal)).map((id) => ({
    done: stepDone(id, ctx.ws),
    label: ctx.t(`onb.${id}`),
    go: () => goTab(STEP_TAB[id]),
  }));
  const doneCount = steps.filter((s) => s.done).length;
  if (hidden || steps.length === 0 || doneCount === steps.length) return null;
  // one line once the person is on their way; open while nothing is set up, so the sample-data button shows
  const expanded = open ?? (doneCount === 0 || ctx.ws.features.length === 0);
  const pct = `${(doneCount / steps.length) * 100}%`;

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
      className={cn(
        "rounded-xl border border-primary/25 bg-primary/[0.06]",
        expanded ? "p-3.5" : "px-3.5 py-1.5",
      )}
      aria-label={ctx.t("onb.aria")}
    >
      <div className={cn("flex items-center gap-2", expanded && "mb-2")}>
        <h3 className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setOpen(!expanded)}
            aria-expanded={expanded}
            className="flex w-full items-center gap-2.5 rounded py-1 text-left text-[12.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="truncate">
              {ctx.t("onb.title", { done: doneCount, total: steps.length })}
            </span>
            {!expanded && (
              <span
                className="h-1 w-12 shrink-0 overflow-hidden rounded-full bg-foreground/10"
                aria-hidden
              >
                <span
                  className="block h-full bg-primary"
                  style={{ width: pct }}
                />
              </span>
            )}
            <ChevronDown
              className={cn(
                "ml-auto size-3.5 shrink-0 opacity-60 transition-transform",
                expanded && "rotate-180",
              )}
              aria-hidden
            />
          </button>
        </h3>
        <button
          type="button"
          onClick={dismiss}
          aria-label={ctx.t("onb.hide")}
          className="grid size-8 place-items-center rounded text-foreground/45 hover:bg-foreground/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-6"
        >
          <X className="size-3.5" />
        </button>
      </div>
      {expanded && (
        <>
          <div className="mb-2.5 h-1 overflow-hidden rounded-full bg-foreground/10">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: pct }}
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
                  <span
                    className={cn(s.done && "text-foreground/45 line-through")}
                  >
                    {s.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={openGuide}
            className={cn(
              "mt-2 rounded px-1 py-1.5 text-[12.5px] font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              guideSeen() ? "text-foreground/70" : "text-primary",
            )}
          >
            {ctx.t("guide.link")}
          </button>
          {ctx.ws.features.length === 0 && (
            <Btn className="mt-2.5 w-full" onClick={ctx.loadDemo}>
              {ctx.t("onb.demo")}
            </Btn>
          )}
        </>
      )}
    </section>
  );
}
