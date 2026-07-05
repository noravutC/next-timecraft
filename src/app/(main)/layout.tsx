'use client';
import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
// components
import { LoaderScreen } from '@/components/ui/loader';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <LoaderScreen />;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="h-full max-h-screen w-full max-w-screen overflow-hidden">
      <div className="flex h-full flex-col">
        <div className="flex min-h-0 flex-1">
          <div className="h-full w-full overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
