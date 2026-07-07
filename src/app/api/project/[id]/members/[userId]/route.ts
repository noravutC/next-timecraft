// app/api/project/[id]/members/[userId]/route.ts — DELETE = remove member

import { createNotification } from '@/db/uniq-query/notification/notification-utils';
import {
  getProjectMemberRole,
  getProjectNameById,
  removeProjectMember,
} from '@/db/uniq-query/project/project-utils';
import { BadRequestError, NotFoundError } from '@/lib/api/errors';
import { createParamHandle } from '@/lib/api/handle';
import { triggerExclusive } from '@/lib/pusher-server';
import { NextResponse } from 'next/server';

type RouteParams = { id: string; userId: string };

export const DELETE = createParamHandle<RouteParams>(
  {
    permission: 'member:remove',
    resolveProjectIds: ({ params }) => [params.id],
  },
  async ({ params, userId, session, request }) => {
    const projectId = params.id;
    const targetUserId = params.userId;

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

    const deleted = await removeProjectMember(projectId, targetUserId);

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
    ).catch((e) => console.error('Pusher notif failed:', e));

    return NextResponse.json(
      { deleted, message: 'Member removed', status: 200 },
      { status: 200 },
    );
  },
);
