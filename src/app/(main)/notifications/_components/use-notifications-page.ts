'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { NotificationKind } from '@/helper/utils/notification-view';
import {
  notificationServices,
  type NotificationCounts,
} from '@/services/notification.service';
import { useNotificationStore } from '@/store/use-notification.store';
import type { Notification } from '@/types';

const PAGE_SIZE = 20;

// the bell keeps its own first page: refresh it after changes made here
const refreshBell = () => void useNotificationStore.getState().fetchInitial();

/** The full list: one chip and one board at a time, a page at a time. */
export function useNotificationsPage() {
  const [kind, setKind] = useState<NotificationKind>('all');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [items, setItems] = useState<Notification[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [counts, setCounts] = useState<NotificationCounts | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(
    async (from: string | null) => {
      const { data } = await notificationServices.fetchFiltered({
        cursor: from,
        limit: PAGE_SIZE,
        kind,
        projectId,
      });
      setItems((prev) =>
        from && prev ? [...prev, ...data.items] : data.items,
      );
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
      setUnreadCount(data.unreadCount);
      if (data.counts) setCounts(data.counts);
    },
    [kind, projectId],
  );

  useEffect(() => {
    setItems(null);
    load(null).catch(() => toast.error('Couldn’t load notifications'));
  }, [load]);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      await load(cursor);
    } finally {
      setLoadingMore(false);
    }
  };

  // optimistic: the row changes at once, the list reloads if it fails
  const change = async (
    apply: (list: Notification[]) => Notification[],
    run: () => Promise<unknown>,
  ) => {
    setItems((list) => list && apply(list));
    try {
      await run();
      refreshBell();
    } catch {
      toast.error('Couldn’t update notifications');
      void load(null);
    }
  };

  const setRead = (n: Notification, read: boolean) => {
    setUnreadCount((count) => count + (read ? -1 : 1));
    return change(
      (list) =>
        list.map((item) =>
          item.id === n.id
            ? { ...item, readAt: read ? new Date() : null }
            : item,
        ),
      () =>
        read
          ? notificationServices.markRead([n.id])
          : notificationServices.markUnread([n.id]),
    );
  };

  return {
    kind,
    setKind,
    projectId,
    setProjectId,
    items,
    hasMore,
    loadingMore,
    loadMore,
    counts,
    unreadCount,
    setRead,
    /** shows it read here; opening it already told the server */
    markOpened: (n: Notification) => {
      if (n.readAt) return;
      setUnreadCount((count) => count - 1);
      setItems(
        (list) =>
          list &&
          list.map((item) =>
            item.id === n.id ? { ...item, readAt: new Date() } : item,
          ),
      );
    },
    dismiss: (n: Notification) => {
      if (!n.readAt) setUnreadCount((count) => count - 1);
      return change(
        (list) => list.filter((item) => item.id !== n.id),
        () => notificationServices.dismiss([n.id]),
      );
    },
    markAllRead: () => {
      setUnreadCount(0);
      return change(
        (list) =>
          list.map((item) => ({ ...item, readAt: item.readAt ?? new Date() })),
        () => notificationServices.markAllRead(),
      );
    },
  };
}
