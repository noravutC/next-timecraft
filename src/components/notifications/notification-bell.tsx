'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { taskServices } from '@/services/tasks.service';
import { useNotificationStore } from '@/store/use-notification.store';
import { useNotifications } from '@/store/sync-live-data/useNotifications';
import { useTaskDetailStore } from '@/store/use-task-detail.store';
import { useProjectStore, useUserStore } from '@/store';
import type {
  BoardInviteNotificationPayload,
  CommentNotificationPayload,
  Notification,
} from '@/types';

const formatRelative = (date: Date) => {
  const ms = Date.now() - date.getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return date.toLocaleDateString();
};

const ACTION_LABELS: Record<Notification['type'], string> = {
  comment_mention: 'mentioned you on',
  comment_reply: 'replied to you on',
  board_invite: 'invited you to',
  member_removed: 'removed you from',
};

// ตัวหนาท้ายประโยค: comment → ชื่อ task, เรื่องบอร์ด → ชื่อบอร์ด
const targetLabel = (n: Notification) =>
  n.type === 'comment_mention' || n.type === 'comment_reply'
    ? (n.payload as CommentNotificationPayload).taskTitle
    : (n.payload as BoardInviteNotificationPayload).projectName;

type TabKey = 'all' | 'unread' | 'mentions';

const TAB_LABELS: Record<TabKey, string> = {
  all: 'All',
  unread: 'Unread',
  mentions: 'Mentions',
};

export const NotificationBell = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;
  useNotifications(userId);

  const { items, unreadCount, hasMore, status } = useNotificationStore(
    useShallow((s) => ({
      items: s.items,
      unreadCount: s.unreadCount,
      hasMore: s.hasMore,
      status: s.status,
    })),
  );
  const fetchMore = useNotificationStore((s) => s.fetchMore);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const users = useUserStore(useShallow((s) => s.users));

  const openTask = useTaskDetailStore((s) => s.open);
  const setProjectIsUsing = useProjectStore((s) => s.setProjectIsUsing);
  const removeProject = useProjectStore((s) => s.removeProject);

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>('all');

  const mentionCount = items.filter(
    (n) => n.type === 'comment_mention',
  ).length;
  const tabCounts: Record<TabKey, number> = {
    all: items.length,
    unread: unreadCount,
    mentions: mentionCount,
  };
  const visible =
    tab === 'unread'
      ? items.filter((n) => !n.readAt)
      : tab === 'mentions'
        ? items.filter((n) => n.type === 'comment_mention')
        : items;

  const handleClick = async (n: Notification) => {
    if (!n.readAt) markRead([n.id]);
    setOpen(false);
    if (n.type === 'board_invite') {
      router.push(
        `/invite/${(n.payload as BoardInviteNotificationPayload).token}`,
      );
      return;
    }
    if (n.type === 'member_removed') {
      // ไม่มีที่ให้เปิดแล้ว — sync state ฝั่งเรา: เอาบอร์ดออกจาก list
      removeProject(n.payload.projectId);
      return;
    }
    const payload = n.payload as CommentNotificationPayload;
    try {
      // task อาจถูกลบไปแล้ว — เช็คกับ server ก่อน เพราะ client store
      // ไม่รู้จัก task ของโปรเจกต์ที่ยังไม่ได้โหลด
      await taskServices.getTasksByIds([payload.taskId]);
    } catch {
      toast.error('This task is no longer available');
      return;
    }
    setProjectIsUsing(payload.projectId);
    openTask(payload.taskId);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-8.5 rounded-lg hover:bg-surface-hover"
          aria-label="Notifications"
        >
          <Bell className="size-4.5 text-ink-muted" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-background bg-destructive px-1 text-xs font-extrabold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="flex max-h-[560px] w-97.5 flex-col overflow-hidden rounded-2xl border-line p-0 shadow-[0_18px_50px_rgba(20,24,34,0.18)]"
      >
        {/* header */}
        <div className="flex items-center justify-between border-b px-4 pt-3.5 pb-3">
          <div className="flex items-center gap-2">
            <p className="text-md font-extrabold tracking-tight text-ink">
              Notifications
            </p>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-soft px-1.5 text-xs font-bold text-brand-dark">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead()}
              className="cursor-pointer text-xs font-bold text-brand hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* filter tabs */}
        <div className="flex items-center gap-1.5 border-b px-4 py-2.5">
          {(Object.keys(TAB_LABELS) as TabKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'flex cursor-pointer items-center rounded-full px-3 py-1 text-xs font-bold transition-colors',
                tab === key
                  ? 'bg-ink text-white'
                  : 'bg-surface text-ink-muted hover:bg-surface-active hover:text-ink',
              )}
            >
              {TAB_LABELS[key]}
              {tabCounts[key] > 0 && (
                <span className="ml-1.5 opacity-70">{tabCounts[key]}</span>
              )}
            </button>
          ))}
        </div>

        {/* list */}
        <div className="scrollbar-thin-y scrollbar-light min-h-0 flex-1 overflow-y-auto">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
              <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-surface text-ink-faint">
                <Bell className="size-6" />
              </div>
              <p className="text-sm font-bold text-ink-muted">
                You&rsquo;re all caught up
              </p>
              <p className="mt-0.5 text-xs font-medium text-ink-subtle">
                No notifications here
              </p>
            </div>
          ) : (
            <ul>
              {visible.map((n) => {
                const unread = !n.readAt;
                const actor = users[n.payload.actorUserId];
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => void handleClick(n)}
                      className="flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface/60"
                    >
                      <Avatar className="size-9 shrink-0 rounded-lg">
                        <AvatarImage
                          src={actor?.avatar ?? undefined}
                          alt={n.payload.actorName}
                        />
                        <AvatarFallback className="rounded-lg bg-brand-soft text-xs font-bold text-brand-dark">
                          {n.payload.actorName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-relaxed text-gray-700">
                          <span className="font-bold text-ink">
                            {n.payload.actorName}
                          </span>{' '}
                          {ACTION_LABELS[n.type]}{' '}
                          <span className="font-bold text-ink">
                            {targetLabel(n)}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-ink-subtle">
                          {formatRelative(new Date(n.createdAt))}
                        </p>
                      </div>
                      {unread && (
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" />
                      )}
                    </button>
                  </li>
                );
              })}
              {hasMore && (
                <li className="p-2 text-center">
                  <button
                    type="button"
                    onClick={() => fetchMore()}
                    disabled={status === 'fetching'}
                    className="cursor-pointer text-xs font-semibold text-ink-subtle hover:text-ink"
                  >
                    {status === 'fetching' ? 'Loading…' : 'Load more'}
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>

        {/* footer — design กำหนดให้ปุ่มนี้ปิดแผง */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="cursor-pointer border-t bg-background p-3 text-xs font-bold text-brand transition-colors hover:bg-surface/60"
        >
          View all activity
        </button>
      </PopoverContent>
    </Popover>
  );
};
