// app/api/project/[id]/leave/route.ts: POST = leave the board yourself

import { revokePendingInvitationsBy } from '@/db/uniq-query/invitation/invitation-utils';
import {
  getProjectMemberRole,
  removeProjectMember,
} from '@/db/uniq-query/project/project-utils';
import { BadRequestError, NotFoundError } from '@/lib/api/errors';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { NextResponse } from 'next/server';
import { broadcastBoardsChanged } from '@/lib/realtime/board-events';

type RouteParams = { id: string };

export const POST = createParamHandle<RouteParams>(
  {},
  async ({ request, params, userId }) => {
    const projectId = parseId(params.id);
    const role = await getProjectMemberRole(projectId, userId);
    if (!role) throw new NotFoundError('You’re not on this board');
    if (role === 'owner') {
      throw new BadRequestError(
        'Hand the board to someone else before you leave it',
      );
    }
    await removeProjectMember(projectId, userId);
    await revokePendingInvitationsBy(projectId, userId);
    broadcastBoardsChanged(request, [projectId]);
    return NextResponse.json(
      { deleted: { projectId }, message: 'You left the board', status: 200 },
      { status: 200 },
    );
  },
);
