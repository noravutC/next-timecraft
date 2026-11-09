import type { WorkspaceRole } from '@/lib/rbac/workspace-permissions';
import {
  WORKSPACE_JOIN_COPY,
  WORKSPACE_ROLE_LABELS,
} from '@/lib/rbac/role-labels';
import { appUrl, sendEmail } from './send-email';
import { WorkspaceInviteEmail } from './templates/workspace-invite';

/** Never throws: the invitation works without the email (copy the link). */
export async function sendWorkspaceInviteEmail(input: {
  to: string;
  inviterName: string;
  workspaceName: string;
  role: WorkspaceRole;
  token: string;
}) {
  await sendEmail({
    to: input.to,
    subject: `${input.inviterName} invited you to join ${input.workspaceName} on TimeCraft`,
    email: WorkspaceInviteEmail({
      inviterName: input.inviterName,
      workspaceName: input.workspaceName,
      roleLabel: WORKSPACE_ROLE_LABELS[input.role],
      roleHint: WORKSPACE_JOIN_COPY[input.role].hint,
      acceptUrl: `${appUrl()}/join/${input.token}`,
    }),
    kind: 'workspace-invite',
  });
}
