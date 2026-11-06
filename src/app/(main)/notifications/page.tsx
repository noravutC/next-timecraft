'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, SlidersHorizontal } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { AppHeader } from '@/components/app-header/app-header';
import { useOpenNotification } from '@/components/notifications/use-open-notification';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkspace } from '@/components/workspace/use-workspace-name';
import { groupNotificationsByDay } from '@/helper/utils/notification-view';
import { useProjectStore, useUserStore } from '@/store';
import { NotificationFilters } from './_components/notification-filters';
import { NotificationRow } from './_components/notification-row';
import { useNotificationsPage } from './_components/use-notifications-page';

export default function NotificationsPage() {
  const workspace = useWorkspace();
  const page = useNotificationsPage();
  const openNotification = useOpenNotification(() => {});
  const users = useUserStore(useShallow((s) => s.users));
  const fetchUsers = useUserStore((s) => s.fetchUsers);
  const projects = useProjectStore((s) => s.projects);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const boards = Object.values(projects).map((p) => ({
    id: p.id,
    name: p.name,
  }));

  // the board filter lists your boards; this page may be the first one open
  useEffect(() => {
    if (Object.keys(useProjectStore.getState().projects).length === 0) {
      fetchProjects([], true).catch(() => {});
    }
  }, [fetchProjects]);

  useEffect(() => {
    if (page.items) {
      void fetchUsers(page.items.map((n) => n.payload.actorUserId));
    }
  }, [page.items, fetchUsers]);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background">
      <AppHeader workspace={workspace} current="Notifications" />
      <main className="mx-auto flex w-full max-w-195 flex-col gap-5 px-5 pt-10 pb-16">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Notifications
          </h1>
          {page.unreadCount > 0 && (
            <Badge variant="brand">{page.unreadCount} unread</Badge>
          )}
          <span className="flex-1" />
          <Button
            variant="outline"
            onClick={() => void page.markAllRead()}
            disabled={page.unreadCount === 0}
          >
            <CheckCheck className="size-3.75" />
            Mark all read
          </Button>
          <Button variant="outline" asChild>
            <Link href="/settings/notifications">
              <SlidersHorizontal className="size-3.75" />
              Settings
            </Link>
          </Button>
        </div>

        <NotificationFilters
          kind={page.kind}
          onKind={page.setKind}
          counts={page.counts}
          boards={boards}
          projectId={page.projectId}
          onProject={page.setProjectId}
        />

        {!page.items && <Skeleton className="h-60 w-full rounded-popover" />}

        {page.items?.length === 0 && (
          <div className="flex flex-col items-center gap-1.5 py-16 text-center">
            <span className="grid size-9 place-items-center rounded-lg border border-line text-ink-subtle">
              <Bell className="size-4" />
            </span>
            <span className="text-base font-medium text-ink">
              You’re all caught up
            </span>
            <span className="text-sm text-ink-subtle">
              No notifications here.
            </span>
          </div>
        )}

        {page.items &&
          groupNotificationsByDay(page.items).map((group) => (
            <section key={group.day} className="flex flex-col gap-1">
              <h2 className="px-3 text-xs font-medium text-ink-subtle">
                {group.day}
              </h2>
              <ul className="flex flex-col">
                {group.items.map((n) => (
                  <NotificationRow
                    key={n.id}
                    notification={n}
                    actorAvatar={users[n.payload.actorUserId]?.avatar ?? null}
                    onOpen={() => {
                      // opening marks it read on the server (as the bell does)
                      page.markOpened(n);
                      void openNotification(n);
                    }}
                    onToggleRead={() => void page.setRead(n, !n.readAt)}
                    onDismiss={() => void page.dismiss(n)}
                  />
                ))}
              </ul>
            </section>
          ))}

        {page.hasMore && (
          <Button
            variant="outline"
            onClick={() => void page.loadMore()}
            disabled={page.loadingMore}
            className="self-center"
          >
            {page.loadingMore ? 'Loading…' : 'Load older'}
          </Button>
        )}
      </main>
    </div>
  );
}
