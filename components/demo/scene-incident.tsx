"use client";

import { useState } from "react";
import { FileText, UsersRound, X } from "lucide-react";
import type { DemoKey, DemoTranslate } from "@/lib/admin/i18n-demo";
import { INCIDENT_STAGES, type IncidentStage } from "@/lib/demo/data";
import { SceneFrame } from "./scene-frame";

const stageLabel = (s: IncidentStage) => `s5.st.${s}` as DemoKey;
const stageHistory = (s: IncidentStage) => `s5.h.${s}` as DemoKey;

/** Scene 5: a sample incident card. Tapping a state moves it and extends the history; the report is a sheet. */
export function SceneIncident({ t }: { t: DemoTranslate }) {
  const [stage, setStage] = useState<IncidentStage>("new");
  const [report, setReport] = useState(false);
  const upto = INCIDENT_STAGES.slice(0, INCIDENT_STAGES.indexOf(stage) + 1);
  return (
    <SceneFrame t={t} n={5} title={t("s5.title")} body={t("s5.body")}>
      <article className="d-card d-incident" aria-label={t("s5.card")}>
        <h2 className="d-h2">{t("s5.card")}</h2>
        <div>
          <p className="d-label" id="d-st">
            {t("s5.status")}
          </p>
          <div
            role="group"
            aria-labelledby="d-st"
            className="d-seg d-seg--wrap"
          >
            {INCIDENT_STAGES.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={stage === s}
                onClick={() => setStage(s)}
                className="d-seg-btn"
              >
                {t(stageLabel(s))}
              </button>
            ))}
          </div>
        </div>
        <p className="d-owner">
          <UsersRound aria-hidden className="size-6" />
          <span>
            <span className="d-label">{t("s5.owner")}</span>
            {t("s5.ownerName")}
          </span>
        </p>
        <div>
          <p className="d-label">{t("s5.history")}</p>
          <ol className="d-history">
            {upto.map((s) => (
              <li key={s}>{t(stageHistory(s))}</li>
            ))}
          </ol>
        </div>
        <button
          type="button"
          className="d-btn"
          aria-expanded={report}
          aria-controls="d-report"
          onClick={() => setReport((r) => !r)}
        >
          {report ? (
            <X aria-hidden className="size-5" />
          ) : (
            <FileText aria-hidden className="size-5" />
          )}
          {report ? t("s5.reportClose") : t("s5.report")}
        </button>
        {report && (
          <div id="d-report" className="d-report">
            <h3 className="d-h2">{t("s5.reportTitle")}</h3>
            <p>{t("s5.reportWhere")}</p>
            <p>{t("s5.reportStatus", { status: t(stageLabel(stage)) })}</p>
            <p className="d-label">{t("s5.reportDone")}</p>
            <ul>
              {upto.map((s) => (
                <li key={s}>{t(stageHistory(s))}</li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </SceneFrame>
  );
}
