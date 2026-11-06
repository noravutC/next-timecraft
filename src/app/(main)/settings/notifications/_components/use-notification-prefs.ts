'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type {
  Channels,
  NotificationPrefs,
  PrefKind,
} from '@/helper/utils/notification-prefs';
import { notificationServices } from '@/services/notification.service';

/** Settings › Notifications: each change saves at once, and rolls back on failure. */
export function useNotificationPrefs() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);

  useEffect(() => {
    notificationServices
      .getPrefs()
      .then(({ data }) => data && setPrefs(data))
      .catch(() => toast.error('Couldn’t load your notification settings'));
  }, []);

  const setChannel = async (
    kind: PrefKind,
    channel: keyof Channels,
    on: boolean,
  ) => {
    if (!prefs) return;
    const before = prefs;
    setPrefs({
      ...prefs,
      kinds: {
        ...prefs.kinds,
        [kind]: { ...prefs.kinds[kind], [channel]: on },
      },
    });
    try {
      const { updated } = await notificationServices.updatePrefs({
        kinds: { [kind]: { [channel]: on } },
      });
      if (updated) setPrefs(updated);
    } catch (error) {
      setPrefs(before);
      toast.error(
        (error as { message?: string })?.message ?? 'Couldn’t save that change',
      );
    }
  };

  return { prefs, setChannel };
}
