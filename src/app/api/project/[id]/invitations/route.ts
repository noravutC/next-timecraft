// app/api/project/[id]/invitations/route.ts — POST = invite, GET = pending list

import {
  createInvitation,
  hasPendingInvitation,
  listPendingInvitations,
  toPendingInvitation,
} from '@/db/uniq-query/invitation/invitation-utils';
import { createNotification } from '@/db/uniq-query/notification/notification-utils';
import {
  getProjectNameById,
  isProjectMember,
} from '@/db/uniq-query/project/project-utils';
import { getUserIdByEmail } from '@/db/uniq-query/user/user-utils';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '@/lib/api/errors';
import { createParamHandle, enforceQuota } from '@/lib/api/handle';
import { assertUnderDailyLimit, DAILY_QUOTAS, dayAgo } from '@/lib/api/quotas';
import { isGuestEmail, isGuestSession } from '@/lib/guest';
import { countInvitesSentSince } from '@/db/uniq-query/quota/daily-usage';
import { parseId } from '@/lib/api/params';
import { sendBoardInviteEmail } from '@/lib/email/send-board-invite';
import { triggerExclusive } from '@/lib/pusher-server';
import { ROLE_LABELS } from '@/lib/rbac/role-labels';
import {
  inviteMemberSchema,
  type InviteMemberBody,
} from '@/validations/invitation.validation';
import { NextResponse } from 'next/server';

type RouteParams = { id: string };

export const POST = createParamHandle<RouteParams, InviteMemberBody>(
  {
    body: inviteMemberSchema,
    permission: 'member:invite',
    resolveProjectIds: ({ params }) => [parseId(params.id)],
  },
  async ({ params, body, userId, session, request }) => {
    // guests share one account: an invite would pull a real user's data into
    // a board every visitor can open, and lets anyone send mail as us
    if (isGuestSession(session)) {
      throw new ForbiddenError('Sign in with Google to invite people');
    }
    enforceQuota(
      { request, session },
      'invite',
      DAILY_QUOTAS.invite,
      'Daily invite limit reached. Try again tomorrow.',
    );

    assertUnderDailyLimit(
      await countInvitesSentSince(userId, dayAgo()),
      DAILY_QUOTAS.invite.limit,
      'Daily invite limit reached. Try again tomorrow.',
    );

    const projectId = parseId(params.id);
    const email = body.email.trim().toLowerCase();
    // every guest visitor signs in as this address: inviting it would open
    // the board to anyone who clicks "Continue as guest"
    if (isGuestEmail(email)) {
      throw new BadRequestError("The demo guest account can't be invited");
    }

    const projectName = await getProjectNameById(projectId);
    if (!projectName) throw new NotFoundError('Board not found');

    const inviteeId = await getUserIdByEmail(email);
    if (inviteeId && (await isProjectMember(inviteeId, projectId))) {
      throw new BadRequestError('This user is already a member of the board');
    }
    if (await hasPendingInvitation(projectId, email)) {
      throw new BadRequestError('This email has already been invited');
    }

    const invitation = await createInvitation({
      projectId,
      email,
      role: body.role,
      invitedBy: userId,
    });

    const inviterName = session.user?.name ?? 'A teammate';

    // มีบัญชีอยู่แล้ว → in-app notification ทันที (ยังไม่มีบัญชีรอรับทางอีเมล)
    if (inviteeId) {
      const notification = await createNotification({
        recipientId: inviteeId,
        type: 'board_invite',
        payload: {
          projectId,
          projectName,
          actorUserId: userId,
          actorName: inviterName,
          role: body.role,
          token: invitation.token,
        },
      });
      triggerExclusive(
        request,
        `user-${inviteeId}`,
        'notification-added',
        notification,
      ).catch((e) => console.error('Pusher notif failed:', e));
    }

    // helper จัดการ error/ไม่มี key เอง — ไม่ทำให้ invite ล้ม
    await sendBoardInviteEmail({
      to: email,
      inviterName,
      boardName: projectName,
      roleLabel: ROLE_LABELS[body.role],
      token: invitation.token,
    });

    return NextResponse.json(
      {
        created: toPendingInvitation(invitation),
        message: 'Invitation sent',
        status: 201,
      },
      { status: 201 },
    );
  },
);

export const GET = createParamHandle<RouteParams>(
  {
    permission: 'member:invite',
    resolveProjectIds: ({ params }) => [parseId(params.id)],
  },
  async ({ params }) => {
    const data = await listPendingInvitations(parseId(params.id));
    return NextResponse.json(
      { data, message: 'Get invitations success', status: 200 },
      { status: 200 },
    );
  },
);
