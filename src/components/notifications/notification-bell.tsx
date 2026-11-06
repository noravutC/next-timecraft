'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotificationStore } from '@/store/use-notification.store';
import { useNotifications } from '@/store/sync-live-data/useNotifications';
import { NotificationPanel } from './notification-panel';

export const NotificationBell = () => {
  const { data: session } = useSession();
  // live feed stays subscribed while the popover is closed
  useNotifications(session?.user?.id ?? null);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : 'Notifications'
          }
        >
          <Bell className="size-4.25" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.75 size-1.75 rounded-full bg-brand ring-2 ring-background" />
          )}
        </Button>
      </PopoverTrigger>
      {/* radius and shadow are this popover's own (12 and a deeper drop
          than menus); important keeps them over the popover defaults */}
      <PopoverContent
        align="end"
        sideOffset={6}
        className="flex max-h-140 w-100 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl p-0 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.2),0_2px_6px_rgba(0,0,0,0.05)]"
      >
        <NotificationPanel onNavigate={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};
