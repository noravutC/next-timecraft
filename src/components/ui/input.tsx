import * as React from 'react';

import { cn } from '@/lib/utils';
interface InputProps extends React.ComponentProps<'input'> {
  /** sm 32 (toolbars) · md/default 36 (forms) · lg 38 (dialogs) */
  inputSize?: 'sm' | 'md' | 'lg' | 'default';
}
function Input({ inputSize = 'sm', className, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex w-full min-w-0 rounded-md border border-input bg-background text-base text-ink transition-[border-color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-ink-subtle disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-ink focus-visible:ring-3 focus-visible:ring-ink/8',
        'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/10',
        inputSize === 'sm' && 'h-8 px-2.5 text-sm',
        inputSize === 'md' && 'h-9 px-3',
        inputSize === 'lg' && 'h-9.5 px-3',
        inputSize === 'default' && 'h-9 px-3',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
