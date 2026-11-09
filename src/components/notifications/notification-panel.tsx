'use client';

import { useState } from 'react';
import { CheckCheck } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotificationStore } from '@/store/use-notification.store';
import { useUserStore } from '@/store';
import {
  filterNotifications,
  notificationTabCounts,
  type NotificationTab,
} from '@/helper/utils/notification-view';
import { NotificationList } from './notification-list';
import { useOpenNotification } from './use-open-notification';

const TAB_LABELS: Record<NotificationTab, string> = {
  all: 'All',
  unread: 'Unread',
  mentions: 'Mentions',
};
const TABS = Object.keys(TAB_LABELS) as NotificationTab[];

/** Popover body: title + mark all read, filter chips, the list. */
export const NotificationPanel = ({
  onNavigate,
}: {
  /** called when a notification takes the user somewhere (closes the popover) */
  onNavigate: () => void;
}) => {
  const { items, unreadCount, hasMore, status } = useNotificationStore(
    useShallow((s) => ({
      items: s.items,
      unreadCount: s.unreadCount,
      hasMore: s.hasMore,
      status: s.status,
    })),
  );
  const fetchMore = useNotificationStore((s) => s.fetchMore);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const users = useUserStore(useShallow((s) => s.users));
  const openNotification = useOpenNotification(onNavigate);
  const [tab, setTab] = useState<NotificationTab>('all');

  const counts = notificationTabCounts(items, unreadCount);

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as NotificationTab)}
      className="min-h-0 flex-1 gap-0"
    >
      <div className="flex items-center gap-2 pt-3.5 pr-3 pb-2.5 pl-4">
        <h2 className="text-md font-semibold text-ink">Notifications</h2>
        {unreadCount > 0 && (
          <Badge variant="brand" className="min-w-5 px-1.5">
            {unreadCount}
          </Badge>
        )}
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="xs"
          onClick={() => void markAllRead()}
          disabled={unreadCount === 0}
          className="gap-1.5"
        >
          <CheckCheck className="size-3.5" />
          Mark all read
        </Button>
      </div>

      <TabsList
        variant="pill"
        aria-label="Filter notifications"
        className="border-b border-line px-3 pb-2.5"
      >
        {TABS.map((key) => (
          <TabsTrigger key={key} value={key} className="group">
            {TAB_LABELS[key]}
            <span className="font-mono text-2xs text-ink-subtle group-data-[state=active]:text-line-strong">
              {counts[key]}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {TABS.map((key) => (
        <TabsContent
          key={key}
          value={key}
          className="scrollbar-thin-y scrollbar-light min-h-0 overflow-y-auto p-1"
        >
          <NotificationList
            items={filterNotifications(items, key)}
            avatarOf={(userId) => users[userId]?.avatar ?? null}
            hasMore={hasMore}
            loading={status === 'fetching'}
            onLoadMore={() => void fetchMore()}
            onOpen={(n) => void openNotification(n)}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
};
