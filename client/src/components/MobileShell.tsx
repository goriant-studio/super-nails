import type { ReactNode } from "react";

interface MobileShellProps {
  children: ReactNode;
  className?: string;
}

export function MobileShell({ children, className = "" }: MobileShellProps) {
  return (
    <div className={`min-h-screen bg-surface-muted max-w-lg mx-auto relative ${className}`}>
      {children}
    </div>
  );
}
