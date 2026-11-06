'use client';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { TAG_PALETTE } from '@/lib/project-settings/constants';

/** A tag's color dot; click it to pick another color. */
export const TagColorPicker = ({
  value,
  onChange,
  label,
  className,
  dotClassName,
}: {
  value: string;
  onChange: (color: string) => void;
  label: string;
  /** where the trigger sits */
  className?: string;
  dotClassName?: string;
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={label}
        className={cn('size-6 rounded-full hover:bg-surface-hover', className)}
      >
        <span
          className={cn('size-2.5 rounded-full', dotClassName)}
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
