import { Ban, Clock, Hourglass, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AttentionItem, AttentionKind } from '@/types';
import { attentionRows, moreLine } from './insights-operations';
import { TaskListCard } from './task-list-card';
import { TaskListRow } from './task-list-row';

const CHIPS: Record<AttentionKind, { icon: LucideIcon; className: string }> = {
  overdue: { icon: Clock, className: 'bg-danger-soft text-danger-text' },
  stuck: { icon: Hourglass, className: 'bg-warning-tint text-warning-text' },
  blocked: { icon: Ban, className: 'bg-surface-hover text-ink-muted' },
  due_soon: { icon: Clock, className: 'bg-surface-hover text-ink-muted' },
};

/** Open tasks that are overdue, stuck or blocked; a row opens its task. */
export const AttentionCard = ({
  items,
  total,
  onOpen,
}: {
  items: AttentionItem[];
  /** all tasks that need attention; `items` are the first ones */
  total: number;
  onOpen: (taskId: string) => void;
}) => (
  <TaskListCard
    title="Needs attention"
    hint="Overdue, stuck or blocked"
    total={total}
    empty="Nothing is overdue, stuck or blocked."
    more={moreLine(total, items.length)}
    className="basis-95"
  >
    {attentionRows(items).map((row) => {
      const chip = CHIPS[row.kind];
      return (
        <TaskListRow
          key={row.id}
          lead={
            <span
              className={cn(
                'inline-flex h-5.5 w-21 shrink-0 items-center gap-1.25 rounded-full px-2 text-xs font-medium',
                chip.className,
              )}
            >
              <chip.icon className="size-3 stroke-2" />
              {row.label}
            </span>
          }
          title={row.title}
          why={row.why}
          owner={row.owner}
          ownerNames={row.ownerNames}
          onOpen={() => onOpen(row.id)}
        />
      );
    })}
  </TaskListCard>
);
