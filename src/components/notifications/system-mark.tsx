import { CalendarClock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Stands where a person's avatar would: a reminder, or a rule on a board. */
export const SystemMark = ({ kind }: { kind: 'due' | 'rule' }) => (
  <span
    className={cn(
      'grid size-8 shrink-0 place-items-center rounded-full border',
      kind === 'due'
        ? 'border-warning-line bg-warning-soft text-warning'
        : 'border-transparent bg-brand-soft text-brand',
    )}
  >
    {kind === 'due' ? (
      <CalendarClock className="size-4" />
    ) : (
      <Zap className="size-4" />
    )}
  </span>
);
