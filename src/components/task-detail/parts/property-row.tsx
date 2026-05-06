import type { ReactNode } from "react";

interface PropertyRowProps {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}

export const PropertyRow = ({ icon, label, children }: PropertyRowProps) => (
  <div className="mb-4 grid grid-cols-2 items-start gap-3">
    <div className="flex items-center gap-1.5 pt-1.5 text-xs text-muted-foreground uppercase">
      <span className="text-muted-foreground">{icon}</span>
      {label}
    </div>
    <div className="min-w-0">{children}</div>
  </div>
);
