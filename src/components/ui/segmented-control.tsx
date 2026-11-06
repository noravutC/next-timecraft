'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  /** null = nothing picked (e.g. no estimate yet) */
  value: T | null;
  onChange: (next: T) => void;
  'aria-label': string;
  /** Stretch options to fill the row (AI model picker). */
  fill?: boolean;
  className?: string;
  optionClassName?: string;
}

/** Single choice as a gray track with the picked option raised in white. */
function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  fill = false,
  className,
  optionClassName,
  ...props
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={props['aria-label']}
      className={cn(
        'inline-flex gap-0.5 rounded-lg bg-surface-hover p-0.5',
        fill && 'flex w-full',
        className,
      )}
    >
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-7 cursor-pointer rounded-md px-3 text-sm font-medium text-ink-subtle transition-colors outline-none hover:text-ink focus-visible:ring-3 focus-visible:ring-ink/10',
              checked && 'bg-background text-ink shadow-segment',
              fill && 'flex-1',
              optionClassName,
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export { SegmentedControl };
