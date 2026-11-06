'use client';

import { useCallback, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSubtaskStore } from '@/store/use-subtask.store';
import {
  progressFromItems,
  progressPercent,
} from '@/helper/utils/subtask-progress';
import { SubtaskRow } from './subtask-row';
import { useSubtaskReorder } from './use-subtask-dnd';

interface Props {
  taskId: string;
  /** viewer, or an archived board: list only, no ticking or editing */
  readOnly?: boolean;
}

export const SubtaskList = ({ taskId, readOnly = false }: Props) => {
  const items = useSubtaskStore(
    useShallow((s) => s.byTask[taskId]?.items ?? []),
  );
  const create = useSubtaskStore((s) => s.create);
  const update = useSubtaskStore((s) => s.update);
  const remove = useSubtaskStore((s) => s.remove);

  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('');
  const progress = progressFromItems(items);
  const move = useCallback(
    (subtaskId: string, orderFraction: string) =>
      update(subtaskId, taskId, { orderFraction }),
    [update, taskId],
  );
  useSubtaskReorder(taskId, move);

  const submit = () => {
    const title = draft.trim();
    if (title) create(taskId, title);
    setDraft('');
  };

  return (
    <section>
      <div className="mb-2.5 flex items-center gap-2">
        <h3 className="text-sm leading-5 font-semibold text-ink">Subtasks</h3>
        {progress && (
          <span className="font-mono text-xs text-ink-subtle">
            {progress.done}/{progress.total}
          </span>
        )}
        <div
          aria-hidden
          className="mx-2 h-1 flex-1 overflow-hidden rounded-full bg-line-soft"
        >
          <div
            className="h-full rounded-full bg-brand transition-[width]"
            style={{ width: `${progressPercent(progress)}%` }}
          />
        </div>
        {!readOnly && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => inputRef.current?.focus()}
            className="gap-1 px-2 text-ink-muted"
          >
            <Plus className="size-3.25" />
            Add
          </Button>
        )}
      </div>

      <ul className="flex flex-col gap-0.5">
        {items.map((sub) => (
          <SubtaskRow
            key={sub.id}
            subtask={sub}
            taskId={taskId}
            readOnly={readOnly}
            onToggle={(completed) => update(sub.id, taskId, { completed })}
            onRename={(title) => update(sub.id, taskId, { title })}
            onRemove={() => remove(sub.id, taskId)}
          />
        ))}
        {readOnly && items.length === 0 && (
          <li className="text-sm text-ink-subtle">No subtasks</li>
        )}
        {!readOnly && (
          <li className="-mx-2 flex min-h-9 items-center gap-2.5 px-2 text-ink-subtle">
            <Plus className="size-4" />
            <Input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={submit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submit();
                } else if (e.key === 'Escape') {
                  // Esc clears the draft first, then leaves the field
                  if (draft) setDraft('');
                  else e.currentTarget.blur();
                }
              }}
              placeholder="Add a subtask"
              aria-label="New subtask"
              className="h-auto flex-1 border-0 bg-transparent p-0 text-base focus-visible:ring-0"
            />
          </li>
        )}
      </ul>
    </section>
  );
};
