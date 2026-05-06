'use client';

import { useState } from 'react';
import { CheckSquare, Plus, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useSubtaskStore } from '@/store/use-subtask.store';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  taskId: string;
}

export const SubtaskList = ({ taskId }: Props) => {
  const items = useSubtaskStore(
    useShallow((s) => s.byTask[taskId]?.items ?? []),
  );
  const create = useSubtaskStore((s) => s.create);
  const update = useSubtaskStore((s) => s.update);
  const remove = useSubtaskStore((s) => s.remove);

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const total = items.length;
  const done = items.filter((i) => i.completed).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const submit = () => {
    const title = draft.trim();
    if (title) create(taskId, title);
    setDraft('');
    setAdding(false);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="size-4 text-muted-foreground" />
          <span className="!text-md font-semibold">Subtasks</span>
          {total > 0 && (
            <span className="text-muted-foreground">
              {done} / {total}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="xs"
          className="text-muted-foreground focus-visible:ring-0"
          onClick={() => setAdding(true)}
        >
          <Plus className="size-4" /> Add
        </Button>
      </div>

      {total > 0 && (
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={cn("h-full bg-blue-600 transition-[width]")}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <ul className="space-y-0.5">
        {items.map((sub) => (
          <li
            key={sub.id}
            className="group flex items-center gap-3 rounded-md py-1.5"
          >
            <Checkbox
              checked={sub.completed}
              onCheckedChange={(c) =>
                update(sub.id, taskId, { completed: c === true })
              }
              className="size-5 rounded border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white"
            />
            <span
              className={cn(
                'flex-1 text-sm font-semibold',
                sub.completed && 'text-muted-foreground line-through',
              )}
            >
              {sub.title}
            </span>
            <Button
              variant={'ghost'}
              size="xs"
              onClick={() => remove(sub.id, taskId)}
              aria-label="Delete subtask"
              className="rounded w-fit h-fit !p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted hover:text-foreground"
            >
              <X className="size-3" />
            </Button>
          </li>
        ))}
      </ul>

      {adding && (
        <div className="mt-1 flex items-center gap-3">
          <Checkbox
              checked={false}
              disabled
              className="size-5 rounded border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white"
            />
          <Input
            className="border-none shadow-none focus-visible:ring-0 font-medium"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={submit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              } else if (e.key === 'Escape') {
                setDraft('');
                setAdding(false);
              }
            }}
            placeholder="Subtask...."
          />
        </div>
      )}
    </div>
  );
};
