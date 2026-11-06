'use client';

import { useRef } from 'react';
import { Ban, GripVertical } from 'lucide-react';
import { PriorityBars } from '@/components/task-meta/priority-bars';
import { useTaskBlocked } from '@/components/project/use-task-blocked';
import { cn } from '@/lib/utils';
import type { TaskCache } from '@/types';
import { useCalendarDraggable } from './use-calendar-dnd';

/** A task with no due date, to drag onto a day or open. */
export const UndatedCard = ({
  task,
  columnName,
  dotColor,
  draggable,
  onOpen,
}: {
  task: TaskCache;
  columnName: string;
  dotColor: string;
  draggable: boolean;
  onOpen: () => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useCalendarDraggable(ref, task, draggable);
  const blocked = useTaskBlocked(task.id);
  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        'flex items-start gap-2 rounded-lg border border-line bg-background py-2.5 pr-2.5 pl-1.5 text-ink shadow-card outline-none hover:border-input focus-visible:ring-3 focus-visible:ring-ink/10',
        draggable && 'cursor-grab',
        dragging && 'opacity-40',
      )}
    >
      <GripVertical
        aria-hidden
        className="mt-0.75 size-3.5 shrink-0 text-ink-faint"
      />
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-sm leading-4.5 font-medium text-pretty">
          {task.title}
        </span>
        <span className="flex items-center gap-2.5 text-xs text-ink-subtle">
          <PriorityBars priority={task.priority} />
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-1.5 rounded-full"
              style={{ backgroundColor: dotColor }}
            />
            {columnName}
          </span>
          {blocked && (
            <span className="inline-flex items-center gap-1 text-danger-text">
              <Ban className="size-3" />
              Blocked
            </span>
          )}
        </span>
      </span>
    </div>
  );
};
