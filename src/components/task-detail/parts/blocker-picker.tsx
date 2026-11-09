'use client';

import { useMemo, useState } from 'react';
import { Check, Plus, Search } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTaskSearch } from '@/components/board-dialogs/use-task-search';
import { useTaskStore } from '@/store/use-task.store';
import { cn } from '@/lib/utils';
import type { ColumnCache } from '@/types';
import type { LinkedTask } from '../use-task-dependencies';

/** "Add blocker": pick tasks on this board that have to finish first. */
export const BlockerPicker = ({
  taskId,
  projectId,
  columns,
  selected,
  finishColumnName,
  onToggle,
}: {
  taskId: string;
  projectId: string;
  columns: ColumnCache[];
  selected: string[];
  finishColumnName: string | null;
  onToggle: (task: LinkedTask, on: boolean) => void;
}) => {
  const [query, setQuery] = useState('');
  const { hits } = useTaskSearch(query, projectId);
  const columnById = useMemo(
    () => new Map(columns.map((c) => [c.id, c])),
    [columns],
  );
  // before typing: the board's loaded tasks; then the board-wide search
  const loaded = useTaskStore(
    useShallow((s) =>
      Object.values(s.tasks).filter(
        (t) => columnById.has(t.columnId) && !t.archived && t.id !== taskId,
      ),
    ),
  );
  const options: LinkedTask[] =
    query.trim().length < 2
      ? loaded.map((t) => ({
          id: t.id,
          title: t.title,
          columnId: t.columnId,
          archived: false,
        }))
      : hits
          .filter((h) => h.projectId === projectId && h.taskId !== taskId)
          .map((h) => ({
            id: h.taskId,
            title: h.title,
            columnId: '',
            archived: false,
            columnName: h.columnName,
            columnColor: h.columnColor,
          }));

  return (
    <Popover onOpenChange={(open) => !open && setQuery('')}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="xs"
          className="h-7 gap-1 px-2 text-ink-muted data-[state=open]:bg-surface-active"
        >
          <Plus className="size-3.5" />
          Add blocker
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-80 flex-col p-0">
        <label className="flex items-center gap-2 border-b border-line-soft px-3">
          <Search className="size-3.5 shrink-0 text-ink-subtle" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks on this board"
            aria-label="Search tasks to link"
            className="h-10 border-0 px-0 shadow-none focus-visible:ring-0"
          />
        </label>
        <div role="menu" className="max-h-60 overflow-y-auto p-1">
          {options.length === 0 && (
            <p className="px-2 py-3 text-sm text-ink-subtle">No tasks found</p>
          )}
          {options.map((option) => {
            const on = selected.includes(option.id);
            const column = columnById.get(option.columnId);
            return (
              <Button
                key={option.id}
                variant="ghost"
                role="menuitemcheckbox"
                aria-checked={on}
                onClick={() => onToggle(option, !on)}
                className="h-auto min-h-9 w-full justify-start gap-2.5 rounded-md px-2 py-1.5 text-left font-normal"
              >
                {/* drawn, not a Checkbox: that's a button, and this is one */}
                <span
                  aria-hidden
                  className={cn(
                    'grid size-4 shrink-0 place-items-center rounded-sm border',
                    on
                      ? 'border-ink bg-ink text-white'
                      : 'border-input bg-background',
                  )}
                >
                  {on && <Check className="size-3" />}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-ink">
                  {option.title}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-ink-subtle">
                  <span
                    className="size-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        column?.color ??
                        option.columnColor ??
                        'var(--ink-faint)',
                    }}
                  />
                  {column?.name ?? option.columnName}
                </span>
              </Button>
            );
          })}
        </div>
        {finishColumnName && (
          <p className="border-t border-line-soft bg-surface px-3 py-2.5 text-xs leading-4.25 text-ink-muted">
            A task shows a Blocked tag on the board until every blocker reaches{' '}
            {finishColumnName}.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
};
