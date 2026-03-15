import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { ArrowLeftIcon, HomeIcon } from "./icons";

interface AppHeaderProps {
  title: string;
  leading?: "home" | "back";
  /** Optional fallback route when back has no in-app history (direct-entry / deep link). */
  leadingFallbackTo?: string;
  /** Runs as a side effect *before* navigation — does NOT override the navigate action. */
  onLeadingClick?: () => void;
  actions?: ReactNode;
}

export function AppHeader({
  title,
  leading = "back",
  leadingFallbackTo,
  onLeadingClick,
  actions,
}: AppHeaderProps) {
  const navigate = useNavigate();

  const handleLeadingClick = () => {
    // Run caller side effect first (e.g. clear transient state)
    onLeadingClick?.();

    if (leading === "home") {
      navigate("/");
      return;
    }

    // Safe back: use browser history when available, otherwise fallback
    const historyIndex = (window.history.state as { idx?: number } | null)?.idx;
    if (historyIndex != null && historyIndex > 0) {
      navigate(-1);
    } else {
      navigate(leadingFallbackTo ?? "/");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-lg border-b border-surface-border shadow-header">
      <button
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-brand-50 text-brand-700 active:scale-95 transition-transform"
        onClick={handleLeadingClick}
        type="button"
        aria-label={leading === "home" ? "Trang chủ" : "Quay lại"}
      >
        {leading === "home" ? (
          <HomeIcon width={20} height={20} />
        ) : (
          <ArrowLeftIcon width={20} height={20} />
        )}
      </button>
      <h1 className="flex-1 min-w-0 font-heading text-lg font-bold text-brand-700 truncate">
        {title}
      </h1>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
