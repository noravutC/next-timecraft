'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import { CalendarX2, MailQuestion, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { projectServices } from '@/services/projects.service';
import { ROLE_LABELS } from '@/lib/rbac/role-labels';
import { Logo } from '@/components/logo-space/logo';
import { Button } from '@/components/ui/button';
import { LoaderScreen } from '@/components/ui/loader';
import type { InvitationPreview } from '@/types';

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();

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
      await projectServices.acceptInvitation(token);
      toast.success('Invitation accepted — welcome aboard!');
      router.replace('/project');
    } catch (error) {
      toast.error(
        (error as { message?: string })?.message ??
          'Unable to accept invitation',
      );
      setAccepting(false);
    }
  };

  if (status === 'loading') {
    return <LoaderScreen title="TimeCraft" label="Checking your invitation…" />;
  }

  const card = (children: React.ReactNode) => (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
        <div className="mb-6 flex justify-center">
          <Logo size={22} textSize="lg" />
        </div>
        {children}
      </div>
    </div>
  );

  // ยังไม่ login — ให้ sign in แล้วเด้งกลับมาหน้านี้ (บัญชีใหม่ถูกสร้างอัตโนมัติ
  // ตอน Google sign-in โดย hydrateTokenFromDb)
  if (status === 'unauthenticated') {
    return card(
      <>
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-brand-soft">
          <UserPlus className="size-6 text-brand" />
        </div>
        <h1 className="text-lg font-bold text-ink">
          You&rsquo;ve been invited to a board
        </h1>
        <p className="mt-1.5 text-sm text-ink-subtle">
          Sign in with the invited email to accept this invitation.
        </p>
        <Button
          onClick={() =>
            void signIn('google', { callbackUrl: `/invite/${token}` })
          }
          className="mt-6 h-10 w-full rounded-lg bg-brand hover:bg-brand-dark"
        >
          Continue with Google
        </Button>
      </>,
    );
  }

  if (previewError) {
    return card(
      <>
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-surface">
          <MailQuestion className="size-6 text-ink-muted" />
        </div>
        <h1 className="text-lg font-bold text-ink">Invitation not found</h1>
        <p className="mt-1.5 text-sm text-ink-subtle">{previewError}</p>
        <Button
          variant="outline"
          onClick={() => router.replace('/project')}
          className="mt-6 h-10 rounded-lg"
        >
          Go to my boards
        </Button>
      </>,
    );
  }

  if (!preview) {
    return <LoaderScreen title="TimeCraft" label="Loading invitation…" />;
  }

  if (!preview.emailMatches) {
    return card(
      <>
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-amber-50">
          <MailQuestion className="size-6 text-amber-600" />
        </div>
        <h1 className="text-lg font-bold text-ink">Wrong account</h1>
        <p className="mt-1.5 text-sm text-ink-subtle">
          This invitation was sent to <strong>{preview.email}</strong> but
          you&rsquo;re signed in as <strong>{session?.user?.email}</strong>.
        </p>
        <Button
          onClick={() => void signOut({ callbackUrl: `/invite/${token}` })}
          className="mt-6 h-10 w-full rounded-lg bg-brand hover:bg-brand-dark"
        >
          Switch account
        </Button>
      </>,
    );
  }

  if (preview.status === 'expired' || preview.status === 'revoked') {
    return card(
      <>
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-surface">
          <CalendarX2 className="size-6 text-ink-muted" />
        </div>
        <h1 className="text-lg font-bold text-ink">
          {preview.status === 'expired'
            ? 'This invitation has expired'
            : 'This invitation was revoked'}
        </h1>
        <p className="mt-1.5 text-sm text-ink-subtle">
          Ask a board admin of <strong>{preview.projectName}</strong> to send
          you a new invitation.
        </p>
      </>,
    );
  }

  const alreadyAccepted = preview.status === 'accepted';

  return card(
    <>
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-brand-soft">
        <UserPlus className="size-6 text-brand" />
      </div>
      <h1 className="text-lg font-bold text-ink">
        Join &ldquo;{preview.projectName}&rdquo;
      </h1>
      <p className="mt-1.5 text-sm text-ink-subtle">
        {alreadyAccepted
          ? 'You already accepted this invitation.'
          : `You've been invited as ${ROLE_LABELS[preview.role]}.`}
      </p>
      <Button
        onClick={() =>
          alreadyAccepted ? router.replace('/project') : void handleAccept()
        }
        disabled={accepting}
        className="mt-6 h-10 w-full rounded-lg bg-brand hover:bg-brand-dark"
      >
        {alreadyAccepted
          ? 'Go to board'
          : accepting
            ? 'Joining…'
            : 'Accept invitation'}
      </Button>
    </>,
  );
}
