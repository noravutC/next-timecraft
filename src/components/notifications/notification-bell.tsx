"use client";

import { useSession } from "next-auth/react";
import { Bell, Check } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/store/use-notification.store";
import { useNotifications } from "@/store/sync-live-data/useNotifications";
import { useTaskDetailStore } from "@/store/use-task-detail.store";
import { useProjectStore } from "@/store";
import type { Notification } from "@/types";

const formatRelative = (date: Date) => {
  const ms = Date.now() - date.getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return date.toLocaleDateString();
};

export const NotificationBell = () => {
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

  const openTask = useTaskDetailStore((s) => s.open);
  const setProjectIsUsing = useProjectStore((s) => s.setProjectIsUsing);

  const handleClick = (n: Notification) => {
    setProjectIsUsing(n.payload.projectId);
    openTask(n.payload.taskId);
    if (!n.readAt) markRead([n.id]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-7"
          aria-label="Notifications"
        >
          <Bell className="size-3.5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-semibold text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-80 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead()}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <Check className="size-3" />
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => {
                const unread = !n.readAt;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleClick(n)}
                      className={cn(
                        "block w-full px-3 py-2.5 text-left transition-colors hover:bg-muted/60",
                        unread && "bg-muted/30",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {unread && (
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs leading-snug">
                            <span className="font-semibold">
                              {n.payload.actorName}
                            </span>{" "}
                            mentioned you in{" "}
                            <span className="font-semibold">
                              {n.payload.taskTitle}
                            </span>
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                            {n.payload.snippet}
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {n.payload.projectName} ·{" "}
                            {formatRelative(new Date(n.createdAt))}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {hasMore && (
            <div className="border-t border-border p-2 text-center">
              <button
                type="button"
                onClick={() => fetchMore()}
                disabled={status === "fetching"}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {status === "fetching" ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
