import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-base text-ink transition-[border-color,box-shadow] outline-none placeholder:text-ink-subtle focus-visible:border-ink focus-visible:ring-3 focus-visible:ring-ink/8 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/10',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
