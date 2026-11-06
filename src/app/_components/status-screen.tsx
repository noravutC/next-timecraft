import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type StatusTone = 'danger' | 'neutral';

const TILE_STYLES: Record<StatusTone, string> = {
  danger: 'bg-danger-soft text-danger-text',
  neutral: 'border border-line text-ink-muted',
};

interface StatusScreenProps {
  tone: StatusTone;
  icon: ReactNode;
  title: string;
  description: string;
  /** The one way forward: Try again, Go to my boards. */
  action: ReactNode;
}

/** Full-page message for error and not-found routes. */
export const StatusScreen = ({
  tone,
  icon,
  title,
  description,
  action,
}: StatusScreenProps) => (
  <main className="flex min-h-screen flex-col items-center justify-center gap-2.5 bg-background px-6 text-center">
    <span
      className={cn(
        'grid size-9 place-items-center rounded-lg [&_svg]:size-4',
        TILE_STYLES[tone],
      )}
    >
      {icon}
    </span>
    <h1 className="text-md font-semibold text-ink">{title}</h1>
    <p className="text-sm text-ink-subtle">{description}</p>
    <div className="mt-1">{action}</div>
  </main>
);
