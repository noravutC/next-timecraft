import type { InvitationPreview } from '@/types';

/** Which card the /invite/[token] page shows. */
export type InviteView =
  | 'checking-session'
  | 'signed-out'
  | 'not-found'
  | 'loading-preview'
  | 'wrong-account'
  | 'expired'
  | 'revoked'
  | 'accepted'
  | 'valid';

export const inviteView = ({
  sessionStatus,
  hasError,
  preview,
}: {
  sessionStatus: 'loading' | 'authenticated' | 'unauthenticated';
  hasError: boolean;
  preview: Pick<InvitationPreview, 'status' | 'emailMatches'> | null;
}): InviteView => {
  if (sessionStatus === 'loading') return 'checking-session';
  if (sessionStatus === 'unauthenticated') return 'signed-out';
  if (hasError) return 'not-found';
  if (!preview) return 'loading-preview';
  // wrong account first: whatever the status, this account can't accept it
  if (!preview.emailMatches) return 'wrong-account';
  if (preview.status === 'expired') return 'expired';
  if (preview.status === 'revoked') return 'revoked';
  if (preview.status === 'accepted') return 'accepted';
  return 'valid';
};
