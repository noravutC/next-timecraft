'use client';

import { useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TAG_LIMIT } from '@/lib/project-settings/constants';
import { TagColorPicker } from './tag-color-picker';

/** One tag in Board settings: its color, its name, rename and remove. */
export const BoardTagRow = ({
  tag,
  color,
  first,
  readOnly,
  onRename,
  onRecolor,
  onRemove,
}: {
  tag: string;
  color: string;
  first: boolean;
  readOnly: boolean;
  /** false keeps the field open: the name was refused */
  onRename: (name: string) => boolean;
  onRecolor: (color: string) => void;
  onRemove: () => void;
}) => {
  const [editing, setEditing] = useState(false);

  return (
    <li
      className={cn(
        'flex h-10 items-center gap-2.5 pr-2 pl-3.5 hover:bg-surface',
        !first && 'border-t border-line-soft',
      )}
    >
      {readOnly ? (
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
      ) : (
        <TagColorPicker
          value={color}
          onChange={onRecolor}
          label={`Color for ${tag}`}
          className="-mx-2 shrink-0"
          dotClassName="size-2"
        />
      )}
      {editing ? (
        <Input
          autoFocus
          defaultValue={tag}
          aria-label={`New name for ${tag}`}
          maxLength={TAG_LIMIT}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={(e) => {
            onRename(e.currentTarget.value);
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (onRename(e.currentTarget.value)) setEditing(false);
            } else if (e.key === 'Escape') {
              // closes the field, not the dialog
              e.stopPropagation();
              setEditing(false);
            }
          }}
          className="-ml-1.75 h-7 min-w-0 flex-1 px-1.5 text-base"
        />
      ) : (
        <span className="min-w-0 flex-1 truncate text-base text-ink">
          {tag}
        </span>
      )}
      {!readOnly && !editing && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Rename tag ${tag}`}
          onClick={() => setEditing(true)}
          className="text-ink-subtle"
        >
          <Pencil className="size-3.5" />
        </Button>
      )}
      {!readOnly && (
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
      )}
    </li>
  );
};
