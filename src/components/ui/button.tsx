import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// Heights: xs 28 · sm 32 (toolbars) · default 34 (dialog footers) · lg 40.
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-3 focus-visible:ring-ink/10 disabled:pointer-events-none aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary/85 disabled:border disabled:border-line disabled:bg-surface-active disabled:text-ink-faint',
        destructive:
          'bg-destructive text-white hover:bg-danger-text focus-visible:ring-destructive/20 disabled:border disabled:border-danger-line disabled:bg-danger-soft disabled:text-danger-muted',
        outline:
          'border border-input bg-background text-ink hover:border-line-strong hover:bg-surface disabled:opacity-50',
        secondary:
          'bg-surface-hover text-ink hover:bg-surface-active disabled:opacity-50',
        ghost:
          'text-ink-muted hover:bg-surface-hover hover:text-ink disabled:opacity-50',
        link: 'text-ink underline-offset-3 hover:underline disabled:opacity-50',
        white:
          'border bg-white text-gray-800 shadow-sm hover:bg-gray-100 disabled:opacity-50',
      },
      size: {
        default: 'h-8.5 px-3.5 has-[>svg]:px-3',
        xs: 'h-7 gap-1 px-2.5 text-xs has-[>svg]:px-2',
        sm: 'h-8 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-lg px-4.5 text-base',
        icon: 'size-8',
        'icon-sm': 'size-7',
        'icon-xs': 'size-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
