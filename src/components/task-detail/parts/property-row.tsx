import type { ReactNode } from 'react';

/** Value buttons in the properties grid: quiet until hovered. */
export const propertyButtonClass =
  'h-7.5 gap-2 px-2 font-normal text-ink hover:text-ink';

interface PropertyRowProps {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}

/** One row of the task properties grid: label cell + value cell. */
export const PropertyRow = ({ icon, label, children }: PropertyRowProps) => (
  <>
    <div className="flex h-9 items-center gap-2 text-sm text-ink-subtle [&_svg]:size-3.75">
      {icon}
      {label}
    </div>
    <div className="flex min-h-9 min-w-0 items-center">{children}</div>
  </>
);
