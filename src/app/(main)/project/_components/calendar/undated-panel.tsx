'use client';

import { Checkbox } from '@/components/ui/checkbox';
import type { TaskCache } from '@/types';
import { UndatedCard } from './undated-card';

/** "No due date": tasks to schedule by dragging them onto a day. */
export const UndatedPanel = ({
  tasks,
  total,
  column,
  finishColumnName,
  showFinished,
  onShowFinished,
  canMove,
  onOpen,
}: {
  tasks: TaskCache[];
  total: number;
  column: (columnId: string) => { name: string; color: string };
  finishColumnName: string | null;
  showFinished: boolean;
  onShowFinished: (show: boolean) => void;
  canMove: boolean;
  onOpen: (taskId: string) => void;
}) => (
  <aside
    aria-labelledby="undated-title"
    className="flex min-h-0 w-75 shrink-0 flex-col border-l border-line bg-surface"
  >
    <div className="flex flex-col gap-1 border-b border-line px-4 pt-3.5 pb-3">
      <span className="flex items-center gap-2">
        <h2 id="undated-title" className="text-sm font-semibold text-ink">
          No due date
        </h2>
        <span className="font-mono text-xs text-ink-subtle">{total}</span>
      </span>
      {canMove && (
        <span className="text-xs leading-4 text-ink-subtle">
          Drag a task onto a day to give it a due date.
        </span>
      )}
    </div>
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
      {tasks.map((task) => (
        <UndatedCard
          key={task.id}
          task={task}
          columnName={column(task.columnId).name}
          dotColor={column(task.columnId).color}
          draggable={canMove}
          onOpen={() => onOpen(task.id)}
        />
      ))}
      {tasks.length < total && (
        <p className="px-1 text-xs text-ink-subtle">
          {total - tasks.length} more without a due date. Filter the board to
          find them.
        </p>
      )}
    </div>
    {finishColumnName && (
      <label className="flex cursor-pointer items-center gap-2 border-t border-line px-4 py-3 text-sm text-ink-muted">
        <Checkbox
          checked={showFinished}
          onCheckedChange={(on) => onShowFinished(on === true)}
        />
        Show tasks in {finishColumnName}
      </label>
    )}
  </aside>
);
