'use client';

import { useMemo, useState } from 'react';
import { Plus, Tag as TagIcon, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ProjectSettings } from '@/types/project-settings';
import { TAG_LIMIT, TAG_PALETTE } from '../_lib/constants';
import { hashTagColor, paletteFor } from '../_lib/tag-palette';
import { SectionCard } from './section-card';

interface TagsSectionProps {
  projectTags: string[];
  settings: Required<ProjectSettings>;
  updateSettings: (next: Partial<ProjectSettings>) => void;
  setTagColor: (tag: string, color: string) => void;
  dropTagColor: (tag: string) => void;
  commitTags: (tags: string[]) => void;
}

export const TagsSection = ({
  projectTags,
  settings,
  updateSettings,
  setTagColor,
  dropTagColor,
  commitTags,
}: TagsSectionProps) => {
  const [tags, setTags] = useState<string[]>(projectTags);
  const [draftTag, setDraftTag] = useState('');

  const tagHint = useMemo(
    () =>
      tags.length === 0
        ? 'No tags yet'
        : `${tags.length} tag${tags.length === 1 ? '' : 's'}`,
    [tags.length],
  );

  const addTag = () => {
    const next = draftTag.trim();
    if (!next) return;
    if (tags.some((t) => t.toLowerCase() === next.toLowerCase())) {
      toast.error('This tag already exists');
      return;
    }
    if (next.length > TAG_LIMIT) {
      toast.error(`Tags must be ${TAG_LIMIT} characters or fewer`);
      return;
    }
    const updated = [...tags, next];
    setTags(updated);
    setDraftTag('');
    setTagColor(next, settings.nextTagColor);
    commitTags(updated);
  };

  const removeTag = (tag: string) => {
    const updated = tags.filter((t) => t !== tag);
    setTags(updated);
    dropTagColor(tag);
    commitTags(updated);
  };

  return (
    <SectionCard icon={TagIcon} title="Tags" hint={tagHint}>
      <div className="space-y-3">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <AnimatePresence initial={false}>
              {tags.map((tag) => {
                const tagPalette = paletteFor(
                  settings.tagColors[tag] ?? hashTagColor(tag),
                );
                return (
                  <motion.span
                    key={tag}
                    layout
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.15 }}
                    className="inline-flex items-center gap-1.5 rounded-full border py-0.5 pr-1 pl-2.5 text-xs font-medium"
                    style={{
                      backgroundColor: tagPalette.bg,
                      borderColor: tagPalette.border,
                      color: tagPalette.text,
                    }}
                  >
                    <span
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: tagPalette.value }}
                    />
                    <span className="select-none">{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      aria-label={`Remove ${tag}`}
                      className="ml-0.5 flex size-4 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                      style={{ color: tagPalette.text }}
                    >
                      <X className="size-3" strokeWidth={2.5} />
                    </button>
                  </motion.span>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <span
              className="pointer-events-none absolute top-1/2 left-2.5 size-2 -translate-y-1/2 rounded-full"
              style={{ backgroundColor: settings.nextTagColor }}
            />
            <Input
              inputSize="sm"
              value={draftTag}
              onChange={(e) => setDraftTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="New tag name"
              className="pl-6 text-sm"
              maxLength={TAG_LIMIT}
            />
          </div>
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={addTag}
            disabled={!draftTag.trim()}
            className="size-8 shrink-0"
            aria-label="Add tag"
          >
            <Plus className="size-3.5" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {TAG_PALETTE.map((option) => {
            const isActive = settings.nextTagColor === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => updateSettings({ nextTagColor: option.value })}
                aria-pressed={isActive}
                className={cn(
                  'size-6 rounded-full transition-transform duration-150 hover:scale-110',
                  isActive &&
                    'ring-2 ring-foreground ring-offset-2 ring-offset-card',
                )}
                style={{ backgroundColor: option.value }}
              />
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
};
