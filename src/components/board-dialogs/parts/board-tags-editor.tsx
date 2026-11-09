'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TAG_LIMIT } from '@/lib/project-settings/constants';
import { hashTagColor, paletteFor } from '@/lib/project-settings/tag-palette';
import { BoardTagRow } from './board-tag-row';
import { TagColorPicker } from './tag-color-picker';

/** Tags tab of Board settings: add field (with next color) + the tag list. */
export const BoardTagsEditor = ({
  tags,
  tagColors,
  nextTagColor,
  draftTag,
  onDraftTagChange,
  onAddTag,
  onSaveTag,
  tagUses,
  onRemoveTag,
  onPickNextColor,
  readOnly = false,
}: {
  tags: string[];
  tagColors: Record<string, string>;
  nextTagColor: string;
  draftTag: string;
  onDraftTagChange: (value: string) => void;
  onAddTag: () => void;
  /** a tag's new name and color; false when the name is refused */
  onSaveTag: (tag: string, name: string, color: string) => boolean;
  /** how many tasks use a tag */
  tagUses: (tag: string) => number;
  onRemoveTag: (tag: string) => void;
  onPickNextColor: (color: string) => void;
  /** editors and viewers: the list only */
  readOnly?: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  // ช่องว่างแล้วกด Add tag → พาไปที่ช่องพิมพ์แทนการเงียบ
  const submit = () =>
    draftTag.trim() ? onAddTag() : inputRef.current?.focus();

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-5 text-ink-subtle">
        Labels members can add to tasks on this board. Renaming a tag updates
        every task that uses it.
      </p>

      {!readOnly && (
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <TagColorPicker
              value={nextTagColor}
              onChange={onPickNextColor}
              label="Color for the new tag"
              className="absolute top-1/2 left-1.5 -translate-y-1/2"
            />
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
      )}

      {tags.length > 0 ? (
        <ul className="flex flex-col overflow-hidden rounded-popover border border-line">
          {tags.map((tag, index) => (
            <BoardTagRow
              key={tag}
              tag={tag}
              color={paletteFor(tagColors[tag] ?? hashTagColor(tag)).value}
              first={index === 0}
              readOnly={readOnly}
              uses={tagUses(tag)}
              onSave={(name, color) => onSaveTag(tag, name, color)}
              onRemove={() => onRemoveTag(tag)}
            />
          ))}
        </ul>
      ) : (
        <p className="rounded-popover border border-dashed border-input px-4 py-6 text-center text-sm text-ink-subtle">
          {readOnly ? 'No tags yet.' : 'No tags yet. Add the first one above.'}
        </p>
      )}
    </div>
  );
};
