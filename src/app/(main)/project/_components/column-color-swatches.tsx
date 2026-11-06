'use client';

import { Button } from '@/components/ui/button';
import { COLUMN_COLORS } from '@/lib/project-settings/constants';
import { cn } from '@/lib/utils';

/** Eight solid dots; the picked one gets a ring. */
export const ColumnColorSwatches = ({
  value,
  onChange,
  label,
}: {
  value: string | undefined;
  onChange: (color: string) => void;
  label: string;
}) => (
  <div role="radiogroup" aria-label={label} className="flex gap-1.5">
    {COLUMN_COLORS.map((option) => {
      const selected = option.value.toLowerCase() === value?.toLowerCase();
      return (
        <Button
          key={option.value}
          type="button"
          variant="ghost"
          role="radio"
          aria-checked={selected}
          aria-label={option.label}
          onClick={() => onChange(option.value)}
          className={cn(
            'size-5 rounded-full p-0 hover:opacity-90',
            selected && 'ring-2 ring-ink ring-offset-2 ring-offset-background',
          )}
          style={{ backgroundColor: option.value }}
        />
      );
    })}
  </div>
);
