import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  contactsOf,
  decideDelivery,
  recordDelivery,
  type DeliveryResult,
} from "@/lib/admin/alert-delivery";
import { buildAlertMessage } from "@/lib/admin/alert-message";
import { loadDelivery, saveDelivery } from "@/lib/admin/delivery-store";
import { translate, type Translate } from "@/lib/admin/i18n";
import { parseNotify } from "@/lib/admin/integrations";
import { REGIONS, type AlertRule, type Settings } from "@/lib/admin/types";

interface NoticeReply {
  results?: { channel: string; status: string }[];
}

/**
 * Sends an alert rule by email / WhatsApp the moment it is met, within the person's limits. The send goes
 * through /api/admin/notify, which only writes to the addresses the server lists as allowed.
 * Returns what to call when a rule newly fires.
 */
export function useAlertDelivery(
  s: Settings,
  authedFetch: (url: string, init?: RequestInit) => Promise<Response>,
) {
  // called from effects that must not re-run when settings change: read the latest through a ref
  const latest = useRef({ s, authedFetch });
  useEffect(() => {
    latest.current = { s, authedFetch };
  });

  return useCallback(async (rule: AlertRule, detail: string): Promise<void> => {
    const { s, authedFetch } = latest.current;
    const t: Translate = (k, v) => translate(s.locale, k, v);
    const now = Date.now();
    const verdict = decideDelivery(loadDelivery(), s.notify, rule.id, now);
    if (!verdict.send) {
      // off / no contact are choices, not news; the two limits say why a message did not go out (one toast, not a stack)
      if (verdict.reason === "interval" || verdict.reason === "daily")
        toast.info(t(`dlv.skip.${verdict.reason}`), {
          id: `dlv-skip-${verdict.reason}`,
        });
      return;
    }
    const { emails, phones } = contactsOf(s.notify);
    const message = buildAlertMessage({
      kind: rule.kind,
      detail,
      org: s.org,
      region: REGIONS.find((r) => r.id === s.regionId)?.name ?? "",
      locale: s.locale,
      at: now,
      link: `${window.location.origin}/admin`,
    });
    const channels = [
      ...(emails.length ? ["email"] : []),
      ...(phones.length ? ["whatsapp"] : []),
    ];
    const name = (c: string) =>
      t(c === "whatsapp" ? "dlv.ch.whatsapp" : "dlv.ch.email");
    try {
      const res = await authedFetch("/api/admin/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...message, channels, emails, phones }),
      });
      const results = (res.ok ? parseNotify(await res.json())?.results : undefined) ?? [];
      const sent = results.filter((r) => r.status === "sent").map((r) => r.channel);
      const result: DeliveryResult = {
        at: now,
        ruleId: rule.id,
        channels: results.map(({ channel, status }) => ({ channel, status })),
      };
      if (sent.length > 0) {
        // only a message that went out counts toward the limits
        saveDelivery(recordDelivery(loadDelivery(), result));
        toast.success(t("dlv.sent", { channels: sent.map(name).join(" + ") }), {
          duration: 5000,
        });
      } else {
        toast.error(
          t("dlv.failed", { channels: channels.map(name).join(" + ") }),
          { duration: 8000 },
        );
      }
    } catch {
      toast.error(
        t("dlv.failed", { channels: channels.map(name).join(" + ") }),
        { duration: 8000 },
      );
    }
  }, []);
}
