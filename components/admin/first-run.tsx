"use client";

import { useEffect, useRef, useState } from "react";
import {
  Building2,
  Check,
  MapPin,
  Tractor,
  TreePine,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  GOALS,
  essentialTabsText,
  goalById,
  goalLayers,
  goalSettings,
  hiddenLayersText,
  rulesToAdd,
  type GoalId,
} from "@/lib/admin/goals";
import { NUM_LOCALE } from "@/lib/admin/i18n-shell";
import { REGIONS } from "@/lib/admin/types";
import { Btn } from "./ui";
import type { useAdmin } from "./use-admin";

type A = ReturnType<typeof useAdmin>;

const ICONS: Record<GoalId, LucideIcon> = {
  lot: MapPin,
  forestry: TreePine,
  farms: Tractor,
  towns: Building2,
  invest: TrendingUp,
};

const OPTION =
  "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-md:min-h-14";

/** The one question a new person gets: what do you want to watch. It sets up the region, layers, alerts and starting tab. */
export function FirstRun({ a }: { a: A }) {
  const { ctx } = a;
  const { t } = ctx;
  const s = a.s;
  const [step, setStep] = useState<0 | 1>(0);
  const [goalId, setGoalId] = useState<GoalId | null>(null);
  const [regionId, setRegionId] = useState(s.regionId);
  const goal = goalById(goalId);
  const locale = NUM_LOCALE[s.locale];
  const content = useRef<HTMLDivElement>(null);
  // focus lands on the dialog itself (announcing its title), never on the first card, which would look already chosen
  useEffect(() => content.current?.focus(), [step]);

  // not before the saved workspace is read, or a returning person would see the question flash
  const open = a.mounted && a.ready && !s.onboarded;
  const skip = () => ctx.setSettings({ onboarded: true });
  const build = () => {
    if (!goal) return;
    ctx.setSettings(goalSettings(goal, regionId, s));
    a.setShow((prev) => goalLayers(goal, prev));
    ctx.goTab(goal.startTab);
    toast.success(t("goal.done", { goal: t(`goal.${goal.id}`) }));
  };

  const rules = goal ? rulesToAdd(goal, s.rules) : 0;
  const plan = goal
    ? [
        t("goal.plan.region", {
          region: REGIONS.find((r) => r.id === regionId)?.name ?? "",
        }),
        t("goal.plan.tabs", { tabs: essentialTabsText(t, locale) }),
        t("goal.plan.layers", { layers: hiddenLayersText(goal, t, locale) }),
        rules === 0
          ? t("goal.plan.noRules")
          : rules === 1
            ? t("goal.plan.rules.one")
            : t("goal.plan.rules", { n: rules }),
        t("goal.plan.start", { tab: t(`tab.${goal.startTab}`) }),
      ]
    : [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && skip()}>
      <DialogContent
        ref={content}
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          content.current?.focus();
        }}
        // the dialog is portaled outside .admin-root, so it brings its own text colour (dark theme)
        className="max-h-[92dvh] gap-4 overflow-y-auto p-5 text-foreground outline-none sm:max-w-xl sm:p-6"
      >
        <p className="text-[11.5px] font-medium text-foreground/70">
          {t("goal.step", { n: step + 1, total: 2 })}
        </p>
        {step === 0 ? (
          <>
            <div>
              <DialogTitle className="font-heading text-xl">
                {t("goal.title")}
              </DialogTitle>
              <DialogDescription className="mt-1 text-[13px]">
                {t("goal.lead")}
              </DialogDescription>
            </div>
            <div
              role="group"
              aria-label={t("goal.group")}
              className="grid gap-2"
            >
              {GOALS.map((g) => {
                const Icon = ICONS[g.id];
                const on = goalId === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setGoalId(g.id)}
                    className={cn(
                      OPTION,
                      on
                        ? "border-primary bg-primary/10"
                        : "border-[var(--hairline)] bg-card hover:bg-foreground/[0.04]",
                    )}
                  >
                    <Icon
                      className="mt-0.5 size-5 shrink-0 text-primary"
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span className="block text-[14px] font-semibold">
                        {t(`goal.${g.id}`)}
                      </span>
                      <span className="mt-0.5 block text-[12.5px] leading-snug text-foreground/65">
                        {t(`goal.${g.id}.d`)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div>
              <DialogTitle className="font-heading text-xl">
                {t("goal.region.title")}
              </DialogTitle>
              <DialogDescription className="mt-1 text-[13px]">
                {t("goal.region.lead")}
              </DialogDescription>
            </div>
            <div
              role="group"
              aria-label={t("goal.region.group")}
              className="grid gap-1.5 sm:grid-cols-2"
            >
              {REGIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={regionId === r.id}
                  onClick={() => setRegionId(r.id)}
                  className={cn(
                    OPTION,
                    "items-center py-2 text-[13px] max-md:min-h-11",
                    regionId === r.id
                      ? "border-primary bg-primary/10 font-semibold"
                      : "border-[var(--hairline)] bg-card hover:bg-foreground/[0.04]",
                  )}
                >
                  {r.name}
                </button>
              ))}
            </div>
            <section
              aria-label={t("goal.plan.title")}
              className="rounded-xl bg-foreground/[0.04] p-3"
            >
              <h3 className="mb-1.5 text-[12.5px] font-semibold">
                {t("goal.plan.title")}
              </h3>
              <ul className="space-y-1">
                {plan.map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-2 text-[12.5px] leading-snug"
                  >
                    <Check
                      className="mt-0.5 size-3.5 shrink-0 text-primary"
                      aria-hidden
                    />
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
        <div className="sticky bottom-0 -mx-5 -mb-5 flex flex-col-reverse gap-2 border-t border-[var(--hairline)] bg-background px-5 pb-4 pt-3 sm:-mx-6 sm:-mb-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pb-5">
          <button
            type="button"
            onClick={skip}
            className="self-start rounded-lg px-1 py-2 text-[12.5px] text-foreground/70 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t("goal.skip")}
          </button>
          <div className="flex gap-2">
            {step === 1 && (
              <Btn
                className="max-md:min-h-11 max-md:flex-1"
                onClick={() => setStep(0)}
              >
                {t("goal.back")}
              </Btn>
            )}
            {step === 0 ? (
              <Btn
                variant="solid"
                className="max-md:min-h-11 max-md:flex-1"
                disabled={!goal}
                onClick={() => setStep(1)}
              >
                {t("goal.next")}
              </Btn>
            ) : (
              <Btn
                variant="solid"
                className="max-md:min-h-11 max-md:flex-1"
                onClick={build}
              >
                {t("goal.build")}
              </Btn>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
