// app/api/organization/[id]/invitations/[invitationId]/resend/route.ts:
// POST = email it again, valid for another 7 days

import { getWorkspaceSummary } from '@/db/uniq-query/organization/organization-utils';
import {
  renewWorkspaceInvitation,
  toPendingWorkspaceInvitation,
} from '@/db/uniq-query/organization/workspace-invitation-utils';
import { ForbiddenError, NotFoundError } from '@/lib/api/errors';
import { createParamHandle, enforceQuota } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { DAILY_QUOTAS } from '@/lib/api/quotas';
import { sendWorkspaceInviteEmail } from '@/lib/email/send-workspace-invite';
import { isGuestSession } from '@/lib/guest';
import { authorizeWorkspace } from '@/lib/rbac/authorize-workspace';
import { NextResponse } from 'next/server';

type RouteParams = { id: string; invitationId: string };

export const POST = createParamHandle<RouteParams>(
  {},
  async ({ params, userId, session, request }) => {
    if (isGuestSession(session)) {
      throw new ForbiddenError('Sign in with Google to invite people');
    }
    const organizationId = parseId(params.id);
    await authorizeWorkspace(userId, organizationId, 'manage');
    enforceQuota(
      { request, session },
      'invite',
      DAILY_QUOTAS.invite,
      'Daily invite limit reached. Try again tomorrow.',
    );

    const renewed = await renewWorkspaceInvitation(
      organizationId,
      parseId(params.invitationId),
    );
    const workspace = await getWorkspaceSummary(organizationId);
    if (!renewed || !workspace) {
      throw new NotFoundError('No pending invitation to send again');
    }
    await sendWorkspaceInviteEmail({
      to: renewed.email,
      inviterName: session.user?.name ?? 'A teammate',
      workspaceName: workspace.name,
      role: renewed.role,
      token: renewed.token,
    });

    return NextResponse.json(
      {
        created: toPendingWorkspaceInvitation(renewed),
        message: 'Invitation sent again',
        status: 200,
      },
      { status: 200 },
    );
  },
);
