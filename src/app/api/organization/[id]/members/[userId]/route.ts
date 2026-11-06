// app/api/organization/[id]/members/[userId]/route.ts: PATCH = change role,
// DELETE = remove from the workspace

import {
  changeWorkspaceRole,
  removeWorkspaceMember,
} from '@/db/uniq-query/organization/workspace-member-utils';
import { BadRequestError, NotFoundError } from '@/lib/api/errors';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { pusherServer } from '@/lib/pusher-server';
import { authorizeWorkspace } from '@/lib/rbac/authorize-workspace';
import {
  changeWorkspaceRoleSchema,
  type ChangeWorkspaceRoleBody,
} from '@/validations/organization.validation';
import { NextResponse } from 'next/server';

type RouteParams = { id: string; userId: string };

const NOT_A_MEMBER = 'No such member, or it’s the owner';

export const PATCH = createParamHandle<RouteParams, ChangeWorkspaceRoleBody>(
  { body: changeWorkspaceRoleSchema },
  async ({ params, body, userId }) => {
    const organizationId = parseId(params.id);
    const targetUserId = parseId(params.userId);
    await authorizeWorkspace(userId, organizationId, 'manage');
    if (targetUserId === userId) {
      throw new BadRequestError('You can’t change your own role');
    }
    if (!(await changeWorkspaceRole(organizationId, targetUserId, body.role))) {
      throw new NotFoundError(NOT_A_MEMBER);
    }
    return NextResponse.json(
      {
        updated: { userId: targetUserId, role: body.role },
        message: 'Role changed',
        status: 200,
      },
      { status: 200 },
    );
  },
);

export const DELETE = createParamHandle<RouteParams>(
  {},
  async ({ params, userId }) => {
    const organizationId = parseId(params.id);
    const targetUserId = parseId(params.userId);
    await authorizeWorkspace(userId, organizationId, 'manage');
    if (targetUserId === userId) {
      throw new BadRequestError('You can’t remove yourself');
    }
    if (!(await removeWorkspaceMember(organizationId, targetUserId))) {
      throw new NotFoundError(NOT_A_MEMBER);
    }
    // they lost boards: drop live sockets so they stop hearing about them
    pusherServer
      .terminateUserConnections(targetUserId)
      .catch((e) => console.error('Pusher terminate failed:', e));
    return NextResponse.json(
      {
        deleted: { userId: targetUserId },
        message: 'Member removed',
        status: 200,
      },
      { status: 200 },
    );
  },
);
