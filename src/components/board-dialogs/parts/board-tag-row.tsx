'use client';

import { useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TAG_LIMIT, TAG_PALETTE } from '@/lib/project-settings/constants';

/**
 * One tag in Board settings: color, name and how many tasks use it.
 * Edit opens the row for a new name and color; Save keeps both.
 */
export const BoardTagRow = ({
  tag,
  color,
  uses,
  first,
  readOnly,
  onSave,
  onRemove,
}: {
  tag: string;
  color: string;
  uses: number;
  first: boolean;
  readOnly: boolean;
  /** false keeps the row open: the name was refused */
  onSave: (name: string, color: string) => boolean;
  onRemove: () => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(tag);
  const [pick, setPick] = useState(color);

  const edit = () => {
    setName(tag);
    setPick(color);
    setEditing(true);
  };
  const save = () => {
    if (onSave(name, pick)) setEditing(false);
  };

  if (editing) {
    return (
      <li
        className={cn(
          'flex flex-col gap-2.5 bg-surface px-3.5 py-3',
          !first && 'border-t border-line-soft',
        )}
      >
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <span
              aria-hidden
              className="absolute top-1/2 left-3 size-2.5 -translate-y-1/2 rounded-full"
              style={{ backgroundColor: pick }}
            />
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  save();
                } else if (e.key === 'Escape') {
                  // closes the row, not the dialog
                  e.stopPropagation();
                  setEditing(false);
                }
              }}
              maxLength={TAG_LIMIT}
              aria-label="Tag name"
              className="h-8.5 bg-background pl-7.5 text-base"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setEditing(false)}
            className="h-8.5 text-ink-muted"
          >
            Cancel
          </Button>
          <Button type="button" onClick={save} className="h-8.5">
            Save
          </Button>
        </div>
        <div role="radiogroup" aria-label="Tag color" className="flex gap-2">
          {TAG_PALETTE.map((option) => {
            const selected = option.value === pick;
            return (
              <Button
                key={option.value}
                type="button"
                variant="ghost"
                role="radio"
                aria-checked={selected}
                aria-label={`Tag color ${option.value}`}
                onClick={() => setPick(option.value)}
                className={cn(
                  'size-5 rounded-full p-0 hover:opacity-80',
                  selected
                    ? 'ring-2 ring-ink ring-offset-2 ring-offset-surface'
                    : 'shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]',
                )}
                style={{ backgroundColor: option.value }}
              />
            );
          })}
        </div>
      </li>
    );
  }

  return (
    <li
      className={cn(
        'flex h-10 items-center gap-2.5 pr-2 pl-3.5 hover:bg-surface',
        !first && 'border-t border-line-soft',
      )}
    >
      <span
        aria-hidden
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="min-w-0 flex-1 truncate text-base text-ink">{tag}</span>
      <span className="shrink-0 font-mono text-xs text-ink-subtle">
        {uses === 1 ? '1 task' : `${uses} tasks`}
      </span>
      {!readOnly && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit tag ${tag}`}
            onClick={edit}
            className="text-ink-subtle"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove tag ${tag}`}
            onClick={onRemove}
            className="text-ink-subtle"
          >
            <X className="size-3.5" />
          </Button>
        </>
      )}
    </li>
  );
};
