"use client";

import { useEffect } from "react";
import { pusherClient } from "@/lib/pusher-client";
import { useNotificationStore } from "@/store/use-notification.store";
import type { Notification } from "@/types";

export const useNotifications = (userId?: string | null) => {
  const fetchInitial = useNotificationStore((s) => s.fetchInitial);
  const ingest = useNotificationStore((s) => s.ingest);
  const initialized = useNotificationStore((s) => s.initialized);

  useEffect(() => {
    if (!userId) return;
    if (!initialized) fetchInitial();

    const channelName = `user-${userId}`;
    const channel = pusherClient.subscribe(channelName);
    channel.bind("notification-added", (n: Notification) => ingest(n));

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [userId, fetchInitial, ingest, initialized]);
};
