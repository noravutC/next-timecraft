'use client';
import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
// components
import { HeaderMenu } from '@/components/menu-bar/header-menu';
import LogoAnimationLoop from '@/components/logo-space/logo-animation-loop';

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
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LogoAnimationLoop />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="h-full max-h-screen w-full max-w-screen overflow-hidden">
      <div className="flex h-full flex-col">
        <div className="min-h-max max-w-[100vw] min-w-[100vw] border-b p-2">
          <HeaderMenu />
        </div>
        <div className="flex min-h-0 flex-1">
          <div className="h-full w-full overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
