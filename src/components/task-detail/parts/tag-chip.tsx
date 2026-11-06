'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hashTagColor, paletteFor } from '@/lib/project-settings/tag-palette';
import type { ProjectSettings } from '@/types/project-settings';
import { Button } from '@/components/ui/button';

interface TagChipProps {
  tag: string;
  tagColors: Required<ProjectSettings>['tagColors'];
  onRemove?: () => void;
  /** sm 22px (cards) · md 24px (task sheet) */
  size?: 'sm' | 'md';
}

/** A label: color dot + name on a hairline pill. */
export const TagChip = ({
  tag,
  tagColors,
  onRemove,
  size = 'md',
}: TagChipProps) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full border border-line text-xs text-ink-muted',
      size === 'sm' ? 'h-5.5 px-2' : 'h-6 px-2.25',
      onRemove && 'gap-1 pr-1',
    )}
  >
    <span
      className="mr-0.5 size-1.5 shrink-0 rounded-full"
      style={{
        backgroundColor: paletteFor(tagColors[tag] ?? hashTagColor(tag)).value,
      }}
    />
    {tag}
    {onRemove && (
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onRemove}
        aria-label={`Remove label ${tag}`}
        className="size-4.5 rounded-full text-ink-subtle"
      >
        <X className="size-3" />
      </Button>
    )}
  </span>
);
