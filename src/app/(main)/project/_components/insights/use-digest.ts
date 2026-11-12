'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { isGuestSession } from '@/lib/guest';
import { projectServices } from '@/services/projects.service';
import type { DigestState } from '@/types';

/** Your weekly digest setting for a board, switched optimistically. */
export function useDigest(projectId: string) {
  const { data: session } = useSession();
  const [state, setState] = useState<DigestState | null>(null);

  useEffect(() => {
    let active = true;
    projectServices
      .getDigest(projectId)
      .then((next) => active && setState(next))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [projectId]);

  const setOn = (on: boolean) => {
    if (!state) return;
    const before = state;
    setState({ ...state, on });
    projectServices
      .setDigest(projectId, on)
      .then(setState)
      .catch(() => {
        setState(before);
        toast.error('Couldn’t save the weekly digest. Try again.');
      });
  };

  return { state, setOn, isGuest: isGuestSession(session) };
}
