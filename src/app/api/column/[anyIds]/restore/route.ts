// app/api/column/[anyIds]/restore/route.ts: POST = bring deleted columns back

import {
  getDeletedColumnLinks,
  restoreColumns,
} from '@/db/uniq-query/column/column-utils';
import { NotFoundError } from '@/lib/api/errors';
import { createParamHandle } from '@/lib/api/handle';
import { parseIdList } from '@/lib/api/params';
import { authorizeOrThrow } from '@/lib/rbac/authorize';
import { broadcastColumns } from '@/lib/realtime/board-events';
import { NextResponse } from 'next/server';

type RouteParams = { anyIds: string };

export const POST = createParamHandle<RouteParams>(
  {},
  async ({ request, params, userId }) => {
    const columnIds = parseIdList(params.anyIds);
    const links = await getDeletedColumnLinks(columnIds);
    if (links.length === 0) throw new NotFoundError('Nothing to restore');

    const projectIds = [...new Set(links.map((l) => l.projectId))];
    // restoring undoes a delete, so it takes the same right
    await authorizeOrThrow(userId, projectIds, 'column:delete');

    const restored = await restoreColumns(links.map((l) => l.columnId));
    broadcastColumns(request, restored);
    return NextResponse.json(
      { updated: restored, message: 'Columns restored', status: 200 },
      { status: 200 },
    );
  },
);
