import { Building2, Handshake, Tractor, TreePine, type LucideIcon } from "lucide-react";
import {
  DEMO_PROFILES,
  type DemoProfile,
  type DemoTranslate,
} from "@/lib/admin/i18n-demo";

const ICONS: Record<DemoProfile, LucideIcon> = {
  forestry: TreePine,
  farms: Tractor,
  towns: Building2,
  invest: Handshake,
};

/** Optional screen before step 1: who is the audience (adapts the examples; nothing is sent anywhere). */
export function Chooser({
  t,
  current,
  onPick,
}: {
  t: DemoTranslate;
  current: DemoProfile | null;
  onPick: (p: DemoProfile | null) => void;
}) {
  return (
    <section className="d-chooser" aria-labelledby="demo-title">
      <h1 id="demo-title" tabIndex={-1} className="d-title">
        {t("who.title")}
      </h1>
      <p className="d-body">{t("who.body")}</p>
      <div role="group" aria-label={t("who.group")} className="d-profiles">
        {DEMO_PROFILES.map((p) => {
          const Icon = ICONS[p];
          return (
            <button
              key={p}
              type="button"
              className="d-profile"
              aria-pressed={current === p}
              onClick={() => onPick(p)}
            >
              <span className="d-case-icon" aria-hidden>
                <Icon className="size-7" />
              </span>
              {t(`who.${p}`)}
            </button>
          );
        })}
      </div>
      <button type="button" className="d-btn d-btn--ghost" onClick={() => onPick(null)}>
        {t("who.skip")}
      </button>
    </section>
  );
}
