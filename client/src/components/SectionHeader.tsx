import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  action?: ReactNode;
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <div className="flex items-center gap-2.5">
        <span className="w-1 h-7 rounded-chip bg-brand-300" />
        <h2 className="font-heading text-base font-bold text-brand-700">{title}</h2>
      </div>
      {action ?? null}
    </div>
  );
}
