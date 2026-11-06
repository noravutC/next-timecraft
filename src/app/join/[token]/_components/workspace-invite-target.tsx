import type { InviteTarget } from '@/components/invitations/invite-state-card';
import { WorkspaceLogo } from '@/components/workspace/workspace-logo';
import {
  WORKSPACE_JOIN_COPY,
  WORKSPACE_ROLE_LABELS,
} from '@/lib/rbac/role-labels';
import type { WorkspaceInvitationPreview } from '@/types';

/** How a workspace invitation describes itself on the invitation card. */
export const workspaceInviteTarget = (
  preview: WorkspaceInvitationPreview | null,
): InviteTarget => {
  const role = preview?.role ?? 'member';
  return {
    kind: 'workspace',
    name: preview?.workspaceName ?? null,
    tile: (
      <WorkspaceLogo
        workspace={{
          name: preview?.workspaceName ?? 'Workspace',
          logo: preview?.workspaceLogo ?? null,
        }}
        size="size-11"
        rounded="rounded-popover"
        textSize="text-lg"
      />
    ),
    roleLine: (
      <>
        You’ve been invited to this workspace as{' '}
        {WORKSPACE_JOIN_COPY[role].article}{' '}
        <strong>{WORKSPACE_ROLE_LABELS[role]}</strong>.{' '}
        {WORKSPACE_JOIN_COPY[role].hint}
      </>
    ),
    openLabel: 'Go to boards',
  };
};
