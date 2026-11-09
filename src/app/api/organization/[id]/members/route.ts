// app/api/organization/[id]/members/route.ts: GET = members (and board guests
// for the owner and admins), POST = add a board guest to the workspace

import {
  addGuestToWorkspace,
  listWorkspaceBoardIds,
  listBoardGuests,
  listWorkspaceMembers,
} from '@/db/uniq-query/organization/workspace-member-utils';
import { BadRequestError } from '@/lib/api/errors';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { authorizeWorkspace } from '@/lib/rbac/authorize-workspace';
import { canManageWorkspace } from '@/lib/rbac/workspace-permissions';
import type { WorkspaceMembersResponse } from '@/types';
import {
  addWorkspaceGuestSchema,
  type AddWorkspaceGuestBody,
} from '@/validations/organization.validation';
import { NextResponse } from 'next/server';
import { broadcastBoardsChanged } from '@/lib/realtime/board-events';

type RouteParams = { id: string };

export const GET = createParamHandle<RouteParams>(
  {},
  async ({ params, userId }) => {
    const organizationId = parseId(params.id);
    const role = await authorizeWorkspace(userId, organizationId, 'view');
    const data: WorkspaceMembersResponse = {
      members: await listWorkspaceMembers(organizationId),
      guests: canManageWorkspace(role)
        ? await listBoardGuests(organizationId)
        : [],
    };
    return NextResponse.json(
      { data, message: 'Get members success', status: 200 },
      { status: 200 },
    );
  },
);

export const POST = createParamHandle<RouteParams, AddWorkspaceGuestBody>(
  { body: addWorkspaceGuestSchema },
  async ({ request, params, body, userId }) => {
    const organizationId = parseId(params.id);
    await authorizeWorkspace(userId, organizationId, 'manage');
    if (!(await addGuestToWorkspace(organizationId, body.userId))) {
      throw new BadRequestError(
        'They’re not a guest on this workspace’s boards',
      );
    }
    broadcastBoardsChanged(
      request,
      await listWorkspaceBoardIds(organizationId),
    );
    return NextResponse.json(
      { created: { userId: body.userId }, message: 'Added', status: 201 },
      { status: 201 },
    );
  },
);
