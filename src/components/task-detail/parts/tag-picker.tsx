'use client';

import { useMemo, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { hashTagColor, paletteFor } from '@/lib/project-settings/tag-palette';
import type { ProjectSettings } from '@/types/project-settings';

interface TagPickerProps {
  projectTags: string[];
  selectedTags: string[];
  tagColors: Required<ProjectSettings>['tagColors'];
  onChange: (next: string[]) => void;
  trigger?: React.ReactNode;
}

export const TagPicker = ({
  projectTags,
  selectedTags,
  tagColors,
  onChange,
  trigger,
}: TagPickerProps) => {
  const [query, setQuery] = useState('');
  const selectedSet = useMemo(() => new Set(selectedTags), [selectedTags]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projectTags;
    return projectTags.filter((t) => t.toLowerCase().includes(q));
  }, [query, projectTags]);

  const toggle = (tag: string) => {
    const next = selectedSet.has(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    onChange(next);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="xs"
            className="h-6 gap-1 px-2 font-normal text-ink-subtle"
          >
            <Plus className="size-3.25" />
            Add label
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <div className="border-b border-line-soft p-1.5">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search labels"
            aria-label="Search labels"
            className="h-7.5 border-0 px-2 focus-visible:ring-0"
          />
        </div>
        <div className="max-h-56 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-2 py-2 text-sm text-ink-subtle">
              {projectTags.length === 0
                ? 'No labels on this board yet'
                : 'No labels match'}
            </p>
          ) : (
            filtered.map((tag) => (
              <Button
                key={tag}
                variant="ghost"
                role="menuitemcheckbox"
                aria-checked={selectedSet.has(tag)}
                onClick={() => toggle(tag)}
                className="h-8 w-full justify-start gap-2.5 px-2 font-normal text-ink"
              >
                <span
                  className="mx-0.75 size-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: paletteFor(
                      tagColors[tag] ?? hashTagColor(tag),
                    ).value,
                  }}
                />
                <span className="flex-1 truncate text-left">{tag}</span>
                {selectedSet.has(tag) && <Check className="size-3.75" />}
              </Button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
