'use client';

import { LoaderCircle, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConnectionStatus } from './use-connection-status';

/** In the header while offline or while live updates reconnect. */
export const ConnectionPill = () => {
  const status = useConnectionStatus();
  if (status === 'online') return null;
  const offline = status === 'offline';
  return (
    <span
      role="status"
      className={cn(
        'inline-flex h-6.5 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium',
        offline
          ? 'border-line bg-surface-hover text-ink-muted'
          : 'border-warning-line bg-warning-soft text-warning',
      )}
    >
      {offline ? (
        <WifiOff className="size-3.5" />
      ) : (
        <LoaderCircle className="size-3.5 animate-spin" />
      )}
      {/* the whole sentence where there's room */}
      <span className="lg:hidden">{offline ? 'Offline' : 'Reconnecting…'}</span>
      <span className="hidden lg:inline">
        {offline
          ? 'Offline. Changes won’t save until you’re back.'
          : 'Reconnecting live updates…'}
      </span>
    </span>
  );
};
