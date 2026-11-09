// app/api/invite/[token]/route.ts — GET = preview, POST = accept, DELETE = revoke

import {
  acceptInvitation,
  getInvitationByToken,
  revokeInvitation,
} from '@/db/uniq-query/invitation/invitation-utils';
import {
  getProjectNameById,
  isProjectMember,
} from '@/db/uniq-query/project/project-utils';
import { invitationStatus } from '@/helper/utils/invitation-status';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '@/lib/api/errors';
import { createParamHandle } from '@/lib/api/handle';
import { authorizeOrThrow } from '@/lib/rbac/authorize';
import type { InvitationPreview } from '@/types';
import { NextResponse } from 'next/server';
import { isGuestSession } from '@/lib/guest';
import { createNotification } from '@/db/uniq-query/notification/notification-utils';
import { pushNotification } from '@/lib/pusher-server';
import { broadcastBoardsChanged } from '@/lib/realtime/board-events';

type RouteParams = { token: string };

// preview ให้หน้า /invite/[token] แสดงชื่อบอร์ด/role ก่อนกด Accept —
// ต้องมี session (wrapper บังคับ) แต่ไม่ต้องเป็น member
export const GET = createParamHandle<RouteParams>(
  {},
  async ({ params, session }) => {
    const invitation = await getInvitationByToken(params.token);
    if (!invitation) throw new NotFoundError('Invitation not found');

    const sessionEmail = session.user?.email?.toLowerCase() ?? null;
    const data: InvitationPreview = {
      projectName: (await getProjectNameById(invitation.projectId)) ?? 'a board',
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

// accept — คนรับเชิญยังไม่เป็น member จึงไม่มี permission config;
// สิทธิ์คือ "ถือ token + login ด้วยอีเมลที่ถูกเชิญ"
export const POST = createParamHandle<RouteParams>(
  {},
  async ({ params, userId, session, request }) => {
    if (isGuestSession(session)) {
      throw new ForbiddenError('Sign in with Google to join a board');
    }
    const invitation = await getInvitationByToken(params.token);
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
    if (status === 'accepted') {
      // กดซ้ำ/เปิดลิงก์ซ้ำหลัง accept แล้ว — สำเร็จแบบ idempotent ถ้าเป็น member อยู่
      if (await isProjectMember(userId, invitation.projectId)) {
        return NextResponse.json(
          {
            created: { projectId: invitation.projectId },
            message: 'Invitation already accepted',
            status: 200,
          },
          { status: 200 },
        );
      }
      throw new BadRequestError('This invitation has already been used');
    }

    if (!(await acceptInvitation(invitation, userId))) {
      throw new BadRequestError('This invitation is no longer valid');
    }
    broadcastBoardsChanged(request, [invitation.projectId]);
    if (invitation.invitedBy && invitation.invitedBy !== userId) {
      const notification = await createNotification({
        recipientId: invitation.invitedBy,
        type: 'invite_accepted',
        payload: {
          projectId: invitation.projectId,
          projectName:
            (await getProjectNameById(invitation.projectId)) ?? 'a board',
          actorUserId: userId,
          actorName: session.user?.name ?? 'Someone',
        },
      });
      void pushNotification(request, notification);
    }

    return NextResponse.json(
      {
        created: { projectId: invitation.projectId },
        message: 'Invitation accepted',
        status: 200,
      },
      { status: 200 },
    );
  },
);

// revoke — ต้องมีสิทธิ์ member:invite บนบอร์ดของคำเชิญ (lookup ก่อนค่อยเช็ค)
export const DELETE = createParamHandle<RouteParams>(
  {},
  async ({ params, userId }) => {
    const invitation = await getInvitationByToken(params.token);
    if (!invitation) throw new NotFoundError('Invitation not found');
    await authorizeOrThrow(userId, [invitation.projectId], 'member:invite');

    if (invitation.acceptedAt) {
      throw new BadRequestError(
        'Invitation already accepted — remove the member instead',
      );
    }

    const deleted = await revokeInvitation(invitation.id);

    return NextResponse.json(
      { deleted, message: 'Invitation revoked', status: 200 },
      { status: 200 },
    );
  },
);
