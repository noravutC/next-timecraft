'use client';

import { useRef } from 'react';
import { PriorityBars } from '@/components/task-meta/priority-bars';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TaskCache } from '@/types';
import { useCalendarDraggable } from './use-calendar-dnd';

/** A task on its due day: open it, or drag it to another day. */
export const CalendarChip = ({
  task,
  dotColor,
  overdue,
  draggable,
  onOpen,
}: {
  task: TaskCache;
  dotColor: string;
  overdue: boolean;
  draggable: boolean;
  onOpen: () => void;
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const dragging = useCalendarDraggable(ref, task, draggable);
  return (
    <Button
      ref={ref}
      variant="ghost"
      onClick={onOpen}
      aria-label={`${task.title}${overdue ? ', overdue' : ''}`}
      className={cn(
        'h-6.5 w-full min-w-0 shrink-0 justify-start gap-1.5 rounded-md border border-line bg-background px-2 text-xs font-medium text-ink shadow-card hover:bg-surface-hover',
        overdue && 'border-danger-line bg-danger-soft/40',
        dragging && 'opacity-40',
      )}
    >
      <span
        aria-hidden
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: dotColor }}
      />
      <span className="min-w-0 flex-1 truncate text-left">{task.title}</span>
      <PriorityBars priority={task.priority} decorative />
    </Button>
  );
};
