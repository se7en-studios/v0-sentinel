"use client";

import { Activity } from "lucide-react";
import type { ActivityKind } from "@/lib/admin/activity";
import { NUM_LOCALE } from "@/lib/admin/i18n-shell";
import type { MsgKey } from "@/lib/admin/i18n";
import type { Ctx } from "./ctx";
import { useActivity } from "./hooks/use-activity";
import { Badge, Card } from "./ui";

const KIND_KEY: Record<ActivityKind, MsgKey> = {
  zone: "act.k.zone",
  rule: "act.k.rule",
  early: "act.k.early",
  sensor: "act.k.sensor",
};

const clock = (at: number, loc: string) =>
  new Date(at).toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" });

/** Notices the panel raised this session; a toast is gone in seconds, this is not. */
export function ActivityCard({ ctx }: { ctx: Ctx }) {
  const { t } = ctx;
  const loc = NUM_LOCALE[ctx.ws.settings.locale];
  const list = useActivity();
  return (
    <Card bare title={t("act.title")} right={<Badge>{list.length}</Badge>}>
      {list.length === 0 ? (
        <p className="text-[12px] leading-snug text-foreground/60">
          {t("act.empty")}
        </p>
      ) : (
        <ol className="space-y-1.5" aria-label={t("act.aria")}>
          {list.map((a) => (
            <li key={a.id} className="rounded-lg border border-[var(--hairline)] p-2 text-[12px]">
              <div className="flex items-center justify-between gap-2 text-[10.5px] text-foreground/55">
                <span className="inline-flex items-center gap-1">
                  <Activity className="size-3" aria-hidden /> {t(KIND_KEY[a.kind])}
                </span>
                <span className="num" title={new Date(a.t).toLocaleString(loc)}>
                  {clock(a.t, loc)}
                </span>
              </div>
              <div className="mt-0.5 font-semibold">{a.title}</div>
              <div className="text-foreground/65">{a.detail}</div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
