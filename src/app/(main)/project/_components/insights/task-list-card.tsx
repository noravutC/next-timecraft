import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A card that lists tasks: its heading with how many there are, the rows,
 * and a line for the ones the list leaves out.
 */
export const TaskListCard = ({
  title,
  hint,
  total,
  empty,
  more,
  className,
  children,
}: {
  title: string;
  /** beside the heading: what the list holds */
  hint: string;
  /** all the tasks that belong here, listed or not */
  total: number;
  /** shown in place of the rows when there are none */
  empty: string;
  more: string | null;
  className?: string;
  children: ReactNode;
}) => (
  <section
    aria-label={title}
    className={cn(
      'flex min-w-0 grow flex-col rounded-xl border border-line bg-background px-2 pt-4.5 pb-2',
      className,
    )}
  >
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-2.5 pb-2.5">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {total > 0 && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-surface-hover px-1.5 text-xs font-medium text-ink-muted tabular-nums">
          {total}
          <span className="sr-only"> in total</span>
        </span>
      )}
      <span className="text-xs text-ink-subtle">{hint}</span>
    </div>
    {total === 0 && (
      <p className="px-2.5 pb-2.5 text-sm text-ink-muted">{empty}</p>
    )}
    {children}
    {more && (
      <p className="px-2.5 pt-1.5 pb-1 text-xs text-ink-subtle">{more}</p>
    )}
  </section>
);
