'use client';

import {
  Archive,
  ArrowRight,
  Calendar,
  Pencil,
  Plus,
  SquareCheck,
  Tag,
  Timer,
  User,
  type LucideIcon,
} from 'lucide-react';
import { PriorityBars } from '@/components/task-meta/priority-bars';
import { shortName } from '@/helper/utils/person-name';
import type {
  ActivityIcon,
  ActivityLine,
} from '@/helper/utils/task-activity-view';
import type { ActivityColumnRef } from '@/types';
import { cn } from '@/lib/utils';

const ICONS: Record<Exclude<ActivityIcon, 'priority'>, LucideIcon> = {
  created: Plus,
  moved: ArrowRight,
  edited: Pencil,
  due: Calendar,
  labels: Tag,
  estimate: Timer,
  archived: Archive,
  people: User,
  subtask: SquareCheck,
};

const ColumnChip = ({
  column,
  strong,
}: {
  column: ActivityColumnRef | null | undefined;
  strong?: boolean;
}) => (
  <span
    className={cn(
      'inline-flex h-5.5 items-center gap-1.5 rounded-full border border-line px-2 text-xs',
      strong ? 'text-ink' : 'text-ink-muted',
    )}
  >
    <span
      aria-hidden
      className="size-1.5 rounded-full"
      style={{ backgroundColor: column?.color ?? 'var(--ink-faint)' }}
    />
    {column?.name ?? 'a deleted column'}
  </span>
);

/** One row of the task's history on its timeline rail. */
export const ActivityEntry = ({
  actorName,
  line,
  time,
  last,
}: {
  actorName: string | null;
  line: ActivityLine;
  time: string;
  /** the last row of a day draws no rail below its icon */
  last: boolean;
}) => {
  const Icon = line.icon === 'priority' ? null : ICONS[line.icon];
  return (
    <li className="relative flex min-h-9 items-start gap-3 pb-1.5">
      {!last && (
        <span
          aria-hidden
          className="absolute top-6.5 -bottom-0.5 left-2.75 w-px bg-line"
        />
      )}
      <span
        aria-hidden
        className="grid size-6 shrink-0 place-items-center rounded-full border border-line bg-background text-ink-subtle"
      >
        {Icon ? (
          <Icon className="size-3" />
        ) : (
          <PriorityBars
            priority={line.priority ?? 'medium'}
            decorative
            className="size-3"
          />
        )}
      </span>
      <p className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1 pt-0.5 text-sm leading-5 text-ink-muted">
        <strong className="font-semibold text-ink">
          {actorName ? shortName(actorName) : 'Someone'}
        </strong>
        {line.verb}
        {line.icon === 'moved' && (
          <>
            <ColumnChip column={line.from} />
            to
            <ColumnChip column={line.to} strong />
          </>
        )}
        {line.object && (
          <span className="font-medium text-ink">{line.object}</span>
        )}
        {line.note && <span className="text-ink-subtle">{line.note}</span>}
      </p>
      <time className="shrink-0 pt-0.5 text-xs leading-5 text-ink-subtle tabular-nums">
        {time}
      </time>
    </li>
  );
};
