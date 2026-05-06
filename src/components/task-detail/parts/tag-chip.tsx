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
  size?: 'sm' | 'md';
}

export const TagChip = ({
  tag,
  tagColors,
  onRemove,
  size = 'md',
}: TagChipProps) => {
  const palette = paletteFor(tagColors[tag] ?? hashTagColor(tag));
  return (
    <Button
      variant={'ghost'}
      size={'xs'}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border font-semibold p-0',
        size === 'sm' ? 'px-3 text-xs' : 'text-sm',
      )}
      style={{
        backgroundColor: palette.bg,
        borderColor: palette.border,
        color: palette.text,
      }}
    >
      <span
        className={cn(
          'shrink-0 rounded-full',
          size === 'sm' ? 'size-2' : 'size-2.5',
        )}
        style={{ backgroundColor: palette.value }}
      />
      {tag}
      {onRemove && (
        <div
          onClick={onRemove}
          aria-label={`Remove ${tag}`}
          className="ml-0.5 text-foreground flex size-4 items-center justify-center rounded-full transition-colors bg-black/10 hover:bg-black/20"
        >
          <X className="size-2.5" />
        </div>
      )}
    </Button>
  );
};
