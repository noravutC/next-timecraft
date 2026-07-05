import type { ReactNode } from "react";

interface PropertyRowProps {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}

export const PropertyRow = ({ icon, label, children }: PropertyRowProps) => (
  <div className="grid grid-cols-[150px_1fr] items-center gap-3 py-1.5">
    <div className="flex items-center gap-2.5 text-sm font-medium text-ink-subtle">
      <span className="text-ink-faint [&>svg]:size-4">{icon}</span>
      {label}
    </div>
    <div className="min-w-0">{children}</div>
  </div>
);
