// app/api/project/[id]/members/[userId]/route.ts — DELETE = remove member,
// PATCH = change their role

import { revokePendingInvitationsBy } from '@/db/uniq-query/invitation/invitation-utils';
import { createNotification } from '@/db/uniq-query/notification/notification-utils';
import {
  changeProjectMemberRole,
  getProjectMemberRole,
  getProjectNameById,
  removeProjectMember,
} from '@/db/uniq-query/project/project-utils';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '@/lib/api/errors';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { assignableRoles, canManageMember, outranks } from '@/lib/rbac/can';
import {
  changeMemberRoleSchema,
  type ChangeMemberRoleBody,
} from '@/validations/project.validation';
import { pusherServer, triggerExclusive } from '@/lib/pusher-server';
import { NextResponse } from 'next/server';

type RouteParams = { id: string; userId: string };

export const DELETE = createParamHandle<RouteParams>(
  {
    permission: 'member:remove',
    resolveProjectIds: ({ params }) => [parseId(params.id)],
  },
  async ({ params, userId, session, request }) => {
    const projectId = parseId(params.id);
    const targetUserId = parseId(params.userId);

    if (targetUserId === userId) {
      throw new BadRequestError('You cannot remove yourself from the board');
    }

    const projectName = await getProjectNameById(projectId);
    if (!projectName) throw new NotFoundError('Board not found');

    const targetRole = await getProjectMemberRole(projectId, targetUserId);
    if (!targetRole) {
      throw new NotFoundError('This user is not a member of the board');
    }
    if (targetRole === 'owner') {
      throw new BadRequestError('The board owner cannot be removed');
    }
    const actorRole = await getProjectMemberRole(projectId, userId);
    if (!actorRole || !outranks(actorRole, targetRole)) {
      throw new ForbiddenError('You can only remove members below your role');
    }

    const deleted = await removeProjectMember(projectId, targetUserId);
    await revokePendingInvitationsBy(projectId, targetUserId);

    // แจ้งคนถูกลบ — กด notification แล้ว client จะเอาบอร์ดออกจาก list ตัวเอง
    const notification = await createNotification({
      recipientId: targetUserId,
      type: 'member_removed',
      payload: {
        projectId,
        projectName,
        actorUserId: userId,
        actorName: session.user?.name ?? 'A board admin',
      },
    });
    triggerExclusive(
      request,
      `user-${targetUserId}`,
      'notification-added',
      notification,
    )
      .catch((e) => console.error('Pusher notif failed:', e))
      // drop their live sockets so they can't keep listening to this board;
      // on reload they can only re-join channels they're still allowed on
      .finally(() =>
        pusherServer
          .terminateUserConnections(targetUserId)
          .catch((e) => console.error('Pusher terminate failed:', e)),
      );

    return NextResponse.json(
      { deleted, message: 'Member removed', status: 200 },
      { status: 200 },
    );
  },
);

export const PATCH = createParamHandle<RouteParams, ChangeMemberRoleBody>(
  {
    body: changeMemberRoleSchema,
    permission: 'member:change_role',
    resolveProjectIds: ({ params }) => [parseId(params.id)],
  },
  async ({ params, body, userId }) => {
    const projectId = parseId(params.id);
    const targetUserId = parseId(params.userId);
    if (targetUserId === userId) {
      throw new BadRequestError('You can’t change your own role');
    }
    const targetRole = await getProjectMemberRole(projectId, targetUserId);
    if (!targetRole) {
      throw new NotFoundError('This user is not a member of the board');
    }
    const actorRole = await getProjectMemberRole(projectId, userId);
    if (
      !actorRole ||
      !canManageMember(actorRole, targetRole) ||
      !assignableRoles(actorRole).includes(body.role)
    ) {
      throw new ForbiddenError('You can only give roles below your own');
    }

    const updated = await changeProjectMemberRole(
      projectId,
      targetUserId,
      body.role,
    );
    return NextResponse.json(
      { updated, message: 'Role changed', status: 200 },
      { status: 200 },
    );
  },
);
