import type { ReactNode } from "react";

interface PropertyRowProps {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}

export const PropertyRow = ({ icon, label, children }: PropertyRowProps) => (
  <div className="grid grid-cols-[180px_1fr] items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="text-muted-foreground">{icon}</span>
      {label}
    </div>
    <div className="min-w-0">{children}</div>
  </div>
);
