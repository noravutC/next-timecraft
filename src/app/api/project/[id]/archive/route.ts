// app/api/project/[id]/archive/route.ts: GET = archived tasks and deleted columns

import { getBoardArchive } from '@/db/uniq-query/task/archive-utils';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { NextResponse } from 'next/server';

type RouteParams = { id: string };

export const GET = createParamHandle<RouteParams>(
  {
    permission: 'project:view',
    resolveProjectIds: ({ params }) => [parseId(params.id)],
  },
  async ({ params }) => {
    const data = await getBoardArchive(parseId(params.id));
    return NextResponse.json(
      { data, message: 'Get archive success', status: 200 },
      { status: 200 },
    );
  },
);
