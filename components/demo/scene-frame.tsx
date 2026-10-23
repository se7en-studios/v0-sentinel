import type { ReactNode } from "react";
import type { DemoTranslate } from "@/lib/admin/i18n-demo";

/** One scene: text on one side, the visual on the other (stacked on phones), and the "sample data" footnote. */
export function SceneFrame({
  t,
  n,
  title,
  body,
  extra,
  stacked,
  children,
}: {
  t: DemoTranslate;
  n: number;
  title: string;
  body: string;
  extra?: ReactNode;
  /** text on top, visual below, full width (used by the last scene) */
  stacked?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={`d-scene${stacked ? " d-scene--stacked" : ""}`}
      aria-labelledby="demo-title"
    >
      <div className="d-text">
        <p className="d-kicker">{n}</p>
        <h1 id="demo-title" tabIndex={-1} className="d-title">
          {title}
        </h1>
        <p className="d-body">{body}</p>
        {extra}
      </div>
      <div className="d-visual">{children}</div>
      <p className="d-sample">{t("chrome.sample")}</p>
    </section>
  );
}

export function Legend({
  items,
}: {
  items: { icon: "fire" | "ring" | "alert"; label: string }[];
}) {
  return (
    <ul className="d-legend">
      {items.map((i) => (
        <li key={i.label}>
          <svg viewBox="-8 -8 16 16" width="18" height="18" aria-hidden>
            {i.icon === "fire" && <circle r="4.5" className="d-dot" />}
            {i.icon === "ring" && (
              <>
                <circle r="6" className="d-ring" />
                <path d="M-3.5 3.5L3.5 -3.5" className="d-ring-x" />
              </>
            )}
            {i.icon === "alert" && <circle r="6" className="d-alert-ring" />}
          </svg>
          {i.label}
        </li>
      ))}
    </ul>
  );
}
