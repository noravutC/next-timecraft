'use client';

import { CalendarClock, Check, Circle, X } from 'lucide-react';
import { UserAvatar } from '@/components/people/user-avatar';
import { ProjectAvatar } from '@/components/project/project-avatar';
import { Button } from '@/components/ui/button';
import {
  formatNotificationTime,
  notificationBoard,
  notificationParts,
} from '@/helper/utils/notification-view';
import { cn } from '@/lib/utils';
import type { CommentNotificationPayload, Notification } from '@/types';

interface NotificationRowProps {
  notification: Notification;
  actorAvatar: string | null;
  onOpen: () => void;
  onToggleRead: () => void;
  onDismiss: () => void;
}

/** One notification: who did what, the comment, its board and time. */
export const NotificationRow = ({
  notification: n,
  actorAvatar,
  onOpen,
  onToggleRead,
  onDismiss,
}: NotificationRowProps) => {
  const unread = !n.readAt;
  const parts = notificationParts(n);
  const board = notificationBoard(n);
  const snippet = (n.payload as Partial<CommentNotificationPayload>).snippet;

  return (
    <li className="group flex items-start gap-3 rounded-lg px-3 py-3 hover:bg-surface">
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
      <Button
        variant="ghost"
        size={null}
        onClick={onOpen}
        className="h-auto min-w-0 flex-1 flex-col items-start gap-1.5 p-0 text-left font-normal whitespace-normal hover:bg-transparent"
      >
        <span className="text-base text-ink-muted">
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
        {snippet && (
          <span className="w-full rounded-md bg-surface-hover px-2.5 py-1.5 text-sm text-ink-muted">
            {snippet}
          </span>
        )}
        <span className="flex items-center gap-1.5 text-xs text-ink-subtle">
          {board && (
            <>
              <ProjectAvatar
                project={{ name: board.name, coverImage: null, settings: null }}
                size="size-3.5"
                rounded="rounded-xs"
                textSize="text-4xs"
              />
              {board.name}
              <span aria-hidden>·</span>
            </>
          )}
          {formatNotificationTime(new Date(n.createdAt))}
        </span>
      </Button>
      <span className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleRead}
          aria-label={unread ? 'Mark as read' : 'Mark as unread'}
          className="text-ink-subtle"
        >
          {unread ? (
            <Check className="size-3.75" />
          ) : (
            <Circle className="size-2.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="text-ink-subtle"
        >
          <X className="size-3.75" />
        </Button>
        <span
          aria-label={unread ? 'Unread' : undefined}
          className={cn(
            'ml-1 size-2 rounded-full',
            unread ? 'bg-brand' : 'bg-transparent',
          )}
        />
      </span>
    </li>
  );
};
