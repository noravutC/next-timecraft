'use client';

import { useState } from 'react';
import { Search, Trash2, Undo2 } from 'lucide-react';
import { useBoardAccess } from '@/components/project/use-board-access';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  archivedTaskMeta,
  deletedColumnMeta,
} from '@/helper/utils/board-archive';
import { cn } from '@/lib/utils';
import type { ArchivedTask } from '@/types';
import type { useBoardArchive } from '../use-board-archive';

const LIST = 'flex flex-col overflow-hidden rounded-popover border border-line';
const ROW = 'flex min-h-14.5 items-center gap-3 py-2.5 pr-2.5 pl-3.5';

/** Board settings › Archive: archived tasks and deleted columns. */
export const BoardArchivePanel = ({
  archive,
}: {
  archive: ReturnType<typeof useBoardArchive>;
}) => {
  const access = useBoardAccess();
  const [toDelete, setToDelete] = useState<ArchivedTask | null>(null);
  const { shown } = archive;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <p className="min-w-0 flex-1 basis-80 text-sm leading-5 text-ink-muted">
          Archived tasks and deleted columns wait here until you bring them
          back.
        </p>
        <div className="relative w-full sm:w-57">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-ink-subtle" />
          <Input
            value={archive.query}
            onChange={(e) => archive.setQuery(e.target.value)}
            placeholder="Search the archive"
            aria-label="Search the archive"
            className="pl-8"
          />
        </div>
      </div>

      {!shown && <Skeleton className="h-40 w-full rounded-popover" />}

      {shown && shown.tasks.length === 0 && shown.columns.length === 0 && (
        <p className="rounded-popover border border-dashed border-line px-4 py-8 text-center text-sm text-ink-subtle">
          {archive.query ? 'Nothing here matches.' : 'Nothing archived yet.'}
        </p>
      )}

      {shown && shown.tasks.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="flex items-center gap-2 text-sm font-medium text-ink">
            Tasks
            <span className="font-mono text-xs font-normal text-ink-subtle">
              {shown.tasks.length}
            </span>
          </h3>
          <ul className={LIST}>
            {shown.tasks.map((task, index) => (
              <li
                key={task.id}
                className={cn(ROW, index > 0 && 'border-t border-line-soft')}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-base text-ink">
                    {task.title}
                  </span>
                  <span className="flex items-center gap-1.5 truncate text-xs text-ink-subtle">
                    <span
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: task.columnColor }}
                    />
                    {archivedTaskMeta(task)}
                  </span>
                </span>
                {access.can('task:update') && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => void archive.restoreTask(task)}
                    className="h-7.5"
                  >
                    <Undo2 className="size-3.25" />
                    Restore
                  </Button>
                )}
                {access.can('task:delete') && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setToDelete(task)}
                    aria-label={`Delete ${task.title} permanently`}
                    className="size-7.5 text-ink-subtle hover:bg-danger-soft hover:text-danger-text"
                  >
                    <Trash2 className="size-3.75" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {shown && shown.columns.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="flex items-center gap-2 text-sm font-medium text-ink">
            Deleted columns
            <span className="font-mono text-xs font-normal text-ink-subtle">
              {shown.columns.length}
            </span>
          </h3>
          <ul className={LIST}>
            {shown.columns.map((column, index) => (
              <li
                key={column.id}
                className={cn(ROW, index > 0 && 'border-t border-line-soft')}
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-base text-ink">
                    {column.name}
                  </span>
                  <span className="truncate text-xs text-ink-subtle">
                    {deletedColumnMeta(column)}
                  </span>
                </span>
                {access.can('column:delete') && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => void archive.restoreColumn(column)}
                    className="h-7.5"
                  >
                    <Undo2 className="size-3.25" />
                    Restore column
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        variant="destructive"
        title="Delete this task permanently?"
        description={`“${toDelete?.title ?? ''}” goes with its comments, subtasks and history. This can’t be undone.`}
        primaryLabel="Delete task"
        onConfirm={() => {
          if (toDelete) void archive.deleteTask(toDelete);
          setToDelete(null);
        }}
      />
    </div>
  );
};
