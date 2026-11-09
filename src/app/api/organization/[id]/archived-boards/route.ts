// app/api/organization/[id]/archived-boards/route.ts: GET = archived boards you're on

import { listArchivedBoards } from '@/db/uniq-query/organization/organization-utils';
import { getOrgRole } from '@/db/uniq-query/project/project-utils';
import { ForbiddenError } from '@/lib/api/errors';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { NextResponse } from 'next/server';

type RouteParams = { id: string };

export const GET = createParamHandle<RouteParams>(
  {},
  async ({ params, userId }) => {
    const organizationId = parseId(params.id);
    if (!(await getOrgRole(userId, organizationId))) {
      throw new ForbiddenError('You’re not in this workspace');
    }
    const data = await listArchivedBoards(organizationId, userId);
    return NextResponse.json(
      { data, message: 'Get archived boards success', status: 200 },
      { status: 200 },
    );
  },
);
