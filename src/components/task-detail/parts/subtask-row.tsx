'use client';

import { useRef, useState } from 'react';
import { GripVertical, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Subtask } from '@/types';
import { useSubtaskDnd } from './use-subtask-dnd';

interface SubtaskRowProps {
  subtask: Subtask;
  taskId: string;
  readOnly: boolean;
  onToggle: (completed: boolean) => void;
  onRename: (title: string) => void;
  onRemove: () => void;
}

/** A subtask: drag to reorder, tick, rename in place, remove. */
export const SubtaskRow = ({
  subtask,
  taskId,
  readOnly,
  onToggle,
  onRename,
  onRemove,
}: SubtaskRowProps) => {
  const rowRef = useRef<HTMLLIElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const [editing, setEditing] = useState(false);
  const saved = !subtask.id.startsWith('temp-');
  const { edge, dragging } = useSubtaskDnd({
    id: subtask.id,
    taskId,
    enabled: !readOnly && saved && !editing,
    rowRef,
    handleRef,
  });

  const commit = (value: string) => {
    setEditing(false);
    const title = value.trim();
    if (title && title !== subtask.title) onRename(title);
  };

  return (
    <li
      ref={rowRef}
      className={cn(
        'group relative -mx-2 flex min-h-9 items-center gap-2.5 rounded-md px-2 hover:bg-surface',
        dragging && 'opacity-40',
      )}
    >
      {edge && (
        <span
          aria-hidden
          className={cn(
            'absolute right-2 left-2 h-0.5 rounded-full bg-brand',
            edge === 'top' ? '-top-px' : '-bottom-px',
          )}
        />
      )}
      {!readOnly && saved && (
        <Button
          ref={handleRef}
          variant="ghost"
          size="icon-xs"
          aria-label={`Drag to reorder ${subtask.title}`}
          className="absolute top-1/2 -left-5 size-5 -translate-y-1/2 cursor-grab text-ink-faint opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        >
          <GripVertical className="size-3.5" />
        </Button>
      )}
      <Checkbox
        id={`subtask-${subtask.id}`}
        // not saved yet: toggling the temp row would race the create
        disabled={readOnly || !saved}
        className="border-ink-faint"
        checked={subtask.completed}
        onCheckedChange={(c) => onToggle(c === true)}
      />
      {editing ? (
        <Input
          autoFocus
          defaultValue={subtask.title}
          aria-label="Subtask title"
          maxLength={200}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={(e) => commit(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit(e.currentTarget.value);
            } else if (e.key === 'Escape') {
              e.stopPropagation();
              setEditing(false);
            }
          }}
          className="-my-1 -ml-1.75 h-7 flex-1 px-1.5 text-base"
        />
      ) : (
        <label
          htmlFor={`subtask-${subtask.id}`}
          className={cn(
            'flex-1 text-base',
            readOnly ? 'cursor-default' : 'cursor-pointer',
            subtask.completed ? 'text-ink-faint line-through' : 'text-ink',
          )}
        >
          {subtask.title}
        </label>
      )}
      {!readOnly && !editing && (
        <div className="flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setEditing(true)}
            disabled={!saved}
            aria-label={`Rename subtask ${subtask.title}`}
            className="text-ink-subtle"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onRemove}
            disabled={!saved}
            aria-label={`Delete subtask ${subtask.title}`}
            className="text-ink-subtle"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}
    </li>
  );
};
