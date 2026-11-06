// app/api/organization/[id]/invitations/[invitationId]/route.ts: DELETE = revoke

import { revokeWorkspaceInvitation } from '@/db/uniq-query/organization/workspace-invitation-utils';
import { NotFoundError } from '@/lib/api/errors';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { authorizeWorkspace } from '@/lib/rbac/authorize-workspace';
import { NextResponse } from 'next/server';

type RouteParams = { id: string; invitationId: string };

export const DELETE = createParamHandle<RouteParams>(
  {},
  async ({ params, userId }) => {
    const organizationId = parseId(params.id);
    await authorizeWorkspace(userId, organizationId, 'manage');
    const invitationId = parseId(params.invitationId);
    if (!(await revokeWorkspaceInvitation(organizationId, invitationId))) {
      throw new NotFoundError('No pending invitation to revoke');
    }
    return NextResponse.json(
      {
        deleted: { id: invitationId },
        message: 'Invitation revoked',
        status: 200,
      },
      { status: 200 },
    );
  },
);
