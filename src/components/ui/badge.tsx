import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// Chips from the UI kit: counts are round 18px, status chips 22px.
const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1.25 overflow-hidden rounded-full whitespace-nowrap transition-colors [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        /** solid ink count, e.g. active filter count */
        default: 'h-4.5 min-w-4.5 bg-ink px-1.25 text-2xs text-white',
        /** quiet count, e.g. comments tab */
        count:
          'h-4.5 min-w-4.5 bg-surface-active px-1.25 text-2xs text-ink-muted',
        /** brand count, e.g. unread mentions */
        brand:
          'h-5 bg-brand-soft px-1.75 text-2xs font-semibold text-brand-dark',
        outline: 'h-5.5 border border-line px-2 text-xs text-ink-muted',
        secondary: 'h-5.5 bg-surface-hover px-2 text-xs text-ink-muted',
        success:
          'h-5.5 bg-success-soft px-2 text-xs font-medium text-success-text',
        warning:
          'h-5.5 bg-warning-tint px-2 text-xs font-medium text-tone-orange-fg',
        destructive:
          'h-5.5 bg-danger-soft px-2 text-xs font-medium text-danger-text',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
