'use client';

import { useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TAG_LIMIT } from '@/lib/project-settings/constants';
import { hashTagColor, paletteFor } from '@/lib/project-settings/tag-palette';
import { TagColorPicker } from './tag-color-picker';

/** Tags tab of Board settings: add field (with next color) + the tag list. */
export const BoardTagsEditor = ({
  tags,
  tagColors,
  nextTagColor,
  draftTag,
  onDraftTagChange,
  onAddTag,
  onRemoveTag,
  onPickNextColor,
}: {
  tags: string[];
  tagColors: Record<string, string>;
  nextTagColor: string;
  draftTag: string;
  onDraftTagChange: (value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onPickNextColor: (color: string) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  // ช่องว่างแล้วกด Add tag → พาไปที่ช่องพิมพ์แทนการเงียบ
  const submit = () =>
    draftTag.trim() ? onAddTag() : inputRef.current?.focus();

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-5 text-ink-subtle">
        Labels members can add to tasks on this board. Up to {TAG_LIMIT}{' '}
        characters each.
      </p>

      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <TagColorPicker value={nextTagColor} onChange={onPickNextColor} />
          <Input
            ref={inputRef}
            inputSize="md"
            aria-label="New tag name"
            value={draftTag}
            onChange={(e) => onDraftTagChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Add a tag"
            maxLength={TAG_LIMIT}
            className="pl-8.5"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={submit}
          className="h-9"
        >
          Add tag
        </Button>
      </div>

      {tags.length > 0 ? (
        <ul className="flex flex-col overflow-hidden rounded-popover border border-line">
          {tags.map((tag, index) => (
            <li
              key={tag}
              className={cn(
                'flex h-10 items-center gap-2.5 pr-2 pl-3.5 hover:bg-surface',
                index > 0 && 'border-t border-line-soft',
              )}
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{
                  backgroundColor: paletteFor(
                    tagColors[tag] ?? hashTagColor(tag),
                  ).value,
                }}
              />
              <span className="min-w-0 flex-1 truncate text-base text-ink">
                {tag}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove tag ${tag}`}
                onClick={() => onRemoveTag(tag)}
                className="text-ink-subtle"
              >
                <X className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-popover border border-dashed border-input px-4 py-6 text-center text-sm text-ink-subtle">
          No tags yet. Add the first one above.
        </p>
      )}
    </div>
  );
};
