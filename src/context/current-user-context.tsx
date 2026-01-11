//context/current-user-context.tsx
'use client';

import { LoaderPage } from '@/components/Loader-page';
import { CurrentUserContextProps } from '@/types';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
// import { API_BASE_URL, ATTACHMENT_BASE_URL } from '@/lib/constants';
// import { BackendService } from '@/services/backend.service';
// import { IAppContext } from '@/types/app';
// import { useAuth } from '@clerk/nextjs';
import React, { useContext, useEffect, useState } from 'react';
// import { useStore } from './store-context';

export interface CurrentUserContext {
  currentUser: CurrentUserContextProps | undefined;
  currentUserLoader: boolean;
}

export const UserContext = React.createContext<CurrentUserContext | undefined>(
  undefined,
);

export function useCurrentUserContext(): CurrentUserContext {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('Error at useCurrentUserContext at current-user-context.tsx');
  }
  return context;
}

const initContext = (): CurrentUserContext => {
  return {
    currentUser: undefined,
    currentUserLoader: false,
  };
};

export function CurrentUserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [contextData, setContextData] =
    useState<CurrentUserContext>(initContext());
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      console.log('unauthenticated');
      router.push("/login");
    } else if (status === 'loading') {
      setContextData(prev => ({ ...prev, currentUserLoader: true }));
    } else {
      setContextData((prev) => ({
        ...prev,
        currentUser: {
          userId: session?.user.id || '',
          fullName: session?.user.name || '',
          email: session?.user.email || '',
          avatar: session?.user.image || '',
        },
        currentUserLoader: false,
      }));
    }
  }, [status, session]);

  return (
    <UserContext.Provider value={contextData}>{children}</UserContext.Provider>
  );
}
