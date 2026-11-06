'use client';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { TAG_PALETTE } from '@/lib/project-settings/constants';

/** The color dot inside the "Add a tag" field; click it to pick the next tag's color. */
export const TagColorPicker = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Color for the new tag"
        className="absolute top-1/2 left-1.5 size-6 -translate-y-1/2 rounded-full hover:bg-surface-hover"
      >
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: value }}
        />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" className="w-auto p-2">
      <div
        role="radiogroup"
        aria-label="Tag color"
        className="grid grid-cols-4 gap-1.5"
      >
        {TAG_PALETTE.map((option) => {
          const selected = option.value === value;
          return (
            <Button
              key={option.value}
              type="button"
              variant="ghost"
              role="radio"
              aria-checked={selected}
              aria-label={`Tag color ${option.value}`}
              onClick={() => onChange(option.value)}
              className={cn(
                'size-6 rounded-full p-0 hover:opacity-80',
                selected &&
                  'ring-2 ring-ink ring-offset-2 ring-offset-background',
              )}
              style={{ backgroundColor: option.value }}
            />
          );
        })}
      </div>
    </PopoverContent>
  </Popover>
);
