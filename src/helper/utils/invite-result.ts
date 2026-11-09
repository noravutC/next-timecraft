import type { InviteToWorkspaceResult } from '@/types';

/**
 * One line on what happened to a batch of invitations: "2 invitations sent",
 * then who was left out and why. Null when there is nothing to say.
 */
export const invitesSummary = ({
  invited,
  skipped,
}: InviteToWorkspaceResult): string | null => {
  const parts: string[] = [];
  if (invited.length > 0) {
    parts.push(
      `${invited.length} ${invited.length === 1 ? 'invitation' : 'invitations'} sent`,
    );
  }
  if (skipped.length > 0) {
    parts.push(
      `Not invited: ${skipped.map((s) => `${s.email} (${s.reason})`).join(', ')}`,
    );
  }
  return parts.length > 0 ? parts.join('. ') : null;
};
