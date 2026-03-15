import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { ArrowLeftIcon, HomeIcon } from "./icons";

interface AppHeaderProps {
  title: string;
  leading?: "home" | "back";
  onLeadingClick?: () => void;
  actions?: ReactNode;
}

export function AppHeader({
  title,
  leading = "back",
  onLeadingClick,
  actions,
}: AppHeaderProps) {
  const navigate = useNavigate();

  const handleLeadingClick = () => {
    if (onLeadingClick) {
      onLeadingClick();
      return;
    }

    if (leading === "home") {
      navigate("/");
      return;
    }

    navigate(-1);
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
