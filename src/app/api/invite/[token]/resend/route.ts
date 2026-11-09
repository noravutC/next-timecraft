// app/api/invite/[token]/resend/route.ts: POST = email a board invitation
// again, valid for another 7 days

import {
  getInvitationByToken,
  renewInvitation,
  toPendingInvitation,
} from '@/db/uniq-query/invitation/invitation-utils';
import { getProjectNameById } from '@/db/uniq-query/project/project-utils';
import { ForbiddenError, NotFoundError } from '@/lib/api/errors';
import { createParamHandle, enforceQuota } from '@/lib/api/handle';
import { DAILY_QUOTAS } from '@/lib/api/quotas';
import { sendBoardInviteEmail } from '@/lib/email/send-board-invite';
import { isGuestSession } from '@/lib/guest';
import { authorizeOrThrow } from '@/lib/rbac/authorize';
import { ROLE_LABELS } from '@/lib/rbac/role-labels';
import { NextResponse } from 'next/server';

type RouteParams = { token: string };

export const POST = createParamHandle<RouteParams>(
  {},
  async ({ params, userId, session, request }) => {
    if (isGuestSession(session)) {
      throw new ForbiddenError('Sign in with Google to invite people');
    }
    const invitation = await getInvitationByToken(params.token);
    if (!invitation) throw new NotFoundError('Invitation not found');
    await authorizeOrThrow(userId, [invitation.projectId], 'member:invite');
    enforceQuota(
      { request, session },
      'invite',
      DAILY_QUOTAS.invite,
      'Daily invite limit reached. Try again tomorrow.',
    );

    const renewed = await renewInvitation(invitation.id);
    if (!renewed) throw new NotFoundError('This invitation isn’t pending');
    await sendBoardInviteEmail({
      to: renewed.email,
      inviterName: session.user?.name ?? 'A teammate',
      boardName: (await getProjectNameById(renewed.projectId)) ?? 'a board',
      roleLabel: ROLE_LABELS[renewed.role],
      token: renewed.token,
    });

    return NextResponse.json(
      {
        created: toPendingInvitation(renewed),
        message: 'Invitation sent again',
        status: 200,
      },
      { status: 200 },
    );
  },
);
