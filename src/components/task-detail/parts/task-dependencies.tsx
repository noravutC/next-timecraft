'use client';

import { Ban, Check, CornerDownRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ColumnCache } from '@/types';
import { useTaskDependencies, type LinkedTask } from '../use-task-dependencies';
import { BlockerPicker } from './blocker-picker';
import { PropertyRow } from './property-row';

/** A linked task: where it sits, struck through once it's finished. */
const DependencyChip = ({
  task,
  column,
  finished,
  onRemove,
}: {
  task: LinkedTask;
  column: ColumnCache | undefined;
  finished: boolean;
  onRemove?: () => void;
}) => (
  <span
    title={finished ? 'Finished, no longer blocking' : undefined}
    className={cn(
      'inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border border-line pl-2.25 text-sm',
      onRemove ? 'pr-1' : 'pr-2.25',
    )}
  >
    {finished ? (
      <Check className="size-3.5 shrink-0 text-success-text" />
    ) : (
      <span
        aria-hidden
        className="size-1.75 shrink-0 rounded-full"
        style={{
          backgroundColor:
            column?.color ?? task.columnColor ?? 'var(--ink-faint)',
        }}
      />
    )}
    <span
      className={cn(
        'truncate',
        finished ? 'text-ink-subtle line-through' : 'text-ink',
      )}
    >
      {task.title}
    </span>
    <span className="shrink-0 text-xs text-ink-subtle">
      {column?.name ?? task.columnName}
    </span>
    {onRemove && (
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={`Remove blocker ${task.title}`}
        onClick={onRemove}
        className="size-5 rounded-full text-ink-subtle"
      >
        <X className="size-3" />
      </Button>
    )}
  </span>
);

/** Blocked by (editable) and Blocking, in the properties grid. */
export const TaskDependencyRows = ({
  taskId,
  projectId,
  columns,
  readOnly,
}: {
  taskId: string;
  projectId: string;
  columns: ColumnCache[];
  readOnly: boolean;
}) => {
  const { links, toggle } = useTaskDependencies(taskId);
  const columnById = new Map(columns.map((c) => [c.id, c]));
  const finish = columns[columns.length - 1] ?? null;
  const finished = (t: LinkedTask) =>
    t.archived || (finish !== null && t.columnId === finish.id);
  const blockedBy = links?.blockedBy ?? [];

  return (
    <>
      <PropertyRow icon={<Ban />} label="Blocked by">
        <div className="flex flex-wrap items-center gap-1.5 py-0.75">
          {blockedBy.map((task) => (
            <DependencyChip
              key={task.id}
              task={task}
              column={columnById.get(task.columnId)}
              finished={finished(task)}
              onRemove={readOnly ? undefined : () => void toggle(task, false)}
            />
          ))}
          {!readOnly && links && (
            <BlockerPicker
              taskId={taskId}
              projectId={projectId}
              columns={columns}
              selected={blockedBy.map((t) => t.id)}
              finishColumnName={finish?.name ?? null}
              onToggle={(task, on) => void toggle(task, on)}
            />
          )}
          {readOnly && blockedBy.length === 0 && (
            <span className="px-2 text-sm text-ink-subtle">None</span>
          )}
        </div>
      </PropertyRow>
      {links && links.blocking.length > 0 && (
        <PropertyRow icon={<CornerDownRight />} label="Blocking">
          <div className="flex flex-wrap items-center gap-1.5 py-0.75">
            {links.blocking.map((task) => (
              <DependencyChip
                key={task.id}
                task={task}
                column={columnById.get(task.columnId)}
                finished={finished(task)}
              />
            ))}
          </div>
        </PropertyRow>
      )}
    </>
  );
};
