import apiClient from "@/lib/axios";
import type {
  APIGet,
  APIPost,
  NotificationsPage,
} from "@/types";

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
