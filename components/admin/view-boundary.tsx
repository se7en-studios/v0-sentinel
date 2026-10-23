"use client";

import { Component, type ReactNode } from "react";
import type { Translate } from "@/lib/admin/i18n";

interface Props {
  /** already translated name of what is wrapped ("Métricas", "el mapa"...) */
  name: string;
  t: Translate;
  /** changing it (e.g. the active tab) clears a previous error */
  resetKey?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Contains a render error to one view: the rest of the panel keeps working and
 * app/admin/error.tsx stays the last safety net. Logs the component stack, never the data.
 */
export class ViewBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error(
      `[admin] "${this.props.name}" failed: ${error.name}: ${error.message}`,
      info.componentStack ?? "",
    );
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey)
      this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const { t, name, className } = this.props;
    return (
      <div
        role="alert"
        data-testid="view-error"
        className={`grid place-items-center p-6 text-center ${className ?? ""}`}
      >
        <div className="max-w-sm">
          <h2 className="text-[14px] font-semibold">
            {t("view.error.title", { name })}
          </h2>
          <p className="mt-1 text-[12.5px] text-foreground/65">
            {t("view.error.body")}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-3 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t("view.error.retry")}
          </button>
        </div>
      </div>
    );
  }
}
