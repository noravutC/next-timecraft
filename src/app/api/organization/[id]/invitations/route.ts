// app/api/organization/[id]/invitations/route.ts: POST = invite to the
// workspace, GET = pending invitations (with their links: owner and admins)

import { createNotification } from '@/db/uniq-query/notification/notification-utils';
import { getWorkspaceSummary } from '@/db/uniq-query/organization/organization-utils';
import {
  createWorkspaceInvitation,
  hasPendingWorkspaceInvitation,
  listPendingWorkspaceInvitations,
  toPendingWorkspaceInvitation,
} from '@/db/uniq-query/organization/workspace-invitation-utils';
import { getOrgRole } from '@/db/uniq-query/project/project-utils';
import { countInvitesSentSince } from '@/db/uniq-query/quota/daily-usage';
import { getUserIdByEmail } from '@/db/uniq-query/user/user-utils';
import { ForbiddenError, NotFoundError } from '@/lib/api/errors';
import { createParamHandle, enforceQuota } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { assertUnderDailyLimit, DAILY_QUOTAS, dayAgo } from '@/lib/api/quotas';
import { sendWorkspaceInviteEmail } from '@/lib/email/send-workspace-invite';
import { isGuestEmail, isGuestSession } from '@/lib/guest';
import { pushNotification } from '@/lib/pusher-server';
import { authorizeWorkspace } from '@/lib/rbac/authorize-workspace';
import type { InviteToWorkspaceResult } from '@/types';
import {
  inviteToWorkspaceSchema,
  type InviteToWorkspaceBody,
} from '@/validations/organization.validation';
import { NextResponse } from 'next/server';

type RouteParams = { id: string };

const LIMIT_MESSAGE = 'Daily invite limit reached. Try again tomorrow.';

export const POST = createParamHandle<RouteParams, InviteToWorkspaceBody>(
  { body: inviteToWorkspaceSchema },
  async ({ params, body, userId, session, request }) => {
    // the guest account is shared: invites would mail strangers as us
    if (isGuestSession(session)) {
      throw new ForbiddenError('Sign in with Google to invite people');
    }
    const organizationId = parseId(params.id);
    await authorizeWorkspace(userId, organizationId, 'manage');
    const workspace = await getWorkspaceSummary(organizationId);
    if (!workspace) throw new NotFoundError('Workspace not found');

    const emails = [...new Set(body.emails.map((e) => e.trim().toLowerCase()))];
    enforceQuota(
      { request, session },
      'invite',
      DAILY_QUOTAS.invite,
      LIMIT_MESSAGE,
    );
    // the whole batch has to fit under today's limit
    assertUnderDailyLimit(
      (await countInvitesSentSince(userId, dayAgo())) + emails.length - 1,
      DAILY_QUOTAS.invite.limit,
      LIMIT_MESSAGE,
    );

    const inviterName = session.user?.name ?? 'A teammate';
    const result: InviteToWorkspaceResult = { invited: [], skipped: [] };

    for (const email of emails) {
      if (isGuestEmail(email)) {
        result.skipped.push({
          email,
          reason: 'The demo guest account can’t be invited',
        });
        continue;
      }
      const inviteeId = await getUserIdByEmail(email);
      if (inviteeId && (await getOrgRole(inviteeId, organizationId))) {
        result.skipped.push({ email, reason: 'Already in this workspace' });
        continue;
      }
      if (await hasPendingWorkspaceInvitation(organizationId, email)) {
        result.skipped.push({ email, reason: 'Already invited' });
        continue;
      }

      const invitation = await createWorkspaceInvitation({
        organizationId,
        email,
        role: body.role,
        invitedBy: userId,
      });
      result.invited.push(toPendingWorkspaceInvitation(invitation));

      // people with an account hear about it in the app right away
      if (inviteeId) {
        const notification = await createNotification({
          recipientId: inviteeId,
          type: 'workspace_invite',
          payload: {
            organizationId,
            organizationName: workspace.name,
            actorUserId: userId,
            actorName: inviterName,
            role: body.role,
            token: invitation.token,
          },
        });
        void pushNotification(request, notification);
      }

      await sendWorkspaceInviteEmail({
        to: email,
        inviterName,
        workspaceName: workspace.name,
        role: body.role,
        token: invitation.token,
      });
    }

    return NextResponse.json(
      { created: result, message: 'Invitations sent', status: 201 },
      { status: 201 },
    );
  },
);

export const GET = createParamHandle<RouteParams>(
  {},
  async ({ params, userId }) => {
    const organizationId = parseId(params.id);
    await authorizeWorkspace(userId, organizationId, 'manage');
    const data = await listPendingWorkspaceInvitations(organizationId);
    return NextResponse.json(
      { data, message: 'Get invitations success', status: 200 },
      { status: 200 },
    );
  },
);
