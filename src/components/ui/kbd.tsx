import * as React from 'react';

import { cn } from '@/lib/utils';

/** Keyboard hint: ⌘ · K · esc · ↵ */
function Kbd({ className, ...props }: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        'inline-grid h-5 min-w-5 place-items-center rounded-sm border border-line bg-surface px-1.25 font-mono text-2xs text-ink-muted',
        className,
      )}
      {...props}
    />
  );
}

export { Kbd };
