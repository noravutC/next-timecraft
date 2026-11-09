'use client';

import { CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/people/user-avatar';
import {
  formatNotificationTime,
  notificationParts,
} from '@/helper/utils/notification-view';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types';

interface NotificationItemProps {
  notification: Notification;
  actorAvatar: string | null;
  onOpen: (n: Notification) => void;
}

export const NotificationItem = ({
  notification: n,
  actorAvatar,
  onOpen,
}: NotificationItemProps) => {
  const unread = !n.readAt;
  const parts = notificationParts(n);
  return (
    <Button
      variant="ghost"
      size={null}
      onClick={() => onOpen(n)}
      className="h-auto w-full items-start justify-start gap-3 rounded-lg px-3 py-2.5 text-left font-normal whitespace-normal hover:bg-surface focus-visible:bg-surface"
    >
      {parts.system ? (
        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-warning-line bg-warning-soft text-warning">
          <CalendarClock className="size-4" />
        </span>
      ) : (
        <UserAvatar
          name={n.payload.actorName}
          image={actorAvatar}
          seed={n.payload.actorUserId}
          size="xl"
        />
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm leading-4.75 text-pretty text-ink-muted">
          {!parts.system && (
            <>
              <strong className="font-semibold text-ink">
                {n.payload.actorName}
              </strong>{' '}
              {parts.before}{' '}
            </>
          )}
          <strong className="font-medium text-ink">{parts.strong}</strong>
          {parts.after && ` ${parts.after}`}
        </span>
        <span className="text-xs leading-5 text-ink-subtle">
          {formatNotificationTime(new Date(n.createdAt))}
        </span>
      </span>
      <span
        aria-label={unread ? 'Unread' : 'Read'}
        className={cn(
          'mt-1.5 size-2 shrink-0 rounded-full',
          unread ? 'bg-brand' : 'bg-transparent',
        )}
      />
    </Button>
  );
};
