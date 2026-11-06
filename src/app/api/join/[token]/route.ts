// app/api/join/[token]/route.ts: GET = preview a workspace invitation, POST = accept

import { getWorkspaceSummary } from '@/db/uniq-query/organization/organization-utils';
import {
  acceptWorkspaceInvitation,
  getWorkspaceInvitationByToken,
} from '@/db/uniq-query/organization/workspace-invitation-utils';
import { getOrgRole } from '@/db/uniq-query/project/project-utils';
import { invitationStatus } from '@/helper/utils/invitation-status';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '@/lib/api/errors';
import { createParamHandle } from '@/lib/api/handle';
import { isGuestSession } from '@/lib/guest';
import { createNotification } from '@/db/uniq-query/notification/notification-utils';
import { pushNotification } from '@/lib/pusher-server';
import type { WorkspaceInvitationPreview } from '@/types';
import { NextResponse } from 'next/server';
import { broadcastBoardsChanged } from '@/lib/realtime/board-events';
import { listWorkspaceBoardIds } from '@/db/uniq-query/organization/workspace-member-utils';

type RouteParams = { token: string };

// needs a session (the wrapper checks) but not a membership
export const GET = createParamHandle<RouteParams>(
  {},
  async ({ params, session }) => {
    const invitation = await getWorkspaceInvitationByToken(params.token);
    if (!invitation) throw new NotFoundError('Invitation not found');

    const workspace = await getWorkspaceSummary(invitation.organizationId);
    const sessionEmail = session.user?.email?.toLowerCase() ?? null;
    const data: WorkspaceInvitationPreview = {
      workspaceName: workspace?.name ?? 'a workspace',
      workspaceLogo: workspace?.logo ?? null,
      role: invitation.role,
      email: invitation.email,
      status: invitationStatus(invitation),
      emailMatches: sessionEmail === invitation.email,
    };

    return NextResponse.json(
      { data, message: 'Get invitation success', status: 200 },
      { status: 200 },
    );
  },
);

// the invitee isn't a member yet: holding the token and signing in with the
// invited address is what allows it
export const POST = createParamHandle<RouteParams>(
  {},
  async ({ params, userId, session, request }) => {
    if (isGuestSession(session)) {
      throw new ForbiddenError('Sign in with Google to join a workspace');
    }
    const invitation = await getWorkspaceInvitationByToken(params.token);
    if (!invitation) throw new NotFoundError('Invitation not found');

    const sessionEmail = session.user?.email?.toLowerCase();
    if (!sessionEmail || sessionEmail !== invitation.email) {
      throw new ForbiddenError(
        'This invitation was sent to a different email address',
      );
    }

    const status = invitationStatus(invitation);
    if (status === 'revoked') {
      throw new BadRequestError('This invitation has been revoked');
    }
    if (status === 'expired') {
      throw new BadRequestError('This invitation has expired');
    }
    const joined = { organizationId: invitation.organizationId };
    if (status === 'accepted') {
      // opening the link again after joining is fine
      if (await getOrgRole(userId, invitation.organizationId)) {
        return NextResponse.json(
          {
            created: joined,
            message: 'Invitation already accepted',
            status: 200,
          },
          { status: 200 },
        );
      }
      throw new BadRequestError('This invitation has already been used');
    }

    if (!(await acceptWorkspaceInvitation(invitation, userId))) {
      throw new BadRequestError('This invitation is no longer valid');
    }
    broadcastBoardsChanged(
      request,
      await listWorkspaceBoardIds(invitation.organizationId),
    );
    if (invitation.invitedBy && invitation.invitedBy !== userId) {
      const workspace = await getWorkspaceSummary(invitation.organizationId);
      const notification = await createNotification({
        recipientId: invitation.invitedBy,
        type: 'invite_accepted',
        payload: {
          organizationId: invitation.organizationId,
          organizationName: workspace?.name ?? 'your workspace',
          actorUserId: userId,
          actorName: session.user?.name ?? 'Someone',
        },
      });
      void pushNotification(request, notification);
    }

    return NextResponse.json(
      { created: joined, message: 'Invitation accepted', status: 200 },
      { status: 200 },
    );
  },
);
