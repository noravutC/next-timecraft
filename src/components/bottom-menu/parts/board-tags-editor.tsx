'use client';

import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TagChip } from '@/components/task-detail/parts/tag-chip';
import { TAG_LIMIT, TAG_PALETTE } from '@/lib/project-settings/constants';
import { FieldLabel } from './field-label';

/** ส่วน Tags ของ Board settings: ลิสต์ chip, ช่องเพิ่ม tag, เลือกสีของ tag ถัดไป */
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
}) => (
  <div className="mt-5">
    <FieldLabel>Tags</FieldLabel>
    {tags.length > 0 && (
      <div className="mb-2.5 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <TagChip
            key={tag}
            tag={tag}
            tagColors={tagColors}
            size="sm"
            onRemove={() => onRemoveTag(tag)}
          />
        ))}
      </div>
    )}
    <div className="flex gap-2">
      <div className="relative flex-1">
        <span
          className="pointer-events-none absolute top-1/2 left-3 size-2 -translate-y-1/2 rounded-full"
          style={{ backgroundColor: nextTagColor }}
        />
        <Input
          inputSize="md"
          value={draftTag}
          onChange={(e) => onDraftTagChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAddTag();
            }
          }}
          placeholder="Add a tag…"
          maxLength={TAG_LIMIT}
          className="rounded-lg border-line bg-surface pl-7 text-sm shadow-none placeholder:text-ink-faint focus-visible:bg-white"
        />
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={onAddTag}
        disabled={!draftTag.trim()}
        className="h-9 gap-1 rounded-lg"
      >
        <Plus className="size-3.5" />
        Add tag
      </Button>
    </div>
    {/* เลือกสีก่อนสร้าง — จุดสีหน้า input พรีวิวสีที่ tag ใหม่จะได้ */}
    <div className="mt-2.5 flex flex-wrap gap-2">
      {TAG_PALETTE.map((option) => {
        const isActive = nextTagColor === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onPickNextColor(option.value)}
            aria-pressed={isActive}
            aria-label={`Next tag color ${option.value}`}
            className={cn(
              'size-5 cursor-pointer rounded-full transition-transform hover:scale-110',
              isActive &&
                'ring-2 ring-brand ring-offset-2 ring-offset-background',
            )}
            style={{ backgroundColor: option.value }}
          />
        );
      })}
    </div>
  </div>
);
