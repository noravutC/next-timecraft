import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type InviteTileTone = 'outline' | 'warning';

const TONE_STYLES: Record<InviteTileTone, string> = {
  outline: 'border border-line text-ink-muted',
  warning: 'bg-warning-tint text-tone-orange-fg',
};

interface InviteTileProps {
  tone: InviteTileTone;
  children: ReactNode;
}

/** 44px icon tile at the top of an invitation card. */
export const InviteTile = ({ tone, children }: InviteTileProps) => (
  <span
    className={cn(
      'grid size-11 place-items-center rounded-popover [&_svg]:size-5',
      TONE_STYLES[tone],
    )}
  >
    {children}
  </span>
);
