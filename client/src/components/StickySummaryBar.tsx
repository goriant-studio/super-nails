import type { ReactNode } from "react";

import { formatCurrency } from "../formatters";

interface StickySummaryBarProps {
  count: number;
  total: number;
  ctaLabel: string;
  ctaIcon?: ReactNode;
  onCtaClick: () => void;
  disabled?: boolean;
}

export function StickySummaryBar({
  count,
  total,
  ctaLabel,
  ctaIcon,
  onCtaClick,
  disabled = false,
}: StickySummaryBarProps) {
  return (
    <div className="fixed bottom-16 inset-x-0 z-20 max-w-lg mx-auto">
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white/95 backdrop-blur-lg border-t border-surface-border shadow-nav">
        <div className="min-w-0">
          <span className="text-sm font-semibold text-brand-700">
            Đã chọn {count} dịch vụ
          </span>
          <strong className="block text-base font-bold text-brand-900 mt-0.5">
            {formatCurrency(total)}
          </strong>
        </div>
        <button
          className={`flex items-center gap-2 px-5 py-3 rounded-button text-sm font-bold transition-all active:scale-95 ${
            disabled
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-brand-700 text-white shadow-button hover:bg-brand-600"
          }`}
          disabled={disabled}
          onClick={onCtaClick}
          type="button"
        >
          {ctaIcon ?? null}
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
