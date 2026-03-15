import type { ReactNode } from "react";

import { formatCurrency } from "../formatters";
import { useT } from "../i18n/i18n-context";
import { getTaxRateDisplay, TAX_RATE } from "../tax-utils";

interface StickySummaryBarProps {
  count: number;
  subtotal: number;
  taxAmount: number;
  tipAmount: number;
  total: number;
  ctaLabel: string;
  ctaIcon?: ReactNode;
  onCtaClick: () => void;
  disabled?: boolean;
}

export function StickySummaryBar({
  count,
  subtotal,
  taxAmount,
  tipAmount,
  total,
  ctaLabel,
  ctaIcon,
  onCtaClick,
  disabled = false,
}: StickySummaryBarProps) {
  const t = useT();

  return (
    <div className="fixed bottom-0 inset-x-0 z-20 max-w-lg mx-auto">
      <div className="px-4 py-3 pb-safe-bottom bg-white/95 backdrop-blur-lg border-t border-surface-border shadow-nav">
        {/* Breakdown rows */}
        {subtotal > 0 && (
          <div className="space-y-0.5 mb-2 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>
                {t("summary.services_count", { count: String(count) })}
              </span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {taxAmount > 0 && (
              <div className="flex justify-between">
                <span>{t("summary.tax", { rate: getTaxRateDisplay(TAX_RATE) })}</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
            )}
            {tipAmount > 0 && (
              <div className="flex justify-between">
                <span>{t("summary.tip")}</span>
                <span>{formatCurrency(tipAmount)}</span>
              </div>
            )}
          </div>
        )}

        {/* Total + CTA */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <strong className="block text-base font-bold text-brand-900">
              {t("summary.total")}: {formatCurrency(total)}
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
    </div>
  );
}
