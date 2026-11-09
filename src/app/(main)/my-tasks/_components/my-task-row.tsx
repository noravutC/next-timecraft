'use client';

import { Ban, Calendar } from 'lucide-react';
import { ProjectAvatar } from '@/components/project/project-avatar';
import { UserAvatar } from '@/components/people/user-avatar';
import { PriorityBars } from '@/components/task-meta/priority-bars';
import { AvatarGroup } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { daysUntil, dueUrgency } from '@/helper/utils/date-format';
import { myTaskDueLabel } from '@/helper/utils/my-tasks';
import { cn } from '@/lib/utils';
import type { MyTask, ProjectCache } from '@/types';

const DUE_TONE = {
  overdue: 'text-danger-text',
  soon: 'text-warning',
  normal: 'text-ink-muted',
} as const;

/** One task: priority, title, board, column, due date, people. */
export const MyTaskRow = ({
  task,
  board,
  onOpen,
}: {
  task: MyTask;
  board: ProjectCache | undefined;
  onOpen: () => void;
}) => {
  const due = task.dueDate ? new Date(task.dueDate) : null;
  return (
    <li className="border-t border-line-soft first:border-t-0">
      <Button
        variant="ghost"
        onClick={onOpen}
        className="grid h-auto min-h-13 w-full grid-cols-[1rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 rounded-none px-4 py-2.5 text-left font-normal md:grid-cols-[1rem_minmax(0,1fr)_9.5rem_7rem_7rem_2.5rem]"
      >
        <PriorityBars priority={task.priority} />
        <span className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              'truncate text-base font-medium text-ink',
              task.finished && 'text-ink-subtle line-through',
            )}
          >
            {task.title}
          </span>
          {task.blocked && !task.finished && (
            <span className="inline-flex h-5.5 shrink-0 items-center gap-1.25 rounded-full border border-danger-line bg-danger-soft/40 px-2 text-xs text-danger-text">
              <Ban className="size-3" />
              Blocked
            </span>
          )}
        </span>
        <span className="col-start-2 flex min-w-0 items-center gap-2 text-xs text-ink-muted md:col-start-auto">
          {board && (
            <ProjectAvatar
              project={board}
              size="size-4"
              rounded="rounded-sm"
              textSize="text-4xs"
            />
          )}
          <span className="truncate">{board?.name ?? 'A board'}</span>
        </span>
        <span className="hidden h-5.5 min-w-0 items-center gap-1.5 rounded-full border border-line px-2 text-xs text-ink-muted md:inline-flex">
          <span
            aria-hidden
            className="size-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: task.columnColor ?? 'var(--ink-faint)' }}
          />
          <span className="truncate">{task.columnName}</span>
        </span>
        <span
          className={cn(
            'hidden items-center gap-1.5 text-xs md:flex',
            due ? DUE_TONE[dueUrgency(daysUntil(due))] : 'text-ink-subtle',
          )}
        >
          <Calendar className="size-3.5" />
          {due ? myTaskDueLabel(due) : 'No date'}
        </span>
        <AvatarGroup className="hidden justify-end md:flex">
          {task.assignees.slice(0, 2).map((a) => (
            <UserAvatar
              key={a.userId}
              name={a.fullName}
              image={a.avatar}
              seed={a.userId}
              size="sm"
              className="ring-2 ring-background"
            />
          ))}
        </AvatarGroup>
      </Button>
    </li>
  );
};
