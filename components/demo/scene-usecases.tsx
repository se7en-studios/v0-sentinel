"use client";

import {
  ArrowRight,
  Building2,
  Mountain,
  RotateCcw,
  Tractor,
  TreePine,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { DemoKey, DemoTranslate } from "@/lib/admin/i18n-demo";
import { SceneFrame } from "./scene-frame";

const CASES: { icon: LucideIcon; title: DemoKey; text: DemoKey }[] = [
  { icon: TreePine, title: "s6.forestry", text: "s6.forestryText" },
  { icon: Tractor, title: "s6.farms", text: "s6.farmsText" },
  { icon: Building2, title: "s6.towns", text: "s6.townsText" },
  { icon: Mountain, title: "s6.parks", text: "s6.parksText" },
  { icon: Zap, title: "s6.energy", text: "s6.energyText" },
];

// Same destinations as the landing's call to action (components/cta.tsx).
const MEETING_URL = "https://linktr.ee/sentinelarg";
const MESSAGE_URL = "/#contacto";

/** Scene 6: where Sentinel applies (descriptions only) and the same contact destinations as the landing. */
export function SceneUseCases({
  t,
  restart,
}: {
  t: DemoTranslate;
  restart: () => void;
}) {
  return (
    <SceneFrame t={t} n={6} title={t("s6.title")} body={t("s6.body")} stacked>
      <ul className="d-cases">
        {CASES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="d-card d-case">
            <span className="d-case-icon" aria-hidden>
              <Icon className="size-7" />
            </span>
            <h2 className="d-h2">{t(title)}</h2>
            <p>{t(text)}</p>
          </li>
        ))}
      </ul>
      <div className="d-card d-cta">
        <div>
          <h2 className="d-h2 d-h2--lg">{t("s6.ctaTitle")}</h2>
          <p className="d-body">{t("s6.ctaBody")}</p>
        </div>
        <div className="d-actions">
          <a
            className="d-btn"
            href={MEETING_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("s6.ctaMeet")}
            <ArrowRight aria-hidden className="size-5" />
          </a>
          <a className="d-btn d-btn--ghost" href={MESSAGE_URL}>
            {t("s6.ctaMsg")}
          </a>
          <button
            type="button"
            className="d-btn d-btn--ghost"
            onClick={restart}
          >
            <RotateCcw aria-hidden className="size-5" />
            {t("s6.restart")}
          </button>
        </div>
      </div>
    </SceneFrame>
  );
}
