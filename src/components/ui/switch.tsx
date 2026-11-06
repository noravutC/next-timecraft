'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

interface SwitchProps extends Omit<
  React.ComponentProps<'button'>,
  'onChange' | 'value'
> {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}

/** 36×20 on/off toggle: gray when off, ink when on. */
function Switch({
  checked,
  onCheckedChange,
  className,
  ...props
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={checked ? 'checked' : 'unchecked'}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative h-5 w-9 shrink-0 cursor-pointer rounded-full bg-line-strong transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ink/10 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-ink',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          'absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-knob transition-transform',
          checked && 'translate-x-4',
        )}
      />
    </button>
  );
}

export { Switch };
