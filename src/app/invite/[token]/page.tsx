'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { projectServices } from '@/services/projects.service';
import { AuthHeader } from '@/components/auth/auth-header';
import { LoaderScreen } from '@/components/ui/loader';
import { inviteView } from '@/helper/utils/invite-view';
import { boardUrl } from '@/helper/utils/board-url';
import type { InvitationPreview } from '@/types';
import { InviteStateCard } from '@/components/invitations/invite-state-card';
import { boardInviteTarget } from './_components/board-invite-target';

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { data: session, status, update } = useSession();

  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || !token) return;
    projectServices
      .getInvitation(token)
      .then((res) => setPreview(res.data))
      .catch((error) =>
        setPreviewError(
          (error as { message?: string })?.message ?? 'Invitation not found',
        ),
      );
  }, [status, token]);

  const handleAccept = async () => {
    if (accepting) return;
    setAccepting(true);
    try {
      const res = await projectServices.acceptInvitation(token);
      // re-read the session so it knows about the new board membership
      // (an empty payload: update() without one only reads the session)
      await update({});
      toast.success('Invitation accepted. Welcome aboard!');
      // open the board just joined, not whichever board comes first
      router.replace(boardUrl({ board: res.created?.projectId ?? null }));
    } catch (error) {
      toast.error(
        (error as { message?: string })?.message ??
          'Unable to accept invitation',
      );
      setAccepting(false);
    }
  };

  const view = inviteView({
    sessionStatus: status,
    hasError: Boolean(previewError),
    preview,
  });

  if (view === 'checking-session') {
    return <LoaderScreen title="TimeCraft" label="Checking your invitation…" />;
  }
  if (view === 'loading-preview') {
    return <LoaderScreen title="TimeCraft" label="Loading invitation…" />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <AuthHeader />
      <main className="flex flex-1 justify-center px-5 pt-6 pb-14">
        <div className="w-full max-w-112">
          {/* signed out: sign in, then come straight back to this page (a new
              account is created on Google sign-in by hydrateTokenFromDb) */}
          <InviteStateCard
            view={view}
            target={boardInviteTarget(preview)}
            invitedEmail={preview?.email ?? null}
            sessionEmail={session?.user?.email ?? ''}
            accepting={accepting}
            onAccept={() => void handleAccept()}
            onSignIn={() =>
              void signIn('google', { callbackUrl: `/invite/${token}` })
            }
            onSwitchAccount={() =>
              void signOut({ callbackUrl: `/invite/${token}` })
            }
            onGoToBoards={() => router.replace('/project')}
          />
        </div>
      </main>
    </div>
  );
}
