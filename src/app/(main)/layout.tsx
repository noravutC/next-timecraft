'use client';
import React, { useEffect, useMemo, useState } from 'react';
import type { Session } from 'next-auth';
import { SessionContext, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
// components
import { LoaderScreen } from '@/components/ui/loader';
import { SessionExpiredDialog } from '@/components/session/session-expired-dialog';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const live = useSession();
  const { data: session, status } = live;
  const router = useRouter();
  const userId = session?.user?.id ?? null;

  // who this tab signed in as, and their latest session
  const [owner, setOwner] = useState<string | null>(null);
  const [lastSession, setLastSession] = useState<Session | null>(null);
  if (status === 'authenticated' && session) {
    if (owner === null && userId) setOwner(userId);
    if (session !== lastSession) setLastSession(session);
  }
  const expired = owner !== null && status === 'unauthenticated';

  // once expired, the app below keeps the last session: nothing unmounts,
  // so unsent text survives until they sign in again
  const value = useMemo(
    () =>
      expired && lastSession
        ? {
            data: lastSession,
            status: 'authenticated' as const,
            update: live.update,
          }
        : live,
    [expired, lastSession, live],
  );

  useEffect(() => {
    if (status === 'unauthenticated' && owner === null) {
      router.replace('/login');
    }
  }, [status, owner, router]);

  // signed back in as someone else: what's on screen isn't theirs
  useEffect(() => {
    if (owner && userId && userId !== owner) window.location.reload();
  }, [owner, userId]);

  if (owner === null && status === 'loading') {
    return <LoaderScreen />;
  }

  if (owner === null && status === 'unauthenticated') {
    return null;
  }

  return (
    <SessionContext.Provider value={value}>
      <div className="h-full max-h-screen w-full max-w-screen overflow-hidden">
        <div className="flex h-full flex-col">
          <div className="flex min-h-0 flex-1">
            <div className="h-full w-full overflow-hidden">{children}</div>
          </div>
        </div>
      </div>
      {expired && <SessionExpiredDialog />}
    </SessionContext.Provider>
  );
}
