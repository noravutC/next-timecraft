// app/api/organization/[id]/archived-boards/route.ts: GET = archived boards you're on

import { listArchivedBoards } from '@/db/uniq-query/organization/organization-utils';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { authorizeWorkspace } from '@/lib/rbac/authorize-workspace';
import { NextResponse } from 'next/server';

type RouteParams = { id: string };

export const GET = createParamHandle<RouteParams>(
  {},
  async ({ params, userId }) => {
    const organizationId = parseId(params.id);
    await authorizeWorkspace(userId, organizationId, 'view');
    const data = await listArchivedBoards(organizationId, userId);
    return NextResponse.json(
      { data, message: 'Get archived boards success', status: 200 },
      { status: 200 },
    );
  },
);
