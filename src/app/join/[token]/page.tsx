'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { organizationServices } from '@/services/organization.service';
import { AuthHeader } from '@/components/auth/auth-header';
import { InviteStateCard } from '@/components/invitations/invite-state-card';
import { LoaderScreen } from '@/components/ui/loader';
import { inviteView } from '@/helper/utils/invite-view';
import type { WorkspaceInvitationPreview } from '@/types';
import { workspaceInviteTarget } from './_components/workspace-invite-target';

/** Accept an invitation to a workspace (sent from onboarding or settings). */
export default function JoinWorkspacePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { data: session, status, update } = useSession();

  const [preview, setPreview] = useState<WorkspaceInvitationPreview | null>(
    null,
  );
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || !token) return;
    organizationServices
      .getWorkspaceInvitation(token)
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
      await organizationServices.acceptWorkspaceInvitation(token);
      // the session picks up the new workspace and role from the DB
      await update({});
      toast.success(`You joined ${preview?.workspaceName ?? 'the workspace'}`);
      router.replace('/project');
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
          <InviteStateCard
            view={view}
            target={workspaceInviteTarget(preview)}
            invitedEmail={preview?.email ?? null}
            sessionEmail={session?.user?.email ?? ''}
            accepting={accepting}
            onAccept={() => void handleAccept()}
            onSignIn={() =>
              void signIn('google', { callbackUrl: `/join/${token}` })
            }
            onSwitchAccount={() =>
              void signOut({ callbackUrl: `/join/${token}` })
            }
            onGoToBoards={() => router.replace('/project')}
          />
        </div>
      </main>
    </div>
  );
}
