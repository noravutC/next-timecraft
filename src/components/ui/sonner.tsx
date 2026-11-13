'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, ToasterProps } from 'sonner';

// Toasts from the UI kit: white card with an outline action (Undo);
// success reads as a solid ink bar.
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      // an open sheet or dialog makes the rest of the page inert: a toast
      // and its button must still take a click
      className="toaster group pointer-events-auto"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex w-85 max-w-[calc(100vw-2rem)] items-center gap-3 rounded-popover border border-line bg-background py-3 pr-3 pl-4 text-sm text-ink shadow-toast',
          title: 'font-normal',
          content: 'flex flex-1 flex-col gap-0.5',
          description: 'text-xs text-ink-subtle',
          icon: 'text-ink-subtle [&>svg]:size-4',
          actionButton:
            'h-7 shrink-0 cursor-pointer rounded-md border border-input bg-background px-2.5 text-xs font-medium text-ink hover:border-line-strong hover:bg-surface',
          cancelButton:
            'h-7 shrink-0 cursor-pointer rounded-md px-2.5 text-xs font-medium text-ink-muted hover:bg-surface-hover',
          success: 'border-ink bg-ink text-white [&_[data-icon]]:text-success',
          error: '[&_[data-icon]]:text-destructive',
          warning:
            'border-warning-line bg-warning-soft text-warning-text [&_[data-icon]]:text-warning-text',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
