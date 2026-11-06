import apiClient from "@/lib/axios";
import type {
  NotificationPrefs,
  StoredNotificationPrefs,
} from "@/helper/utils/notification-prefs";
import type { NotificationKind } from "@/helper/utils/notification-view";
import type {
  APIDelete,
  APIGet,
  APIPatch,
  APIPost,
  APISingleGet,
  NotificationsPage,
} from "@/types";

export type NotificationCounts = Record<NotificationKind, number>;

class NotificationService {
  private client = apiClient;

  async fetchPage(
    cursor: string | null,
    limit: number,
    unreadOnly: boolean,
  ): Promise<APIGet<NotificationsPage> & { data: NotificationsPage }> {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    params.set("limit", String(limit));
    if (unreadOnly) params.set("unreadOnly", "1");
    return this.client
      .get(`/notifications?${params.toString()}`)
      .then((r) => r.data)
      .catch((e) => {
        throw e?.response?.data || new Error("Failed to fetch notifications");
      });
  }

  /** The notifications page: one chip and board at a time, with counts. */
  async fetchFiltered(args: {
    cursor: string | null;
    limit: number;
    kind: NotificationKind;
    projectId: string | null;
  }): Promise<{ data: NotificationsPage & { counts?: NotificationCounts } }> {
    const params = new URLSearchParams();
    if (args.cursor) params.set("cursor", args.cursor);
    params.set("limit", String(args.limit));
    if (args.kind !== "all") params.set("kind", args.kind);
    if (args.projectId) params.set("projectId", args.projectId);
    params.set("counts", "1");
    return this.client
      .get(`/notifications?${params.toString()}`)
      .then((r) => r.data)
      .catch((e) => {
        throw e?.response?.data || new Error("Failed to fetch notifications");
      });
  }

  async markUnread(ids: string[]): Promise<APIPost<{ updated: number }>> {
    return this.client
      .post(`/notifications/mark-unread`, { ids })
      .then((r) => r.data)
      .catch((e) => {
        throw e?.response?.data || new Error("Failed to mark unread");
      });
  }

  async dismiss(ids: string[]): Promise<APIDelete<number>> {
    return this.client
      .delete(`/notifications`, { data: { ids } })
      .then((r) => r.data)
      .catch((e) => {
        throw e?.response?.data || new Error("Failed to dismiss");
      });
  }

  async getPrefs(): Promise<APISingleGet<NotificationPrefs>> {
    return this.client
      .get(`/account/notification-prefs`)
      .then((r) => r.data)
      .catch((e) => {
        throw e?.response?.data || new Error("Failed to load your settings");
      });
  }

  async updatePrefs(
    patch: StoredNotificationPrefs,
  ): Promise<APIPatch<NotificationPrefs>> {
    return this.client
      .patch(`/account/notification-prefs`, patch)
      .then((r) => r.data)
      .catch((e) => {
        throw e?.response?.data || new Error("Failed to save your settings");
      });
  }

  async markRead(ids: string[]): Promise<APIPost<{ updated: number }>> {
    return this.client
      .post(`/notifications/mark-read`, { ids })
      .then((r) => r.data)
      .catch((e) => {
        throw e?.response?.data || new Error("Failed to mark notifications");
      });
  }

  async markAllRead(): Promise<APIPost<{ updated: number }>> {
    return this.client
      .post(`/notifications/mark-read`, { all: true })
      .then((r) => r.data)
      .catch((e) => {
        throw e?.response?.data || new Error("Failed to mark all notifications");
      });
  }
}

export const notificationServices = new NotificationService();
