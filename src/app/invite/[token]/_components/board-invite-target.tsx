import type { InviteTarget } from '@/components/invitations/invite-state-card';
import { ProjectAvatar } from '@/components/project/project-avatar';
import { ROLE_LABELS } from '@/lib/rbac/role-labels';
import type { InvitationPreview } from '@/types';
import { ROLE_JOIN_COPY } from './invite-copy';

/** How a board invitation describes itself on the invitation card. */
export const boardInviteTarget = (
  preview: InvitationPreview | null,
): InviteTarget => {
  const role = preview?.role ?? 'viewer';
  return {
    kind: 'board',
    name: preview?.projectName ?? null,
    tile: (
      <ProjectAvatar
        project={{
          name: preview?.projectName ?? 'this board',
          coverImage: null,
          settings: null,
        }}
        size="size-11"
        rounded="rounded-popover"
        textSize="text-lg"
      />
    ),
    roleLine: (
      <>
        You’ve been invited to this board as {ROLE_JOIN_COPY[role].article}{' '}
        <strong>{ROLE_LABELS[role]}</strong>. {ROLE_JOIN_COPY[role].hint}
      </>
    ),
    openLabel: 'Go to board',
  };
};
