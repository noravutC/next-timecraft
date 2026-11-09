'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import type { Notification } from '@/types';
import { NotificationItem } from './notification-item';

interface NotificationListProps {
  items: Notification[];
  avatarOf: (userId: string) => string | null;
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  onOpen: (n: Notification) => void;
}

export const NotificationList = ({
  items,
  avatarOf,
  hasMore,
  loading,
  onLoadMore,
  onOpen,
}: NotificationListProps) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1.5 px-4 py-12 text-center">
        <span className="grid size-9 place-items-center rounded-lg border border-line text-ink-subtle">
          <Bell className="size-4" />
        </span>
        <span className="text-base font-medium text-ink">
          You&rsquo;re all caught up
        </span>
        <span className="text-sm text-ink-subtle">No notifications here.</span>
      </div>
    );
  }

  return (
    <ul className="flex flex-col">
      {items.map((n) => (
        <li key={n.id}>
          <NotificationItem
            notification={n}
            actorAvatar={avatarOf(n.payload.actorUserId)}
            onOpen={onOpen}
          />
        </li>
      ))}
      {hasMore && (
        <li className="flex justify-center py-1.5">
          <Button
            variant="ghost"
            size="xs"
            onClick={onLoadMore}
            disabled={loading}
          >
            {loading ? <Loader size="xs" /> : 'Load more'}
          </Button>
        </li>
      )}
    </ul>
  );
};
