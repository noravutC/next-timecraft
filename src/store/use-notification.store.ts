import { create } from "zustand";
import { notificationServices } from "@/services/notification.service";
import type { Notification } from "@/types";
import type { LoaderStatus } from "@/types/global/types";

const PAGE_SIZE = 20;

type NotificationStore = {
  items: Notification[];
  cursor: string | null;
  hasMore: boolean;
  unreadCount: number;
  status: LoaderStatus;
  initialized: boolean;
  fetchInitial: () => Promise<void>;
  fetchMore: () => Promise<void>;
  markRead: (ids: string[]) => Promise<void>;
  markAllRead: () => Promise<void>;
  ingest: (notification: Notification) => void;
};

const sortDescByCreatedAt = (a: Notification, b: Notification) => {
  const ad = new Date(a.createdAt).getTime();
  const bd = new Date(b.createdAt).getTime();
  if (ad !== bd) return bd - ad;
  return a.id < b.id ? 1 : -1;
};

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  items: [],
  cursor: null,
  hasMore: false,
  unreadCount: 0,
  status: "none",
  initialized: false,

  fetchInitial: async () => {
    if (get().status === "fetching") return;
    set({ status: "fetching" });
    try {
      const res = await notificationServices.fetchPage(null, PAGE_SIZE, false);
      set({
        items: res.data.items,
        cursor: res.data.nextCursor,
        hasMore: res.data.hasMore,
        unreadCount: res.data.unreadCount,
        status: "none",
        initialized: true,
      });
    } catch (err) {
      set({ status: "error" });
      console.error(err);
    }
  },

  fetchMore: async () => {
    const { hasMore, cursor, status, items } = get();
    if (!hasMore || status === "fetching") return;
    set({ status: "fetching" });
    try {
      const res = await notificationServices.fetchPage(cursor, PAGE_SIZE, false);
      const seen = new Set(items.map((n) => n.id));
      const merged = [
        ...items,
        ...res.data.items.filter((n) => !seen.has(n.id)),
      ];
      set({
        items: merged,
        cursor: res.data.nextCursor,
        hasMore: res.data.hasMore,
        status: "none",
      });
    } catch (err) {
      set({ status: "error" });
      console.error(err);
    }
  },

  markRead: async (ids) => {
    if (ids.length === 0) return;
    const snapshot = get().items;
    const snapshotUnread = get().unreadCount;
    const idSet = new Set(ids);
    const now = new Date();
    set((s) => ({
      items: s.items.map((n) =>
        idSet.has(n.id) && !n.readAt ? { ...n, readAt: now } : n,
      ),
      unreadCount: Math.max(
        s.unreadCount - s.items.filter((n) => idSet.has(n.id) && !n.readAt).length,
        0,
      ),
    }));
    try {
      await notificationServices.markRead(ids);
    } catch (err) {
      set({ items: snapshot, unreadCount: snapshotUnread });
      console.error(err);
    }
  },

  markAllRead: async () => {
    const snapshot = get().items;
    const snapshotUnread = get().unreadCount;
    const now = new Date();
    set((s) => ({
      items: s.items.map((n) => (n.readAt ? n : { ...n, readAt: now })),
      unreadCount: 0,
    }));
    try {
      await notificationServices.markAllRead();
    } catch (err) {
      set({ items: snapshot, unreadCount: snapshotUnread });
      console.error(err);
    }
  },

  ingest: (notification) => {
    set((s) => {
      if (s.items.some((n) => n.id === notification.id)) return s;
      return {
        items: [notification, ...s.items].sort(sortDescByCreatedAt),
        unreadCount: notification.readAt ? s.unreadCount : s.unreadCount + 1,
      };
    });
  },
}));
