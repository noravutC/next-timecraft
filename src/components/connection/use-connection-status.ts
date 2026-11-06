'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { pusherClient } from '@/lib/pusher-client';

export type ConnectionStatus = 'online' | 'reconnecting' | 'offline';

// a socket that drops and comes back within this long isn't worth a pill
const GRACE_MS = 2000;

const subscribeOnline = (onChange: () => void) => {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
};

/** Whether the browser is online and live updates are coming through. */
export function useConnectionStatus(): ConnectionStatus {
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
  const [dropped, setDropped] = useState(false);

  useEffect(() => {
    const connection = pusherClient.connection;
    if (!connection) return;
    let wasConnected = connection.state === 'connected';
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onChange = ({ current }: { current: string }) => {
      clearTimeout(timer);
      if (current === 'connected') {
        wasConnected = true;
        setDropped(false);
      } else if (wasConnected) {
        // the first connect isn't a drop
        timer = setTimeout(() => setDropped(true), GRACE_MS);
      }
    };
    connection.bind('state_change', onChange);
    return () => {
      clearTimeout(timer);
      connection.unbind('state_change', onChange);
    };
  }, []);

  if (!online) return 'offline';
  return dropped ? 'reconnecting' : 'online';
}
