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
import { BadRequestError, NotFoundError } from '@/lib/api/errors';
import { createParamHandle } from '@/lib/api/handle';
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
    resolveProjectIds: ({ params }) => [params.id],
  },
  async ({ params, body, userId, session, request }) => {
    const projectId = params.id;
    const email = body.email.trim().toLowerCase();

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
    resolveProjectIds: ({ params }) => [params.id],
  },
  async ({ params }) => {
    const data = await listPendingInvitations(params.id);
    return NextResponse.json(
      { data, message: 'Get invitations success', status: 200 },
      { status: 200 },
    );
  },
);
