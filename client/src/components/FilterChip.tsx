import type { ReactNode } from "react";

interface FilterChipProps {
  label: string;
  active: boolean;
  icon?: ReactNode;
  onClick: () => void;
}

export function FilterChip({ label, active, icon, onClick }: FilterChipProps) {
  return (
    <button
      className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-chip text-sm font-semibold transition-all active:scale-95 ${
        active
          ? "bg-brand-700 text-white shadow-button"
          : "bg-white text-gray-600 border border-gray-200 shadow-card"
      }`}
      onClick={onClick}
      type="button"
    >
      {icon ?? null}
      {label}
    </button>
  );
}
